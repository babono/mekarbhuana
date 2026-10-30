'use server'

import { revalidatePath } from 'next/cache'
import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'

import { ENQUIRY_TOPICS } from '@/collections/Enquiries'
import { getPayloadAndUser, getPayloadClient } from '@/lib/auth'
import { paymentUrlFor, pendingSubscriptionFor } from '@/lib/checkout'
import { upgradeLegacyPassword } from '@/lib/legacyPassword'

export type FormState = { error?: string; success?: string }

const AUTH_COOKIE = 'payload-token'

const str = (data: FormData, key: string) => String(data.get(key) ?? '').trim()

const setAuthCookie = async (token: string, expiresAt: number) => {
  const store = await cookies()
  store.set(AUTH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: new Date(expiresAt * 1000),
  })
}

/** This deployment's own address, for the URLs Midtrans sends readers and notifications back to. */
const siteOrigin = async (): Promise<string> => {
  const h = await headers()
  const host = h.get('x-forwarded-host') ?? h.get('host')
  const proto = h.get('x-forwarded-proto') ?? (host?.startsWith('localhost') ? 'http' : 'https')
  return `${proto}://${host}`
}

/**
 * Create a reading account and sign the reader straight in.
 *
 * Fields are copied across one by one rather than spread from the form: that is
 * what stops a crafted request from setting `roles` or a membership window.
 */
export async function registerAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const name = str(formData, 'name')
  const email = str(formData, 'email').toLowerCase()
  const password = str(formData, 'password')
  const country = str(formData, 'country')
  const newsletter = formData.get('newsletter') === 'on'
  const planId = str(formData, 'plan')

  if (!name || !email || !password) {
    return { error: 'Please fill in your name, email address and a password.' }
  }
  if (password.length < 8) {
    return { error: 'Please choose a password of at least 8 characters.' }
  }

  const payload = await getPayloadClient()

  const existing = await payload.find({
    collection: 'users',
    where: { email: { equals: email } },
    limit: 1,
    depth: 0,
  })
  if (existing.docs.length > 0) {
    return { error: 'There is already an account with that email address. Try logging in.' }
  }

  let next = '/account?welcome=1'

  try {
    const user = await payload.create({
      collection: 'users',
      data: {
        name,
        email,
        password,
        country: country || undefined,
        newsletter,
        roles: ['member'],
        membershipStatus: 'none',
      },
    })

    const result = await payload.login({
      collection: 'users',
      data: { email, password },
    })

    if (result.token && result.exp) await setAuthCookie(result.token, result.exp)

    if (planId) {
      // The account exists either way; if Midtrans is unreachable the reader can
      // pay from their account page instead of starting over.
      try {
        const sub = await pendingSubscriptionFor(payload, user, planId)
        next = await paymentUrlFor(payload, sub, user, await siteOrigin())
      } catch (error) {
        payload.logger.error({ err: error }, `Could not open payment for ${email}`)
        next = '/account?welcome=1&payment=unavailable'
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Something went wrong.'
    return { error: message }
  }

  revalidatePath('/', 'layout')
  redirect(next)
}

/**
 * Send a signed-in reader to pay — for a newly chosen plan, or to finish an
 * order already on their account.
 */
export async function checkoutAction(formData: FormData): Promise<void> {
  const planId = str(formData, 'plan')
  const subscriptionId = str(formData, 'subscription')

  const { payload, user } = await getPayloadAndUser()
  if (!user) redirect(planId ? `/join?plan=${encodeURIComponent(planId)}` : '/login')

  let next: string
  try {
    let sub
    if (subscriptionId) {
      sub = await payload.findByID({ collection: 'subscriptions', id: subscriptionId, depth: 0 })
      const owner = typeof sub.user === 'object' ? sub.user.id : sub.user
      if (owner !== user.id) throw new Error('not yours')
    } else {
      sub = await pendingSubscriptionFor(payload, user, planId)
    }
    next = await paymentUrlFor(payload, sub, user, await siteOrigin())
  } catch (error) {
    payload.logger.error({ err: error }, `Could not open payment for ${user.email}`)
    next = '/account?payment=unavailable'
  }

  redirect(next)
}

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = str(formData, 'email').toLowerCase()
  const password = str(formData, 'password')

  if (!email || !password) {
    return { error: 'Please enter your email address and password.' }
  }

  const payload = await getPayloadClient()

  try {
    let result

    try {
      result = await payload.login({ collection: 'users', data: { email, password } })
    } catch (rejected) {
      // Readers carried over from WordPress have a random password here and
      // their real one only as an old hash, so a first sign-in always lands
      // in this branch. If the password checks out against that hash the
      // account is upgraded in place and the login retried; if not, the
      // original rejection stands.
      if (!(await upgradeLegacyPassword(payload, email, password))) throw rejected
      result = await payload.login({ collection: 'users', data: { email, password } })
    }

    if (!result.token || !result.exp) {
      return { error: 'That email address and password did not match.' }
    }
    await setAuthCookie(result.token, result.exp)
  } catch {
    // Deliberately vague: do not confirm whether an account exists.
    return { error: 'That email address and password did not match.' }
  }

  revalidatePath('/', 'layout')
  redirect('/account')
}

/**
 * Email a reset link. The answer is the same whether or not the address has an
 * account, so the form cannot be used to find out who is a member.
 */
export async function forgotPasswordAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const email = str(formData, 'email').toLowerCase()
  if (!email) return { error: 'Please enter the email address you signed up with.' }

  const payload = await getPayloadClient()
  try {
    await payload.forgotPassword({ collection: 'users', data: { email } })
  } catch (error) {
    payload.logger.error({ err: error }, `Password reset email for ${email}`)
  }

  return {
    success:
      'If that address has an account, a reset link is on its way. It works for one hour — check your spam folder if it does not arrive in a few minutes.',
  }
}

/** Set the new password from a reset link, then sign the reader straight in. */
export async function resetPasswordAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const token = str(formData, 'token')
  const password = str(formData, 'password')
  const confirm = str(formData, 'confirm')

  if (!token) return { error: 'This reset link is incomplete. Please request a new one.' }
  if (password.length < 8) return { error: 'Please choose a password of at least 8 characters.' }
  if (password !== confirm) return { error: 'The two passwords do not match.' }

  const payload = await getPayloadClient()
  try {
    const result = await payload.resetPassword({
      collection: 'users',
      data: { token, password },
      overrideAccess: true,
    })
    if (result.token && result.user) {
      const exp =
        Math.floor(Date.now() / 1000) +
        (payload.collections.users.config.auth.tokenExpiration ?? 7200)
      await setAuthCookie(result.token, exp)
    }
  } catch {
    return { error: 'This reset link has expired or was already used. Please request a new one.' }
  }

  revalidatePath('/', 'layout')
  redirect('/account?password=reset')
}

export async function logoutAction(): Promise<void> {
  const store = await cookies()
  store.delete(AUTH_COOKIE)
  revalidatePath('/', 'layout')
  redirect('/')
}

export async function enquiryAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const name = str(formData, 'name')
  const email = str(formData, 'email')
  const topic = str(formData, 'topic')
  const message = str(formData, 'message')

  if (!name || !email || !message) {
    return { error: 'Please give us your name, email address and a message.' }
  }
  if (!ENQUIRY_TOPICS.some((option) => option.value === topic)) {
    return { error: 'Please choose what your message is about.' }
  }

  const payload = await getPayloadClient()

  await payload.create({
    collection: 'enquiries',
    data: {
      name,
      email,
      topic: topic as (typeof ENQUIRY_TOPICS)[number]['value'],
      message,
    },
  })

  return { success: 'Thank you — we reply within two working days.' }
}
