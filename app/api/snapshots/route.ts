import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const snapshots = await prisma.projectionSnapshot.findMany({
    where: { userId: session.user.id },
    orderBy: { snapshotYear: 'desc' },
  })

  return NextResponse.json(snapshots)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  if (!body?.projectionData || !body?.snapshotYear) {
    return NextResponse.json({ error: 'projectionData and snapshotYear required' }, { status: 400 })
  }

  const snapshot = await prisma.projectionSnapshot.create({
    data: {
      userId: session.user.id,
      snapshotYear: body.snapshotYear,
      projectionData: body.projectionData,
      label: body.label ?? null,
    },
  })

  return NextResponse.json(snapshot, { status: 201 })
}
