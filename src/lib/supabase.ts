import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Client-side Supabase client (uses anon key)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side admin client (uses service role key — never expose to browser)
export function getAdminSupabase() {
  if (!supabaseUrl || !supabaseServiceKey || supabaseUrl.includes('your-project')) {
    return null;
  }
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function isSupabaseConfigured(): boolean {
  return !!(
    supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes('your-project') &&
    !supabaseAnonKey.includes('your-anon')
  );
}

// =============================================
// DATABASE TYPES
// =============================================
export interface ExamSession {
  id: string;
  user_id: string;
  title: string;
  questions: string;
  notes_html: string;
  context_summary: string;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  session_id: string;
  user_id: string;
  filename: string;
  file_type: string;
  content: string;
  word_count: number;
  created_at: string;
}

export interface User {
  id: string;
  username: string;
  password_hash: string;
  email?: string;
  display_name?: string;
  is_active: boolean;
  created_at: string;
}

// =============================================
// SESSION OPERATIONS
// =============================================
export async function saveSession(params: {
  userId: string;
  title: string;
  questions: string;
  notesHtml: string;
  contextSummary?: string;
}): Promise<ExamSession | null> {
  const supabaseAdmin = getAdminSupabase();
  if (!supabaseAdmin) return null;

  const { data, error } = await supabaseAdmin
    .from('exam_sessions')
    .insert({
      user_id: params.userId,
      title: params.title || 'Untitled Session',
      questions: params.questions,
      notes_html: params.notesHtml,
      context_summary: params.contextSummary || '',
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to save session:', error.message);
    return null;
  }
  return data;
}

export async function updateSession(
  sessionId: string,
  updates: Partial<Pick<ExamSession, 'title' | 'notes_html' | 'questions'>>
): Promise<boolean> {
  const supabaseAdmin = getAdminSupabase();
  if (!supabaseAdmin) return false;

  const { error } = await supabaseAdmin
    .from('exam_sessions')
    .update(updates)
    .eq('id', sessionId);

  return !error;
}

export async function getUserSessions(userId: string): Promise<ExamSession[]> {
  const supabaseAdmin = getAdminSupabase();
  if (!supabaseAdmin) return [];

  const { data, error } = await supabaseAdmin
    .from('exam_sessions')
    .select('id, user_id, title, created_at, updated_at, questions')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(50);

  if (error) return [];
  return data || [];
}

export async function getSession(sessionId: string, userId: string): Promise<ExamSession | null> {
  const supabaseAdmin = getAdminSupabase();
  if (!supabaseAdmin) return null;

  const { data, error } = await supabaseAdmin
    .from('exam_sessions')
    .select('*')
    .eq('id', sessionId)
    .eq('user_id', userId)
    .single();

  if (error) return null;
  return data;
}

export async function deleteSession(sessionId: string, userId: string): Promise<boolean> {
  const supabaseAdmin = getAdminSupabase();
  if (!supabaseAdmin) return false;

  const { error } = await supabaseAdmin
    .from('exam_sessions')
    .delete()
    .eq('id', sessionId)
    .eq('user_id', userId);

  return !error;
}
