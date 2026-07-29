'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { ENQUIRY_TOPICS } from '@/collections/Enquiries'
import { getPayloadClient } from '@/lib/auth'

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

    // Record the intent to subscribe so staff can match it against a payment.
    // Nothing is charged here — activation is manual until a gateway is wired up.
    if (planId) {
      const plan = await payload.findByID({ collection: 'plans', id: planId, depth: 0 })
      await payload.create({
        collection: 'subscriptions',
        data: {
          user: user.id,
          plan: plan.id,
          status: 'pending',
          amount: plan.price,
          currency: plan.currency,
        },
      })
    }

    const result = await payload.login({
      collection: 'users',
      data: { email, password },
    })

    if (result.token && result.exp) await setAuthCookie(result.token, result.exp)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Something went wrong.'
    return { error: message }
  }

  redirect('/account?welcome=1')
}

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = str(formData, 'email').toLowerCase()
  const password = str(formData, 'password')

  if (!email || !password) {
    return { error: 'Please enter your email address and password.' }
  }

  const payload = await getPayloadClient()

  try {
    const result = await payload.login({
      collection: 'users',
      data: { email, password },
    })
    if (!result.token || !result.exp) {
      return { error: 'That email address and password did not match.' }
    }
    await setAuthCookie(result.token, result.exp)
  } catch {
    // Deliberately vague: do not confirm whether an account exists.
    return { error: 'That email address and password did not match.' }
  }

  redirect('/account')
}

export async function logoutAction(): Promise<void> {
  const store = await cookies()
  store.delete(AUTH_COOKIE)
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
