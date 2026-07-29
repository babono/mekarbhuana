'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'

import { registerAction, type FormState } from '@/app/(frontend)/actions'

function SubmitButton({ hasPlan }: { hasPlan: boolean }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" className="btn btn-crimson block w-full" disabled={pending}>
      {pending ? 'Creating your account…' : hasPlan ? 'Continue to payment' : 'Create my account'}
    </button>
  )
}

export function RegisterForm({ planId }: { planId?: string }) {
  const [state, formAction] = useActionState<FormState, FormData>(registerAction, {})

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.error && (
        <div className="border-l-[3px] border-crimson bg-[#fbeceb] px-4 py-3.5 font-body text-sm leading-relaxed text-crimson">
          {state.error}
        </div>
      )}
      {planId && <input type="hidden" name="plan" value={planId} />}

      <input name="name" className="field" placeholder="Full name" autoComplete="name" required />
      <input
        name="email"
        type="email"
        className="field"
        placeholder="Email address"
        autoComplete="email"
        required
      />
      <input
        name="password"
        type="password"
        className="field"
        placeholder="Choose a password"
        autoComplete="new-password"
        minLength={8}
        required
      />
      <input name="country" className="field" placeholder="Country" autoComplete="country-name" />

      <label className="mt-1.5 flex items-start gap-[11px] font-body text-[13.5px] leading-relaxed font-light text-muted">
        <input type="checkbox" name="newsletter" className="mt-[3px]" />
        <span>Email me when new ensembles are added to the encyclopedia.</span>
      </label>

      <SubmitButton hasPlan={Boolean(planId)} />

      <div className="text-center font-body text-[13.5px] leading-relaxed font-light text-soft">
        Already a member? <Link href="/login">Log in</Link>
      </div>
    </form>
  )
}
