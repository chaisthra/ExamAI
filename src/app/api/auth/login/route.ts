import { NextRequest } from 'next/server';
import { createToken, validateAdminCredentials } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return Response.json({ error: 'Username and password required' }, { status: 400 });
    }

    let user = null;

    // Check admin credentials
    if (validateAdminCredentials(username, password)) {
      user = { username: 'admin', role: 'admin' as const, id: 'admin-001' };
    } else {
      // Check Supabase users (if configured)
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (supabaseUrl && supabaseKey && !supabaseUrl.includes('your-project')) {
        try {
          const { createClient } = await import('@supabase/supabase-js');
          const supabase = createClient(supabaseUrl, supabaseKey);
          const bcrypt = await import('bcryptjs');

          const { data: dbUser } = await supabase
            .from('users')
            .select('*')
            .eq('username', username)
            .eq('is_active', true)
            .single();

          if (dbUser && await bcrypt.compare(password, dbUser.password_hash)) {
            user = { username: dbUser.username, role: 'user' as const, id: dbUser.id };
          }
        } catch {
          // Supabase not configured — fall through
        }
      }
    }

    if (!user) {
      // Slow down brute force attempts
      await new Promise(resolve => setTimeout(resolve, 500));
      return Response.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    const token = await createToken(user);

    const response = Response.json({
      success: true,
      user: { username: user.username, role: user.role }
    });

    // Set httpOnly cookie (7 days)
    const cookieHeader = `auth_token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 3600}`;
    response.headers.set('Set-Cookie', cookieHeader);

    return response;
  } catch (error) {
    return Response.json({ error: 'Login failed' }, { status: 500 });
  }
}
