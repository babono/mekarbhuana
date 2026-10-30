import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { ResetPasswordForm } from '@/components/site/PasswordResetForms'
import { Logo } from '@/components/site/Logo'
import { getMe } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Choose a new password',
  description: 'Pick something you have not used here before.',
}

function MissingToken() {
  return (
    <p className="m-0 font-body text-[15px] leading-[1.8] font-normal text-muted">
      This page needs the link from your reset email.{' '}
      <Link href="/forgot-password">Request a new link</Link>.
    </p>
  )
}

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams
  const user = await getMe()
  if (user) redirect('/account')

  return (
    <main>
      <section className="relative min-h-[620px] overflow-hidden bg-bark-700 px-[26px] pt-20 pb-[110px]">
        <div className="absolute inset-0 bg-radial-[90%_80%_at_50%_0%] from-gold/18 from-0% to-transparent to-65%" />

        <div className="relative mx-auto max-w-[470px]">
          <div className="mb-[38px] text-center">
            <Logo height={64} className="mx-auto mb-6" />
            <h1 className="m-0 mb-3 font-display text-[clamp(28px,3.6vw,42px)] leading-tight text-parchment">
              Choose a new password
            </h1>
            <p className="m-0 font-body text-[15px] leading-[1.7] font-normal text-dust">
              Pick something you have not used here before.
            </p>
          </div>

          <div className="bg-cream p-[38px]">
            {token ? <ResetPasswordForm token={token} /> : <MissingToken />}
          </div>
        </div>
      </section>
    </main>
  )
}
