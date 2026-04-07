import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { AuthForm } from '@/components/AuthForm'

export default async function LoginPage() {
  const session = await auth()
  if (session) redirect('/')
  return <AuthForm />
}
