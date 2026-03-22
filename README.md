# ExamNote AI

> Convert your question bank into M.Tech-level exam-ready notes in minutes — powered by Claude.

Built on the night before an exam. Actually used to study. MVP in ~2 hours.

---

## What it does

Paste your question bank, upload your course PDFs/PPTs/DOCX, and ExamNote AI generates structured study notes for every question:

- **① Prescribed Answer** — textbook-style, what the examiner expects
- **② M.Tech-Level Answer** — full technical depth with standards references (NIST, IEEE, ISO, OWASP)
- **③ SVG Diagram** — visual, print-clean, exam-drawable
- **④ Real-World Example** — specific named incidents with traced technical details
- **⑤ Exam Tips** — exactly what to write for 10-mark and 5-mark questions

Notes stream in real-time, render with color-coded section badges, and export as a print-ready PDF.

---

## Stack

- **Next.js 14** (App Router)
- **Tailwind CSS**
- **Claude Sonnet** via Anthropic API (user-supplied key — never stored server-side)
- **Supabase** — auth, session history, saved notes
- **File parsing**: `pdf-parse`, `mammoth` (DOCX), `jszip` (PPTX)

---

## Getting Started

### Prerequisites

- Node.js 18+
- An [Anthropic API key](https://console.anthropic.com/)
- A [Supabase](https://supabase.com/) project

### 1. Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/examnote-ai.git
cd examnote-ai
npm install
```

### 2. Set up environment variables

Copy the example and fill in your values:

```bash
cp .env.example .env.local
```

```env
# Admin login (for the app's built-in auth)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-password

# JWT secret — generate a random string
JWT_SECRET=your-random-secret-key

# Supabase — from your project's API settings
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Set up the database

Run the schema in your Supabase SQL editor:

```bash
# The file is at supabase-schema.sql
# Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/sql
# Paste and run the contents of supabase-schema.sql
```

This creates three tables: `users`, `exam_sessions`, `documents`.

### 4. Run

```bash
npm run dev
# → http://localhost:3000
```

Login with your `ADMIN_USERNAME` / `ADMIN_PASSWORD`, enter your Anthropic API key in the UI, and start generating notes.

---

## Usage

1. **Enter your Anthropic API key** — stored in `sessionStorage` only, never sent to any server except Anthropic directly
2. **Set a session title** — e.g. "Information Security — Module 3"
3. **Upload course material** (optional) — PDF, DOCX, or PPTX; the content is used as context
4. **Paste your question bank** — numbered questions work best (`1.`, `Q1.`, etc.)
5. **Set answer preference** (optional) — "quick answers", "2-mark level", "very detailed", etc.
6. **Generate** — notes stream in real-time
7. **Review** — continue generating, give feedback to change approach, or accept and save
8. **Export** — print to PDF via the print button

### Crosscheck

After generation, a banner shows how many questions were asked vs. how many were generated. If any are missing, one click appends the missing ones.

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx                  # Main app
│   ├── login/page.tsx            # Login
│   ├── history/page.tsx          # Saved sessions
│   └── api/
│       ├── generate/route.ts     # Claude streaming
│       ├── parse-file/route.ts   # PDF/DOCX/PPTX parser
│       ├── auth/                 # Login / logout
│       ├── sessions/             # CRUD for saved notes
│       └── admin/                # User management
├── components/
│   ├── ApiKeySetup.tsx
│   ├── FileUpload.tsx
│   ├── NotesViewer.tsx           # Streaming viewer + print export
│   └── FeedbackBar.tsx
└── lib/
    ├── auth.ts                   # JWT helpers
    ├── supabase.ts               # DB client + CRUD
    ├── system-prompt.ts          # Claude system prompt
    └── utils.ts
```

---

## Deploying

Works out of the box on [Vercel](https://vercel.com/). Add your environment variables in the Vercel dashboard under Project Settings → Environment Variables.

---

## Notes

- Your Anthropic API key is **never stored** on the server — it's passed directly from your browser to Anthropic's API per request
- The app uses JWT cookies for session auth (7-day expiry, HttpOnly, SameSite=Lax)
- PDF export uses `window.print()` with print-specific CSS — no server-side PDF generation needed

---

## License

MIT
