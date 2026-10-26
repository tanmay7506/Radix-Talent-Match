/**
 * Client-side text to PDF converter for Job Descriptions.
 * Allows pasted text in Step 3 to be submitted to the existing FastAPI
 * POST /jd/extract-skills endpoint (which expects a .pdf or .docx file)
 * without requiring any modifications to the backend code.
 */

export function createJdPdfFile(text, fileName = 'job_description.pdf') {
  if (!text || !text.trim()) {
    throw new Error('Text content cannot be empty.')
  }

  // Clean and sanitize text for basic standard 14 font PDF stream
  const sanitized = text
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/[^\x20-\x7E\n\r\t]/g, ' ') // Strip non-ASCII to prevent latin1 encoding errors

  const rawLines = sanitized.split('\n')
  const wrappedLines = []

  // Wrap long lines to fit standard letter page (approx 80 characters per line)
  for (const raw of rawLines) {
    if (raw.trim().length === 0) {
      wrappedLines.push('')
      continue
    }
    let remaining = raw.trim()
    while (remaining.length > 80) {
      const splitIndex = remaining.lastIndexOf(' ', 80)
      const cut = splitIndex > 40 ? splitIndex : 80
      wrappedLines.push(remaining.substring(0, cut))
      remaining = remaining.substring(cut).trim()
    }
    if (remaining.length > 0) {
      wrappedLines.push(remaining)
    }
  }

  // Generate text stream content (max 55 lines per standard page)
  const linesToRender = wrappedLines.slice(0, 55)
  let textStream = 'BT\n/F1 10 Tf\n50 740 Td\n14 TL\n'
  for (let i = 0; i < linesToRender.length; i++) {
    const line = linesToRender[i]
    if (i === 0) {
      textStream += `(${line}) Tj\n`
    } else {
      textStream += `T* (${line}) Tj\n`
    }
  }
  textStream += 'ET'

  const streamLength = textStream.length

  const pdfTemplate = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length ${streamLength} >>
stream
${textStream}
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000244 00000 n 
0000000300 00000 n 
trailer
<< /Root 1 0 R /Size 6 >>
startxref
380
%%EOF`

  const blob = new Blob([pdfTemplate], { type: 'application/pdf' })
  return new File([blob], fileName, { type: 'application/pdf' })
}
