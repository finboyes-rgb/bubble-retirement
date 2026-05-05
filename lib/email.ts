import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})

const from = process.env.GMAIL_USER
const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'

export async function sendVerificationEmail(to: string, token: string) {
  const url = `${baseUrl}/api/auth/verify-email?token=${token}`
  await transporter.sendMail({
    from,
    to,
    subject: 'Verify your Bubble Retirement account',
    html: `
      <p>Thanks for signing up. Click the link below to verify your email address:</p>
      <p><a href="${url}">${url}</a></p>
      <p>This link doesn't expire. If you didn't sign up, you can ignore this email.</p>
    `,
  })
}

export async function sendPasswordResetEmail(to: string, token: string) {
  const url = `${baseUrl}/auth/reset-password?token=${token}`
  await transporter.sendMail({
    from,
    to,
    subject: 'Reset your Bubble Retirement password',
    html: `
      <p>We received a request to reset your password. Click the link below:</p>
      <p><a href="${url}">${url}</a></p>
      <p>This link expires in 1 hour. If you didn't request this, you can ignore this email.</p>
    `,
  })
}
