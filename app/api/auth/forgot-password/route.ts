import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { sendPasswordResetEmail } from '@/lib/email'

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  if (!body?.email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 })
  }

  const { email } = body as { email: string }

  // Always return 200 to avoid leaking whether an email is registered
  const user = await prisma.user.findUnique({ where: { email } })
  if (user) {
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordResetToken: token, passwordResetExpiresAt: expiresAt },
    })

    await sendPasswordResetEmail(email, token)
  }

  return NextResponse.json({
    message: "If that email is registered, you'll receive a reset link shortly.",
  })
}
