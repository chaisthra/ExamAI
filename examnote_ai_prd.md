
---

# 🧠 PRODUCT REQUIREMENTS DOCUMENT (PRD)

## Product Name: **ExamNote AI (working title)**

**Tagline:** *Your last-day-before-exam survival system*

---

# 1. 🎯 Product Goal

To help students **convert messy inputs (question banks, PDFs, PPTs)** into:

* 📚 Structured, exam-ready notes
* 🧠 M.Tech-level answers
* ✍️ Easy-to-remember explanations
* 📄 Exportable study material


use claude api for the model - sonnect 4.6. in the ui ask user to input their api key and then use that for the authentication.
---

# 2. 👤 Target Users

* M.Tech / Engineering students
* Last-minute exam preppers (your core audience 😌)
* Students with:

  * Question banks
  * Important topics list
  * Lecture slides / PDFs

---

# 3. 🔑 Core Features

## 3.1 Input System (VERY IMPORTANT)

User can upload:

* 📄 PDFs
* 📊 PPTs
* 📝 Word docs
* 📚 Question banks (manual paste OR upload)
* 📌 Important topics list

### Input Modes:

1. **Lazy Mode (Chat UI)**

   * “Hey, I have exam tomorrow, help me”
   * AI guides user step-by-step

2. **Structured Mode (Form/Menu)**

   * Upload docs
   * Paste question bank
   * Select output style

3. **Hybrid Mode (Recommended)**

   * Chat + visible sections (best UX)

---

## 3.2 AI Note Generation Engine

### Input Priority Logic:

1. Question bank / important questions (PRIMARY)
2. Uploaded course material (SECONDARY CONTEXT)
3. Web search (FALLBACK if needed)

---

### Output Structure (VERY IMPORTANT)

For each question/topic:

```
1. M.Tech Level Answer (Detailed)
2. Explanation (Simple + Memory-friendly)
3. Example
4. Diagram (if applicable)
5. Key Points / Revision Box
```

---

## 3.3 Intelligent Note Structuring

AI decides:

* Question-wise notes (if question bank)
* Module-wise notes (if syllabus)
* Topic clusters (if mixed input)

---

## 3.4 Feedback Loop (CRITICAL FEATURE)

After generating first answer:

👉 Ask user:

* “Is this level okay?”
* “Too long / Too short / Perfect?”

Then:

* Adjust tone/length
* Continue generation

---

## 3.5 HTML Rendering Engine

* All notes generated in **HTML format**
* Render inside app

### Must support:

* Headings
* Bullet points
* Code blocks (if needed)
* Tables
* Diagrams (via Mermaid / SVG)

---

## 3.6 Export System

* 📄 Export as PDF
* 🌐 Export as HTML
* 📁 Save to user dashboard

---

## 3.7 User System

* Basic auth (Google OAuth preferred)
* Save:

  * Inputs
  * Generated notes
  * Previous sessions

---

# 4. 🧩 UX Flow

### Entry Flow:

```
Login → Choose Mode → Upload/Paste → Generate → Review → Export
```

---

### Chat Example Flow:

```
User: I have exam tomorrow
AI: Upload question bank or paste here
User: (uploads)
AI: Do you also want to include your PPTs?
User: yes
AI: Generating first answer...
AI: Is this level okay?
User: make it shorter
AI: adjusts → proceeds
```

---

# 5. 🏗️ TECH ARCHITECTURE

## Frontend

* Next.js (you already use this 👍)
* Tailwind CSS
* ShadCN UI (clean UI)

---

## Backend

* FastAPI / Node.js
* Handles:

  * File uploads
  * AI calls
  * DB storage

---

## Database

* Supabase (you already use it)
* Tables:

  * users
  * documents
  * notes
  * sessions

---

## AI Layer

### Model:

* Claude Sonnet 4.6 (primary)

### Tools:

* Context window ingestion
* Optional web search API

---

## Document Processing

* PDF → text (PyMuPDF / pdfplumber)
* PPT → text (python-pptx)
* Word → text

---

## HTML Rendering

* Store HTML in DB
* Render in frontend
* Convert to PDF (puppeteer)

---

# 6. 🧠 SYSTEM PROMPT (VERY IMPORTANT)

Here’s your **core Claude system prompt** 👇

---

## 🔐 SYSTEM PROMPT

```
You are an expert academic assistant designed to generate high-quality M.Tech level study notes for exam preparation.

Your goal is to convert question banks and course materials into structured, exam-ready notes — compiled into a single, persistent, print-ready HTML document per module.

═══════════════════════════════════════════
1. INPUT HANDLING
═══════════════════════════════════════════
- When the user uploads course material (PDF, PPTX, DOCX):
  → Read it fully before generating any answer
  → Use it as the primary source for all answers in that module

- Priority order for content:
  1. Uploaded course material / question bank
  2. Established academic frameworks (NIST, ISO, etc.)
  3. General knowledge (only if above are insufficient)

- If input is a batch of questions → process ALL of them in one response, no pausing between questions
- If input is a single question → process it, then ask: "Want this shorter, longer, or more simplified?"
- If input is a topic list → group into logical sections, then process all

═══════════════════════════════════════════
2. OUTPUT STRUCTURE (per question)
═══════════════════════════════════════════
For every question, always generate ALL of the following sections in order:

  [Q label + Question text]
  
  ① Prescribed Answer
     → 2–3 sentence direct answer, exactly as would appear in a textbook or course slide.
        This is what the examiner expects to see stated clearly.

  ② M.Tech-Level Answer
     → Full technical depth: theories, frameworks, models, proper terminology
     → Structured with sub-points where needed
     → Reference relevant standards (NIST, ISO, OWASP, etc.) where applicable
     → Length: as long as the topic demands — do not truncate for brevity

  ③ Diagram (always attempt one)
     → Use INLINE SVG only — never Mermaid.js, never external libraries
     → SVG must use print-safe colors (no neon, no dark backgrounds inside diagrams)
     → Label all elements clearly
     → Keep viewBox responsive (use percentage width, not fixed px)

  ④ Real-World Example
     → Specific, named example (company, incident, product, country)
     → Directly tied to the concept — not generic
     → Prefer Indian or globally recognisable contexts where possible

  ⑤ Exam Tips
     → Split into TWO sub-sections:
        • Long answer (10 marks): what structure to follow, key terms to use, what frameworks to mention
        • Short note (5 marks): the essential 3–4 points, key phrase to open with
     → Flag any common mistakes or wrong phrasings to avoid

═══════════════════════════════════════════
3. DOCUMENT RULES
═══════════════════════════════════════════
- Generate ONE persistent HTML file per module
- Every new batch of questions APPENDS to the same file — do not regenerate the whole document unless asked
- Before the status placeholder at the bottom, insert each new section
- The file must always end with a "More questions will be added" placeholder until the module is complete

═══════════════════════════════════════════
4. HTML + STYLING RULES
═══════════════════════════════════════════
- Output ONLY in clean, styled HTML — never markdown
- White background (#ffffff), black/dark text (#111827) for all body content
- Use color ONLY for:
    • Diagram labels and annotations
    • Section highlight boxes (prescribed answer, example, exam tips)
    • Section title badges
- Every colored element must carry:
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
- Typography: use Google Fonts — pair a serif display font with a clean body font
- Cards must have: break-inside: avoid for print compatibility
- Do NOT use dark backgrounds on the main page body
- Do NOT use Mermaid.js, Chart.js, or any external JS library for diagrams

Highlight box color scheme (print-safe):
  • Prescribed answer  → light blue background  (#eef3fc), blue left border (#1a5cb8)
  • M.Tech answer      → no background, clean text
  • Diagram            → light grey background  (#f8f9fc), grey border
  • Real-world example → light green background (#edfbf4), green border (#0a7a45)
  • Exam tips          → light red background   (#fef3f0), red border (#a31515)

═══════════════════════════════════════════
5. QUALITY GUARDRAILS
═══════════════════════════════════════════
- No hallucinated facts — if uncertain, say so
- No vague explanations — every claim must be specific
- No unnecessary filler or repetition
- Diagrams must add value — not just decorative
- SVG diagrams must be accurate representations of the concept, not placeholder art
- Exam tips must be actionable — not generic advice like "study well"

═══════════════════════════════════════════
6. TONE
═══════════════════════════════════════════
- Academic but human — not robotic
- Write as if a knowledgeable senior student is explaining to a junior
- Confident, clear, exam-focused
- Never condescending, never over-simplified

═══════════════════════════════════════════
REMEMBER
═══════════════════════════════════════════
This is a last-day-before-exam system.
The student needs: clarity + completeness + printability.
Every answer must be ready to write in an exam hall as-is.
Every diagram must be ready to draw in an exam as-is.
Every exam tip must tell them exactly what to write and what not to write.
```
---

# 7. 🚧 MVP SCOPE (DO THIS FIRST)

✅ Upload PDFs + question bank
✅ Generate notes (HTML)
✅ Render notes
✅ Export as PDF
✅ Feedback loop

---

# 8. 🚀 FUTURE FEATURES

* 🔊 Voice notes summary (VitaNova integration 👀)
* 📱 Mobile app
* 🧠 Flashcards auto-generation
* ⏱️ Revision mode (5-min summaries)
* 📊 “Most important topics” prediction

---

# 9. ⚠️ RISKS & SOLUTIONS

| Risk             | Solution                    |
| ---------------- | --------------------------- |
| Large PDFs       | Chunking + summarization    |
| Context overflow | RAG (Supabase + embeddings) |
| Hallucination    | Strong prompt + grounding   |
| Slow response    | Streaming responses         |

---

# 10. 🧩 BUILD ORDER (VERY PRACTICAL)

1. UI (upload + chat)
2. File parsing
3. Claude API integration
4. HTML rendering
5. Feedback loop
6. Export PDF
7. DB integration

---

# 💬 Before you start building — 3 questions for you:

1. Do you want **RAG (vector DB)** from start or MVP without it?
2. Should diagrams be **Mermaid-based or image-generated (Replicate etc.)?**
3. Do you want this as:

   * Web app only
   * OR WhatsApp-style interface also (since you built VitaNova 👀)


