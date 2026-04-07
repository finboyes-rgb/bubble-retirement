import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const state = await prisma.simulationState.findUnique({
    where: { userId: session.user.id },
  })

  if (!state) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({ inputs: state.inputs, updatedAt: state.updatedAt })
}

export async function PUT(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  if (!body?.inputs) {
    return NextResponse.json({ error: 'inputs required' }, { status: 400 })
  }

  const state = await prisma.simulationState.upsert({
    where: { userId: session.user.id },
    update: { inputs: body.inputs },
    create: { userId: session.user.id, inputs: body.inputs },
  })

  return NextResponse.json({ updatedAt: state.updatedAt })
}
