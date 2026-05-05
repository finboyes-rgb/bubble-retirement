import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { AuthForm } from '@/components/AuthForm'

interface Props {
  searchParams: Promise<{ verified?: string; reset?: string; error?: string }>
}

export default async function LoginPage({ searchParams }: Props) {
  const session = await auth()
  if (session) redirect('/')

  const params = await searchParams
  const banner =
    params.verified === 'true'
      ? 'verified'
      : params.reset === 'true'
      ? 'reset'
      : params.error === 'invalid-token'
      ? 'invalid-token'
      : undefined

  return <AuthForm banner={banner as 'verified' | 'reset' | 'invalid-token' | undefined} />
}
