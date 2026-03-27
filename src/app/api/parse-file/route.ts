import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return Response.json({ error: 'No file provided' }, { status: 400 });
    }

    const filename = file.name.toLowerCase();
    const buffer = Buffer.from(await file.arrayBuffer());
    let text = '';
    let fileType = 'unknown';

    if (filename.endsWith('.pdf')) {
      fileType = 'pdf';
      try {
        // Dynamic import to avoid issues with Next.js bundling
        const pdfParse = (await import('pdf-parse')).default;
        const data = await pdfParse(buffer);
        text = data.text;
      } catch {
        return Response.json({ error: 'Failed to parse PDF. Please ensure it is a valid PDF file.' }, { status: 400 });
      }
    } else if (filename.endsWith('.docx') || filename.endsWith('.doc')) {
      fileType = 'docx';
      try {
        const mammoth = await import('mammoth');
        const result = await mammoth.extractRawText({ buffer });
        text = result.value;
      } catch {
        return Response.json({ error: 'Failed to parse Word document.' }, { status: 400 });
      }
    } else if (filename.endsWith('.pptx') || filename.endsWith('.ppt')) {
      fileType = 'pptx';
      try {
        const JSZip = (await import('jszip')).default;
        const zip = await JSZip.loadAsync(buffer);
        const slideTexts: string[] = [];

        // Extract text from each slide's XML
        const slideKeys = Object.keys(zip.files)
          .filter(name => name.match(/ppt\/slides\/slide\d+\.xml$/))
          .sort((a, b) => {
            const numA = parseInt(a.match(/slide(\d+)/)?.[1] || '0');
            const numB = parseInt(b.match(/slide(\d+)/)?.[1] || '0');
            return numA - numB;
          });

        for (const key of slideKeys) {
          const content = await zip.files[key].async('text');
          // Extract text from XML
          const texts = content.match(/<a:t[^>]*>([^<]+)<\/a:t>/g) || [];
          const slideText = texts
            .map(t => t.replace(/<[^>]+>/g, ''))
            .filter(t => t.trim().length > 0)
            .join(' ');
          if (slideText.trim()) {
            const slideNum = key.match(/slide(\d+)/)?.[1];
            slideTexts.push(`[Slide ${slideNum}]
${slideText}`);
          }
        }
        text = slideTexts.join('

');
      } catch {
        return Response.json({ error: 'Failed to parse PowerPoint file.' }, { status: 400 });
      }
    } else if (filename.endsWith('.txt') || filename.endsWith('.md')) {
      fileType = 'text';
      text = buffer.toString('utf-8');
    } else {
      return Response.json(
        { error: 'Unsupported file type. Please upload PDF, DOCX, PPTX, or TXT files.' },
        { status: 400 }
      );
    }

    if (!text || text.trim().length === 0) {
      return Response.json(
        { error: 'Could not extract text from the file. The file may be empty or image-based.' },
        { status: 400 }
      );
    }

    // Limit text to avoid context overflow (keep ~100k chars)
    const truncated = text.length > 100000;
    const processedText = truncated ? text.slice(0, 100000) + '

[... content truncated for context limits ...]' : text;

    return Response.json({
      text: processedText,
      filename: file.name,
      fileType,
      wordCount: text.split(/\s+/).length,
      truncated,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return Response.json({ error: `File processing failed: ${errorMessage}` }, { status: 500 });
  }
}
