module.exports = {
    subpath: "search",
    method: "get",
    run: async function(request, response) {
        const puppeteer = request.app.get("puppeteer");
        const query = request.query;
        
        let data = await puppeteer.search(query.s);

        if (query.json) {
            await response.set("Content-Type", "text/json");
            return response.send(data)
        } else if (query.text) {
            data = Object.values(data).flat();

            // Flatten array of object into a string seperated by newline
            const message = data.reduce((acc, result) => acc + Object.values(result).reduce((str, value) => str + `${value}\n`, ""), "");
            
            await response.set("Content-Type", "text/plain");
            return response.send("!START HERE!\n" + message);
        }
        
        data = Object.values(data).flat();

        const htmlhelper = request.app.get("htmlhelper")
        const elements = htmlhelper.generate_components("search_result", data);
        let html = htmlhelper.replace_for(this.html, elements);

        html = htmlhelper.replace_components(html, {});

        html = htmlhelper.replaceAll(html, {search: query.s, results: data.length});

        response.set("Content-Type", "text/html");
        response.send(html);
    }
}
