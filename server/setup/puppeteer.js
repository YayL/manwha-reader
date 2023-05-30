const Puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const Helper = require('../extra/puphelper.js');

const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.181 Safari/537.36";

async function start(browser) {
    const page = (await browser.pages())[0];
    await page.setUserAgent(USER_AGENT);

    await page.setViewport({width: 1280, height: 1080});
    Helper.load(browser, page);
    Helper.is_ready = true;

    console.log("Puppeteer is ready");
}

Puppeteer.use(StealthPlugin());

Puppeteer.launch({
        headless: 'new'
}).then(start);

module.exports = [Helper, Puppeteer]
