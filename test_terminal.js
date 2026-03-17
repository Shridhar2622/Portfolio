const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
    await page.goto('http://127.0.0.1:5500/index.html', { waitUntil: 'networkidle0' });
    const isVisible = await page.evaluate(() => {
        const el = document.querySelector('.side-terminal');
        if (!el) return false;
        const style = window.getComputedStyle(el);
        return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
    });
    console.log('Terminal Visible:', isVisible);
    await browser.close();
})();
