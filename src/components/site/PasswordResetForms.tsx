'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'

import { forgotPasswordAction, resetPasswordAction, type FormState } from '@/app/(frontend)/actions'

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" className="btn btn-crimson block w-full" disabled={pending}>
      {pending ? pendingLabel : label}
    </button>
  )
}

function Notice({ state }: { state: FormState }) {
  if (state.error) {
    return (
      <div className="border-l-[3px] border-crimson bg-[#fbeceb] px-4 py-3.5 font-body text-sm leading-relaxed text-crimson">
        {state.error}
      </div>
    )
  }
  if (state.success) {
    return (
      <div className="border-l-[3px] border-sage bg-[#eef3e8] px-4 py-3.5 font-body text-sm leading-relaxed text-[#40602a]">
        {state.success}
      </div>
    )
  }
  return null
}

export function ForgotPasswordForm() {
  const [state, formAction] = useActionState<FormState, FormData>(forgotPasswordAction, {})

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Notice state={state} />

      <div>
        <label className="kicker mb-2.5 block" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          className="field"
          placeholder="you@example.com"
          autoComplete="email"
          required
        />
      </div>

      <SubmitButton label="Send reset link" pendingLabel="Sending…" />

      <div className="text-center font-body text-[13.5px] leading-relaxed font-normal text-soft">
        Remembered it? <Link href="/login">Back to login</Link>
      </div>
    </form>
  )
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction] = useActionState<FormState, FormData>(resetPasswordAction, {})

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Notice state={state} />
      <input type="hidden" name="token" value={token} />

      <div>
        <label className="kicker mb-2.5 block" htmlFor="password">
          New password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          className="field"
          placeholder="At least 8 characters"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </div>

      <div>
        <label className="kicker mb-2.5 block" htmlFor="confirm">
          Type it again
        </label>
        <input
          id="confirm"
          name="confirm"
          type="password"
          className="field"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </div>

      <SubmitButton label="Save and log in" pendingLabel="Saving…" />

      {state.error && (
        <div className="text-center font-body text-[13.5px] leading-relaxed font-normal text-soft">
          <Link href="/forgot-password">Request a new link</Link>
        </div>
      )}
    </form>
  )
}
