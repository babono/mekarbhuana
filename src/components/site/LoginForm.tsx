'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'

import { loginAction, type FormState } from '@/app/(frontend)/actions'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" className="btn btn-crimson block w-full" disabled={pending}>
      {pending ? 'Logging in…' : 'Log in'}
    </button>
  )
}

export function LoginForm() {
  const [state, formAction] = useActionState<FormState, FormData>(loginAction, {})

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.error && (
        <div className="border-l-[3px] border-crimson bg-[#fbeceb] px-4 py-3.5 font-body text-sm leading-relaxed text-crimson">
          {state.error}
        </div>
      )}

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

      <div>
        <label className="kicker mb-2.5 block" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          className="field"
          placeholder="••••••••"
          autoComplete="current-password"
          required
        />
      </div>

      <SubmitButton />

      <div className="text-center font-body text-[13.5px] leading-relaxed font-light text-soft">
        Not a member yet? <Link href="/join">Subscribe now</Link>
      </div>
    </form>
  )
}
