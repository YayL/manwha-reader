module.exports = {
    subpath: "reader",
    method: "get",
    run: async function(request, response) {
        const puppeteer = request.app.get("puppeteer");
        const query = request.query;

        query.c = Number(query.c)

        let [data, chapter] = await puppeteer.get_chapter(query.u, query.c);
        
        // if json is requested
        if (query.json) {
            await response.set("Content-Type", "text/json");
            return response.send(data);
        } // if text format is requested
        else if (query.text) {
            await response.set("Content-Type", "text/plain");
            return response.send("!START HERE!\n" + Object.values(data).join('\n'));
        }
        
        // if the input chapter number doesn't exist
        if (chapter != query.c)
            return response.redirect(request.url.replace(`&c=${query.c}`, `&c=${chapter}`));

        const htmlhelper = request.app.get("htmlhelper"); 
        const elements = htmlhelper.generate_components("reader_image", data.map((src) => {return {src: src}}));

        let html = htmlhelper.replace_for(this.html, elements);
        
        html = htmlhelper.replaceAll(html, {chapter: query.c, href: query.u, back: chapter - 1, next: chapter + 1});

        await response.set("Content-Type", "text/html");
        response.send(html);
    }
}
