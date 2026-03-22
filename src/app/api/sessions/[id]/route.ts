import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { getSession, deleteSession, updateSession, isSupabaseConfigured } from '@/lib/supabase';

// GET /api/sessions/:id
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getAuthUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  if (!isSupabaseConfigured()) {
    return Response.json({ error: 'Supabase not configured' }, { status: 503 });
  }

  const session = await getSession(params.id, user.id);
  if (!session) return Response.json({ error: 'Not found' }, { status: 404 });

  return Response.json({ session });
}

// PATCH /api/sessions/:id
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getAuthUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const updates = await request.json();
  const ok = await updateSession(params.id, updates);

  return ok
    ? Response.json({ success: true })
    : Response.json({ error: 'Update failed' }, { status: 500 });
}

// DELETE /api/sessions/:id
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getAuthUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const ok = await deleteSession(params.id, user.id);
  return ok
    ? Response.json({ success: true })
    : Response.json({ error: 'Delete failed' }, { status: 500 });
}
