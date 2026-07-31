'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'

import { enquiryAction, type FormState } from '@/app/(frontend)/actions'
import { ENQUIRY_TOPICS } from '@/collections/Enquiries'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" className="btn btn-crimson block w-full" disabled={pending}>
      {pending ? 'Sending…' : 'Send'}
    </button>
  )
}

export function ContactForm({ defaultTopic }: { defaultTopic?: string }) {
  const [state, formAction] = useActionState<FormState, FormData>(enquiryAction, {})

  if (state.success) {
    return (
      <div className="border-l-[3px] border-sage bg-[#eef3e8] px-4 py-3.5 font-body text-sm leading-relaxed text-[#40602a]">
        {state.success}
      </div>
    )
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.error && (
        <div className="border-l-[3px] border-crimson bg-[#fbeceb] px-4 py-3.5 font-body text-sm leading-relaxed text-crimson">
          {state.error}
        </div>
      )}

      <input name="name" className="field" placeholder="Your name" autoComplete="name" required />
      <input
        name="email"
        type="email"
        className="field"
        placeholder="Email address"
        autoComplete="email"
        required
      />
      <select name="topic" className="field" defaultValue={defaultTopic ?? ''} required>
        <option value="" disabled>
          What is this about?
        </option>
        {ENQUIRY_TOPICS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <textarea
        name="message"
        className="field"
        rows={6}
        placeholder="Tell us what you have in mind, and when"
        required
      />

      <SubmitButton />

      <div className="font-label text-[11px] leading-[1.7] text-shadow uppercase">
        We reply within two working days
      </div>
    </form>
  )
}
