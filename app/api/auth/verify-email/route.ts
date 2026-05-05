import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')

  if (!token) {
    return NextResponse.redirect(new URL('/login?error=invalid-token', request.url))
  }

  const user = await prisma.user.findUnique({
    where: { emailVerificationToken: token },
  })

  if (!user) {
    return NextResponse.redirect(new URL('/login?error=invalid-token', request.url))
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: new Date(), emailVerificationToken: null },
  })

  return NextResponse.redirect(new URL('/login?verified=true', request.url))
}
