const { TimeoutError } = require("puppeteer")

module.exports = {
    name: "flamescans",
    URL: "https://flamescans.org/",
    storage: {},
    open: async function(page, link) {
        await page.goto(link, {waitUntil: 'domcontentloaded'});
        try {
            await page.waitForSelector(".flame-logo", {timeout: 5000});
        } catch(e) {
            if (e instanceof TimeoutError)
                return false;
            console.error(e);
        }
        return true;
    },

    get: async function(page, link, chapter) {
        if (!await this.open(page, link))
            return [];
        
        let href;
        [href, chapter] = await page.evaluate((chapter) => {
            const el = document.getElementById("chapterlist").children[0];
            let first = Number(el.children[el.children.length - 1].dataset["num"]);
            let last = Number(el.children[0].dataset["num"]);

            if (chapter < first)
                chapter = first
            else if (last < chapter)
                chapter = last;

            let index = Array.from(el.children).findIndex((value) => value.dataset["num"] == chapter);

            return [el.children[index].firstElementChild.href, chapter];
        }, chapter);

        if (!await this.open(page, href))
            return [];

        return [await page.evaluate(async () => {
            return Array.from(document.querySelectorAll("img.aligncenter.size-full")).map((item) => item.src);
        }), chapter];
    },
    
    search: async function(page, search) {
        if (!await this.open(page, `${this.URL}?s=${search}`))
            return [];

        let page_count = Number(await page.evaluate(() => {
            return document.getElementsByClassName("page-numbers").length;
        })), data = [];

        for (let curr_page = 2; 1; ++curr_page) {
            data.push(await page.evaluate(() => {
                return Array.from(document.querySelectorAll(".bs>.bsx>a")).map((item) => {
                    return {
                        href: item.href,
                        title: item.title,
                        thumbnail: item.children[0].children[1].src,
                        rating: Number(item.children[1].children[2].children[0].children[0].innerHTML),
                        chapter_count: "N/A"
                    };
                });
            }));

            // stop when page is more than page_count
            if (curr_page > page_count || !await this.open(page, `${this.URL}page/${curr_page}/?s=${search}`))
                break;
        }

        page.close();
        return data.flat();
    }
}

