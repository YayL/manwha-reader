const fs = require('fs');
const { Router } = require('express');
const chokidar = require("chokidar")

const handleErrorAsync = (func) => async (request, response, next) => {
    try {
        await func(request, response, next);
    } catch (err) {
        next(err);
    }
}

function readFile(path, route) {
    fs.readFile(path, {encoding: "utf8", flag: "r"}, (_, data) => route.html = data);
}

function load_route_file(app, path, file) {
    const folder_router = Router();
    if (fs.lstatSync(`./routes${path}${file}`).isDirectory()) {
        load_routes(app, `${path}${file}/`);
    } else {
        const route = require(`../routes${path}${file}`);
        const name = file.split('.')[0];
        const html = route.html 
                                ? `./html/${route.html}`
                                : `./html${path}${name}.html`;

        if (typeof route.run !== "function" || typeof route.method !== "string" || typeof route.subpath !== "string") {
            console.log(`\t${name}: ERROR Incorrect file format`);
            return;
        }
    
        let found_html = fs.existsSync(html) && fs.lstatSync(html).isFile()

        if (found_html) {
            readFile(html, route);
            chokidar.watch(html, {persistent: true}).on('change', () => readFile(html, route));
        }

        folder_router[route.method](`/${route.subpath}`, handleErrorAsync(route.run.bind(route)));
        console.log(`\t${route.method.toUpperCase()}\t${name}: ${path}${route.subpath}`);
        console.log(`\t[HTML: ${found_html ? "Yes" : "No" }]`)
    }
    app.use(path, folder_router);
}

function load_routes(app, path = '/') {
    fs.readdirSync(`./routes${path}`)
        .forEach((file) => load_route_file(app, path, file));
}

function load(app) {
    app.setMaxListeners(10);
    load_routes(app);
} 

module.exports = { load }
