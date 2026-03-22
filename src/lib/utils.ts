export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}

export function extractQuestionsFromText(text: string): string[] {
  // Try to detect numbered questions
  const numbered = text.match(/^\d+[\.\)]\s*.+/gm);
  if (numbered && numbered.length > 0) return numbered;

  // Try Q: format
  const qformat = text.match(/^Q[\d]*[\.\:]\s*.+/gim);
  if (qformat && qformat.length > 0) return qformat;

  // Split by blank lines
  const paras = text.split(/\n\s*\n/).filter(p => p.trim().length > 10);
  return paras;
}

export function generateNoteId(): string {
  return `note-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function sanitizeHtml(html: string): string {
  // Remove any script tags for safety
  return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
}
