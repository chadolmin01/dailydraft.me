const puppeteer = require('puppeteer');

async function convertToPNG() {
  const browser = await puppeteer.launch({ headless: true });
  const basePath = 'C:/Users/chado/OneDrive/사진';

  for (let i = 1; i <= 5; i++) {
    const inputPath = `${basePath}/slide${i}.html`;
    const outputPath = `${basePath}/slide${i}.png`;

    console.log(`Converting slide${i} to PNG...`);

    const page = await browser.newPage();
    await page.setViewport({ width: 1080, height: 1350, deviceScaleFactor: 2 });
    await page.goto('file:///' + inputPath, { waitUntil: 'networkidle0' });

    await page.screenshot({
      path: outputPath,
      clip: { x: 0, y: 0, width: 1080, height: 1350 }
    });

    await page.close();
    console.log(`Created: ${outputPath}`);
  }

  await browser.close();
  console.log('All slides converted to PNG!');
}

convertToPNG().catch(console.error);
