const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'

async function sendEmail(to: string, subject: string, html: string) {
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': process.env.BREVO_API_KEY ?? '',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sender: { name: 'Bubble Retirement', email: process.env.BREVO_SENDER_EMAIL },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Brevo error ${res.status}: ${err}`)
  }
}

export async function sendVerificationEmail(to: string, token: string) {
  const url = `${baseUrl}/api/auth/verify-email?token=${token}`
  await sendEmail(
    to,
    'Verify your Bubble Retirement account',
    `<p>Thanks for signing up. Click the link below to verify your email address:</p>
     <p><a href="${url}">${url}</a></p>
     <p>If you didn't sign up, you can ignore this email.</p>`
  )
}

export async function sendPasswordResetEmail(to: string, token: string) {
  const url = `${baseUrl}/auth/reset-password?token=${token}`
  await sendEmail(
    to,
    'Reset your Bubble Retirement password',
    `<p>We received a request to reset your password. Click the link below:</p>
     <p><a href="${url}">${url}</a></p>
     <p>This link expires in 1 hour. If you didn't request this, you can ignore this email.</p>`
  )
}
