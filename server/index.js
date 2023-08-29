const express = require('express');
const puppeteer_module = require('./setup/puppeteer.js') 
const bodyParser = require('body-parser');
const htmlhelper = require('./extra/htmlhelper.js')
const cors = require('cors');
require('dotenv').config()

const app = express();
const port = process.env.PORT || 5000;
let EXITED = false;

app.set('puppeteer', puppeteer_module[0]);
app.set('htmlhelper', htmlhelper);

app.use(cors({origin: '*'}));
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json());

const server = app.listen(port, () => {
    console.log(`[Server] Listening on http://localhost:${port}`);
});

console.log("[Server] Loading routes:");
require("./setup/loader").load(app);
htmlhelper.load();

async function close() {
    if (EXITED)
        return;
    EXITED = true;
    await puppeteer_module[0].save();
	server.close();
    process.exit(0);
}

process.on("uncaughtException", (error) => {
    close();
	console.log("[PROCESS] An error occured:")
	console.error(error);
});

process.on("unhandledRejection", (error) => {
    close();
    console.log("[PROCESS] An error occured:")
    console.error(error);
});

process.on("exit", () => close());
process.on("SIGTERM", () => close());
process.on("SIGINT", () => close());
process.on("SIGHUP", () => close());
process.on("SIGUSR2", () => close());
process.on("beforeExit", () => close())
