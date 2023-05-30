module.exports = {
    subpath: "",
    method: "get",
    run: async function(request, response) {

        const htmlhelper = request.app.get("htmlhelper");
        
        const html = htmlhelper.replace_components(this.html, {});

        response.send(html);
    }
}
