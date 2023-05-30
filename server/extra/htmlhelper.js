const fs = require("fs");

let components = {}

// ########################################
// # Load all components into memory      #
// # ------------------------------------ #
// #                                      #
// # Return: Undefined                    #
// ########################################

function load() {
    fs.readdirSync("./components/")
        .forEach((file) => {
            const name = file.split('.')[0];
            fs.readFile(`./components/${file}`, {encoding: "utf8", flag: "r"}, 
                    (_, data) => components[name] = data);
        });
}
// ########################################
// # Private replace all to replace all   #
// # data tags denoted {{ KEY }} in HTML  #
// # ------------------------------------ #
// #                                      #
// # Argument 1: HTML code                #
// # Argument 2: List of keys to use      #
// # Argument 3: Data to use              #
// #                                      #
// # Return: Updated HTML                 #
// ########################################


function _replaceAll(html, keys, data) {
    let i = 0;
    return html.replaceAll(/{{[^}]+}}/g, () => {
        return data[keys[i++]];
    });
}

// ########################################
// # Replace all data tags denoted        #
// # data tags denoted {{ KEY }} in HTML  #
// # ------------------------------------ #
// #                                      #
// # Argument 1: HTML code                #
// # Argument 2: Data to use              #
// #                                      #
// # Return: Updated HTML                 #
// ########################################

function replaceAll(html, data) {
    const keys = Array.from(html.matchAll(/(?<={{)[^}]+/g)).map((match) => match[0].trim());
    return _replaceAll(html, keys, data);
}

// ########################################
// # Generate a component by passing the  #
// # data values                          #
// # ------------------------------------ #
// #                                      #
// # Argument 1: Component file name      #
// # Argument 2: Data to use              #
// #                                      #
// # Return: Component HTML               #
// ########################################

function generate_components(name, data) {
    const [component, style] = get_component(name);

    let keys = Array.from(component.matchAll(/(?<={{)[^}]+/g)).map((match) => match[0].trim());
    return [...data.map((value) => _replaceAll(component, keys, value)), style];
}

// ########################################
// # Insert component into HTML where     #
// # specified. Denoted with {{ <NAME> }} #
// # ------------------------------------ #
// #                                      #
// # Argument 1: HTML code                #
// # Argument 2: Data to use              #
// #                                      #
// # Return: HTML code                    #
// ########################################

function replace_components(html, data) {
    let components = Array.from(html.matchAll(/{{\s*<.+>\s*}}/g)).map((match) => match[0]);
    const names = components.map((component) => component.match(/(?<=<)[^>]+/g)[0]);

    components = components.map((to_replace, index) => {
        let value = (data != undefined && data[names[index]] != undefined) ? data[names[index]] : [{}];
        html = html.replace(to_replace, generate_components(names[index], value));
    });

    return html;
}

// ########################################
// # Insert into data into for block      #
// # ------------------------------------ #
// #                                      #
// # Argument 1: HTML code                #
// # Argument 2: List of elements         #
// #                                      #
// # Return: HTML code                    #
// ########################################

function replace_for(html, elements) {
    return html.replace(/{{\s*<for>\s*}}/g, elements.join('\n'))
}

// ########################################
// # Quick replace specific key with      #
// # value                                #
// # ------------------------------------ #
// #                                      #
// # Argument 1: HTML code                #
// # Argument 2: Key                      #
// # Argument 3: Value to replace with    #
// #                                      #
// # Return: HTML code                    #
// ########################################

function replace(html, key, value) {
    html.replaceAll(`{{ ${key} }}`, value);
}

// ########################################
// # Get a component by name              #
// # ------------------------------------ #
// #                                      #
// # Argument 1: Component file name      #
// #                                      #
// # Return: [div HTML, style HTML]       #
// ########################################

function get_component(name) {
    const component = components[name]
    return [component.match(/<div.+div>/s)[0], component.match(/<style.+style>/s)[0]];
}

module.exports = {load, get_component, generate_components, replace_components, replace_for, replace, replaceAll}
