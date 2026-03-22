import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { getAdminSupabase, isSupabaseConfigured } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  const authUser = await getAuthUser();
  if (!authUser || authUser.role !== 'admin') {
    return Response.json({ error: 'Admin access required' }, { status: 403 });
  }

  if (!isSupabaseConfigured()) {
    return Response.json({ error: 'Supabase not configured' }, { status: 503 });
  }

  try {
    const { username, password, email, displayName } = await request.json();

    if (!username || !password) {
      return Response.json({ error: 'Username and password required' }, { status: 400 });
    }

    if (password.length < 8) {
      return Response.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    const bcrypt = await import('bcryptjs');
    const passwordHash = await bcrypt.hash(password, 12);

    const supabaseAdmin = getAdminSupabase();
    const { data, error } = await supabaseAdmin!
      .from('users')
      .insert({
        username,
        password_hash: passwordHash,
        email: email || null,
        display_name: displayName || username,
      })
      .select('id, username, email, created_at')
      .single();

    if (error) {
      if (error.code === '23505') {
        return Response.json({ error: 'Username already exists' }, { status: 409 });
      }
      return Response.json({ error: 'Failed to create user' }, { status: 500 });
    }

    return Response.json({ user: data });
  } catch {
    return Response.json({ error: 'Invalid request' }, { status: 400 });
  }
}
