import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'

// Export business plan as PDF (server-side generation with Puppeteer)

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
    }

    const body = await req.json()
    const { format, data, sectionData, template } = body

    if (!format || !data) {
      return NextResponse.json(
        { error: '필수 파라미터가 누락되었습니다.' },
        { status: 400 }
      )
    }

    if (format !== 'pdf' && format !== 'docx') {
      return NextResponse.json(
        { error: '지원하지 않는 형식입니다. (pdf, docx만 지원)' },
        { status: 400 }
      )
    }

    // Generate structured content for export
    const exportContent = generateExportContent(data, sectionData, template)

    if (format === 'pdf') {
      const htmlContent = generateHtmlContent(exportContent, template)

      // Server-side PDF generation with Puppeteer
      const pdfBuffer = await generatePdfFromHtml(htmlContent)

      const fileName = `${data.basicInfo?.itemName || '사업계획서'}_${template?.shortName || ''}.pdf`

      return new NextResponse(new Uint8Array(pdfBuffer), {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
          'Content-Length': pdfBuffer.length.toString(),
        },
      })
    }

    if (format === 'docx') {
      // TODO: Implement DOCX generation
      return NextResponse.json({
        format: 'docx',
        content: exportContent,
        fileName: `${data.basicInfo?.itemName || '사업계획서'}_${template?.shortName || ''}.docx`,
        message: 'DOCX 생성 기능은 곧 지원 예정입니다.'
      })
    }

  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json(
      { error: '내보내기 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

async function generatePdfFromHtml(htmlContent: string): Promise<Buffer> {
  // Dynamic import — puppeteer is excluded via serverExternalPackages in next.config
  let puppeteer: typeof import('puppeteer')
  try {
    puppeteer = await import('puppeteer')
  } catch {
    throw new Error('PDF 생성은 현재 서버 환경에서 지원되지 않습니다.')
  }
  const browser = await puppeteer.default.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ],
  })

  try {
    const page = await browser.newPage()

    await page.setContent(htmlContent, {
      waitUntil: 'networkidle0',
    })

    // Generate PDF with A4 size and proper margins for Korean government forms
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '25mm',
        bottom: '20mm',
        left: '25mm',
      },
      displayHeaderFooter: true,
      headerTemplate: '<div></div>',
      footerTemplate: `
        <div style="width: 100%; font-size: 9px; font-family: 'Noto Sans KR', sans-serif; color: #999; text-align: center; padding: 10px 25mm;">
          <span class="pageNumber"></span> / <span class="totalPages"></span>
        </div>
      `,
    })

    return Buffer.from(pdfBuffer)
  } finally {
    await browser.close()
  }
}

interface ExportSection {
  title: string
  weight: number
  content: Array<{
    label: string
    value: string
  }>
}

interface ExportContent {
  title: string
  subtitle: string
  templateName: string
  basicInfo: {
    itemName: string
    oneLiner: string
    targetCustomer: string
    industry: string
    fundingAmount?: number
  }
  sections: ExportSection[]
  extraSections?: ExportSection[]
}

function generateExportContent(
  data: {
    basicInfo?: {
      itemName?: string
      oneLiner?: string
      targetCustomer?: string
      industry?: string
      fundingAmount?: number
    }
  },
  sectionData: Record<string, Record<string, string>>,
  template: {
    name?: string
    shortName?: string
    sections?: Array<{
      type: string
      title: string
      weight: number
      fields: Array<{
        id: string
        label: string
      }>
    }>
    extraSections?: Array<{
      type: string
      title: string
      weight: number
      fields: Array<{
        id: string
        label: string
      }>
    }>
  }
): ExportContent {
  const sections: ExportSection[] = []

  // Process main sections
  if (template?.sections) {
    for (const section of template.sections) {
      const sectionContent = sectionData[section.type] || {}
      sections.push({
        title: section.title,
        weight: section.weight,
        content: section.fields.map((field) => ({
          label: field.label,
          value: sectionContent[field.id] || '',
        })),
      })
    }
  }

  // Process extra sections
  const extraSections: ExportSection[] = []
  if (template?.extraSections) {
    for (const section of template.extraSections) {
      const sectionContent = sectionData[section.type] || {}
      extraSections.push({
        title: section.title,
        weight: section.weight,
        content: section.fields.map((field) => ({
          label: field.label,
          value: sectionContent[field.id] || '',
        })),
      })
    }
  }

  return {
    title: data.basicInfo?.itemName || '사업계획서',
    subtitle: data.basicInfo?.oneLiner || '',
    templateName: template?.name || '',
    basicInfo: {
      itemName: data.basicInfo?.itemName || '',
      oneLiner: data.basicInfo?.oneLiner || '',
      targetCustomer: data.basicInfo?.targetCustomer || '',
      industry: data.basicInfo?.industry || '',
      fundingAmount: data.basicInfo?.fundingAmount,
    },
    sections,
    extraSections: extraSections.length > 0 ? extraSections : undefined,
  }
}

function generateHtmlContent(
  content: ExportContent,
  template: { name?: string }
): string {
  const industryNames: Record<string, string> = {
    it_platform: 'IT/플랫폼',
    manufacturing: '제조/하드웨어',
    bio_healthcare: '바이오/헬스케어',
    food_fnb: '식품/F&B',
    education: '교육/에듀테크',
    fintech: '핀테크/금융',
    traditional_culture: '전통문화',
    other: '기타',
  }

  const sectionsHtml = content.sections.map((section, index) => `
    <div class="section">
      <h2 class="section-title">${index + 1}. ${section.title}</h2>
      <div class="section-weight">배점: ${section.weight}점</div>
      <div class="section-content">
        ${section.content.map((item) => `
          <div class="field">
            <h3 class="field-label">${item.label}</h3>
            <div class="field-value">${item.value ? escapeHtml(item.value) : '<span class="empty">작성 필요</span>'}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('')

  const extraSectionsHtml = content.extraSections?.map((section, index) => `
    <div class="section extra-section">
      <h2 class="section-title">${content.sections.length + index + 1}. ${section.title}</h2>
      <div class="section-weight">배점: ${section.weight}점</div>
      <div class="section-content">
        ${section.content.map((item) => `
          <div class="field">
            <h3 class="field-label">${item.label}</h3>
            <div class="field-value">${item.value ? escapeHtml(item.value) : '<span class="empty">작성 필요</span>'}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('') || ''

  // Government form compliant template (예비창업패키지 style)
  return `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${content.title} - ${content.templateName}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;600;700&display=swap');

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    @page {
      size: A4;
      margin: 20mm 25mm;
    }

    body {
      font-family: 'Noto Sans KR', -apple-system, BlinkMacSystemFont, 'Malgun Gothic', sans-serif;
      font-size: 10pt;
      line-height: 1.8;
      color: #1a1a1a;
      background: white;
    }

    .page {
      width: 100%;
      background: white;
    }

    /* Cover Page */
    .cover {
      text-align: center;
      padding-top: 100mm;
      page-break-after: always;
      min-height: 250mm;
    }

    .cover-program-badge {
      display: inline-block;
      font-size: 11pt;
      color: #0052CC;
      border: 2px solid #0052CC;
      padding: 8px 24px;
      margin-bottom: 20mm;
      font-weight: 600;
      letter-spacing: 0.5px;
    }

    .cover-title {
      font-size: 26pt;
      font-weight: 700;
      color: #1a1a1a;
      margin-bottom: 8mm;
      line-height: 1.3;
    }

    .cover-subtitle {
      font-size: 13pt;
      color: #666;
      margin-bottom: 30mm;
      font-weight: 400;
    }

    .cover-info-table {
      width: 100%;
      max-width: 140mm;
      margin: 0 auto;
      border-collapse: collapse;
      text-align: left;
    }

    .cover-info-table td {
      padding: 4mm 5mm;
      font-size: 10pt;
      border-bottom: 1px solid #e5e5e5;
    }

    .cover-info-table td:first-child {
      width: 35mm;
      color: #666;
      font-weight: 500;
    }

    .cover-info-table td:last-child {
      font-weight: 600;
      color: #1a1a1a;
    }

    .cover-date {
      margin-top: 40mm;
      font-size: 11pt;
      color: #666;
    }

    /* Content Pages */
    .content-page {
      padding: 0;
    }

    .section {
      margin-bottom: 12mm;
      page-break-inside: avoid;
    }

    .section-title {
      font-size: 13pt;
      font-weight: 700;
      color: #1a1a1a;
      background: #f5f5f5;
      padding: 4mm 5mm;
      margin-bottom: 4mm;
      border-left: 4px solid #0052CC;
    }

    .section-weight {
      font-size: 9pt;
      color: #0052CC;
      font-weight: 500;
      margin-bottom: 4mm;
      padding-left: 5mm;
    }

    .section-content {
      padding: 0 5mm;
    }

    .field {
      margin-bottom: 6mm;
      page-break-inside: avoid;
    }

    .field-label {
      font-size: 10pt;
      font-weight: 600;
      color: #333;
      margin-bottom: 2mm;
      padding-bottom: 2mm;
      border-bottom: 1px dotted #ddd;
    }

    .field-value {
      font-size: 10pt;
      line-height: 1.9;
      white-space: pre-wrap;
      text-align: justify;
      color: #1a1a1a;
      padding: 3mm 0;
    }

    .empty {
      color: #bbb;
      font-style: italic;
    }

    .extra-section {
      background: #fafafa;
      padding: 5mm;
      border: 1px solid #eee;
    }

    .extra-section .section-title {
      background: #eee;
      border-left-color: #666;
    }

    /* Table styles for structured data */
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      margin: 4mm 0;
      font-size: 9pt;
    }

    table.data-table th,
    table.data-table td {
      border: 1px solid #ddd;
      padding: 3mm 4mm;
      text-align: left;
    }

    table.data-table th {
      background: #f5f5f5;
      font-weight: 600;
    }

    /* Print optimization */
    @media print {
      body {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }

      .section {
        page-break-inside: avoid;
      }

      .cover {
        page-break-after: always;
      }
    }
  </style>
</head>
<body>
  <!-- Cover Page -->
  <div class="page cover">
    <div class="cover-program-badge">${content.templateName}</div>
    <h1 class="cover-title">${escapeHtml(content.title)}</h1>
    <p class="cover-subtitle">${escapeHtml(content.subtitle)}</p>

    <table class="cover-info-table">
      <tr>
        <td>창업 아이템</td>
        <td>${escapeHtml(content.basicInfo.itemName)}</td>
      </tr>
      <tr>
        <td>타겟 고객</td>
        <td>${escapeHtml(content.basicInfo.targetCustomer)}</td>
      </tr>
      <tr>
        <td>업종</td>
        <td>${industryNames[content.basicInfo.industry] || content.basicInfo.industry}</td>
      </tr>
      ${content.basicInfo.fundingAmount ? `
      <tr>
        <td>희망 지원금</td>
        <td>${content.basicInfo.fundingAmount.toLocaleString()}만원</td>
      </tr>
      ` : ''}
    </table>

    <div class="cover-date">
      ${new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
    </div>
  </div>

  <!-- Content Pages -->
  <div class="page content-page">
    ${sectionsHtml}
    ${extraSectionsHtml}
  </div>
</body>
</html>
  `.trim()
}

function escapeHtml(text: string): string {
  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }
  return text.replace(/[&<>"']/g, (char) => htmlEscapes[char] || char)
}
