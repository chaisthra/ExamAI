-- ExamNote AI — Supabase Schema
-- Run this in your Supabase SQL Editor at: https://supabase.com/dashboard/project/YOUR_PROJECT/sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- USERS TABLE (for non-admin accounts)
-- =============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  email TEXT,
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ
);

-- =============================================
-- EXAM SESSIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS exam_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,       -- 'admin-001' or users.id
  title TEXT DEFAULT 'Untitled Session',
  questions TEXT,              -- The question bank input
  notes_html TEXT,             -- Generated HTML notes
  context_summary TEXT,        -- Summary of uploaded materials
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exam_sessions_user_id ON exam_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_exam_sessions_created_at ON exam_sessions(created_at DESC);

-- =============================================
-- DOCUMENTS TABLE (uploaded course materials)
-- =============================================
CREATE TABLE IF NOT EXISTS documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES exam_sessions(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  filename TEXT NOT NULL,
  file_type TEXT NOT NULL,    -- 'pdf', 'docx', 'pptx', 'text'
  content TEXT,               -- Extracted text
  word_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_session_id ON documents(session_id);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);

-- =============================================
-- ROW LEVEL SECURITY (basic)
-- =============================================
-- Disable RLS for server-side service role access
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE exam_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE documents DISABLE ROW LEVEL SECURITY;

-- =============================================
-- HELPFUL FUNCTION: Update timestamps
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER exam_sessions_updated_at
  BEFORE UPDATE ON exam_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Done! Your ExamNote AI database is ready.
