const puppeteer = require('puppeteer');
(async () => {
    try {
        const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
        const page = await browser.newPage();
        page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
        page.on('pageerror', err => console.log('BROWSER ERROR:', err.toString()));

        // Go to a dummy page on same origin to set localStorage
        await page.goto('http://localhost:3000/404', { waitUntil: 'networkidle2' });

        await page.evaluate(() => {
            localStorage.setItem('mve_token', 'fake-token-for-test');
            localStorage.setItem('mve_user', JSON.stringify({
                id: 14,
                user_type: 'super_admin',
                email: 'superadmin@mve.com'
            }));
        });

        console.log("Navigating to dashboard with fake token...");
        await page.goto('http://localhost:3000/admin/dashboard', { waitUntil: 'networkidle2', timeout: 30000 });
        await new Promise(r => setTimeout(r, 2000));
        await browser.close();
        console.log("Done.");
    } catch (e) {
        console.error("SCRIPT ERROR:", e);
    }
})();
