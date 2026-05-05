import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const email = searchParams.get('email')

  if (!email) return NextResponse.json({ verified: true })

  const user = await prisma.user.findUnique({ where: { email } })

  // Return true if user doesn't exist (wrong password case, not unverified case)
  return NextResponse.json({ verified: !user || !!user.emailVerified })
}
