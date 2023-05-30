const fs = require("fs")
const path = require("path")

let data = {};
const sources = {};
let browser, page;

// ########################################
// # Register a new page object to        #
// # increase performance                 #
// # ------------------------------------ #
// #                                      #
// # Argument 1: Page object              #
// #                                      #
// # Return: Undefined                    #
// ########################################

async function register_page(page) {
    await page.setRequestInterception(true);

    page.on('request', (req) => {
        const type = req.resourceType();
        if(type == 'stylesheet' || type == 'font' || type == 'image' || type == "script" || type == "xhr"){
            req.abort();
        }
        else {
            req.continue();
        }
    });
}

// ########################################
// # Load in source modules               #
// # ------------------------------------ #
// #                                      #
// # Return: Undefined                    #
// ########################################

function load(_browser, _page) {
    browser = _browser, page = _page;

    register_page(page);

    try {
        data = JSON.parse(fs.readFileSync(path.join(__dirname, "../", process.env.STORAGE_LOCATION)));
    } catch (e) {
        if (e instanceof SyntaxError) {
            data = {}
        } else {
            console.error(e)
        }
    }
    fs.readdirSync(path.join(__dirname, "../sources")).map((source) => {
        const split = source.split('.')
        if (split[split.length - 1] == "js")
            sources[split[0]] = {...require(path.join(__dirname, '../sources', source)), storage: data[split[0]] ? data[split[0]] : {}};
    });
}

// ########################################
// # Get all source objects               #
// # ------------------------------------ #
// #                                      #
// # Return: Source objects               #
// ########################################

function get_sources() {
    return sources
}

// ########################################
// # Get source that handles URL          #
// # ------------------------------------ #
// #                                      #
// # Argument 1: URL                      #
// #                                      #
// # Return: Source object                #
// ########################################

async function find_source(URL) {
    return await Object.values(sources).find(source => String(URL).toLowerCase().startsWith(source.URL))
}

// ########################################
// # Send a search request to all sources #
// # ------------------------------------ #
// #                                      #
// # Argument 1: page object              #
// # Argument 2: Search string            #
// #                                      #
// # Return: List of mangas matching the  #
// #         search from each source      #
// ########################################

async function search(search) {
    let result = {};
    
    for (const [source_name, source] of Object.entries(sources)) {
        let page = await browser.newPage();
        register_page(page);
        result[source_name] = source.search(page, search)
    }
    const keys = Object.keys(result);

    // wait for all promises to resolve
    await Promise.all(Object.values(result))
        .then((promise) => promise.forEach((value, index) => result[keys[index]] = value));

    return result;
}

// ########################################
// # Get all images on a chapter          #
// # ------------------------------------ #
// #                                      #
// # Argument 1: page object              #
// # Argument 2: Search string            #
// #                                      #
// # Return: List of images in chapter    #
// ########################################

async function get_chapter(URL, chapter) {
    let source = await find_source(URL);

    if (source.hasOwnProperty("storage") && source.storage !== undefined && source.storage[URL] !== undefined && source.storage[URL][chapter] !== undefined)
        return source.storage[URL][chapter];
    
    const data = await source.get(page, URL, chapter);

    if (!source.storage.hasOwnProperty(URL))
        source.storage[URL] = [];
    if (data.length > 0)
        source.storage[URL][chapter] = data;

    return data;
}

// ########################################
// # Save data to json                    #
// # ------------------------------------ #
// #                                      #
// # Return: Undefined                    #
// ########################################

async function save() {
    Object.entries(sources).forEach(([name, value]) => {
        data[name] = value.storage ? value.storage : [];
    }) 

    fs.writeFileSync(path.join(__dirname, "..", process.env.STORAGE_LOCATION), JSON.stringify(data), (err) => {
        console.error(err);
    });
}

module.exports  = { load, get_sources, get_chapter, search, save, is_ready: false }
