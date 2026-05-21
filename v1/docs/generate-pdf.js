const puppeteer = require('puppeteer');
const path = require('path');

async function generatePDF() {
  console.log('Starting PDF generation...');

  const browser = await puppeteer.launch({
    headless: 'new',
  });

  const page = await browser.newPage();

  // Load the HTML file
  const htmlPath = path.join(__dirname, 'business-plan.html');
  await page.goto(`file://${htmlPath}`, {
    waitUntil: 'networkidle0',
  });

  // Wait for fonts to load
  await page.evaluateHandle('document.fonts.ready');

  // Generate PDF
  const pdfPath = path.join(__dirname, 'Draft_사업계획서.pdf');
  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '0',
      right: '0',
      bottom: '0',
      left: '0',
    },
  });

  console.log(`PDF generated: ${pdfPath}`);

  await browser.close();
}

generatePDF().catch(console.error);
