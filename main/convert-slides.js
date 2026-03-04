const puppeteer = require('puppeteer');
const path = require('path');

async function convertSlidesToPDF() {
  const browser = await puppeteer.launch({ headless: true });

  const slides = [
    'C:/Users/chado/OneDrive/Desktop/slide1.html',
    'C:/Users/chado/OneDrive/Desktop/slide2.html',
    'C:/Users/chado/OneDrive/Desktop/slide3.html',
    'C:/Users/chado/OneDrive/Desktop/slide4.html',
    'C:/Users/chado/OneDrive/Desktop/slide5.html'
  ];

  for (let i = 0; i < slides.length; i++) {
    const inputPath = slides[i];
    const outputPath = inputPath.replace('.html', '.pdf');

    console.log(`Converting slide${i + 1}...`);

    const page = await browser.newPage();
    await page.setViewport({ width: 1080, height: 1350, deviceScaleFactor: 2 });
    await page.goto('file:///' + inputPath, { waitUntil: 'networkidle0' });

    await page.pdf({
      path: outputPath,
      width: '1080px',
      height: '1350px',
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 }
    });

    await page.close();
    console.log(`Created: ${outputPath}`);
  }

  await browser.close();
  console.log('All slides converted!');
}

convertSlidesToPDF().catch(console.error);
