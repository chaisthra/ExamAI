import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { getUserSessions, saveSession, isSupabaseConfigured } from '@/lib/supabase';

// GET /api/sessions — list user's sessions
export async function GET() {
  const user = await getAuthUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  if (!isSupabaseConfigured()) {
    return Response.json({ sessions: [], note: 'Supabase not configured — sessions not persisted' });
  }

  const sessions = await getUserSessions(user.id);
  return Response.json({ sessions });
}

// POST /api/sessions — save a new session
export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  if (!isSupabaseConfigured()) {
    return Response.json({ error: 'Supabase not configured' }, { status: 503 });
  }

  try {
    const { title, questions, notesHtml, contextSummary } = await request.json();
    const session = await saveSession({
      userId: user.id,
      title,
      questions,
      notesHtml,
      contextSummary,
    });

    if (!session) {
      return Response.json({ error: 'Failed to save session' }, { status: 500 });
    }

    return Response.json({ session });
  } catch (error) {
    return Response.json({ error: 'Invalid request' }, { status: 400 });
  }
}
