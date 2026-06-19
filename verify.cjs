const puppeteer = require('puppeteer');
const express = require('express');
const path = require('path');

const app = express();
app.use(express.static(path.join(__dirname, 'dist')));

const server = app.listen(3002, async () => {
  console.log('Server running on port 3002');
  
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure().errorText));

  try {
    await page.goto('http://localhost:3002/', { waitUntil: 'networkidle0' });
    console.log('Page loaded');
    const content = await page.content();
    console.log('Body length:', content.length);
  } catch (err) {
    console.error('Error during goto:', err);
  }

  await browser.close();
  server.close();
});
