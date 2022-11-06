/*
    This script is used to mirror certain files/folders into the "debug" folder during development
*/

import path from "path";
import fs from "fs";
import * as chokidar from "chokidar";
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/* ------------------------------------------------------------------------------------------------------------------------------------------ */
// Folders to watch
const watchlist = [
    {
        "from": "frontend/html",
        "to": "debug/www"
    },
    {
        "from": "frontend/images",
        "to": "debug/www/images"
    },
    {
        "from": "frontend/thirdparty/css",
        "to": "debug/www/css"
    },
    {
        "from": "frontend/fonts",
        "to": "debug/www/css/fonts"
    },
    {
        "from": "frontend/thirdparty/js",
        "to": "debug/www/js"
    },
    {
        "from": "backend/resources",
        "to": "debug/resources"
    },
    {
        "from": "config.ini",
        "to": "debug"
    }
];

/* ------------------------------------------------------------------------------------------------------------------------------------------ */

function getListIndex(file) {
    const fp = path.dirname(file);

    for(let i = 0; i < watchlist.length; i++) {
        if((watchlist[i].file === true && file.length > watchlist[i].from.length 
            && file.substring(file.length - watchlist[i].from.length).replace(/\\/g, "/") === watchlist[i].from)
            || (watchlist[i].dir === true && fp.length > watchlist[i].from.length && 
                fp.substring(fp.length - watchlist[i].from.length).replace(/\\/g, "/") === watchlist[i].from)) {
            return i;
        }
    }

    return -1;
}

function onChange(file) {
    try {
        const idx = getListIndex(file);
        if(idx >= 0) {
            const filename = path.basename(file);
            fs.copyFileSync(file, path.join(watchlist[idx].to, filename));
            console.log("Copied \"" + filename + "\" to \"" + watchlist[idx].to + "\"");
        } else {
            console.log("Unexpected file: " + file);
        }
    } catch(exc) {
        if(exc instanceof Error) {
            console.error(exc.message);
        } else {
            console.error(exc);
        }
    }
}

function onDelete(file) {
    try {
        const idx = getListIndex(file);
        if(idx >= 0) {
            const filename = path.basename(file);
            const target = path.join(watchlist[idx].to, filename);
            fs.unlinkSync(target);
            console.log("Deleted \"" + target + "\"");
        } else {
            console.log("Unexpected file: " + file);
        }
    } catch(exc) {
        if(exc instanceof Error) {
            console.error(exc.message);
        } else {
            console.error(exc);
        }
    }
}

/* ------------------------------------------------------------------------------------------------------------------------------------------ */

// Setup chokidar
const watch_files = chokidar.watch([], {
    ignored: /(^|[\/\\])\../,
    persistent: true,
    followSymlinks: false,
    ignoreInitial: false,
    depth: 0
});
watch_files.on("add", onChange);
watch_files.on("change", onChange);
watch_files.on("unlink", onDelete);

for(let i = 0; i < watchlist.length; i++) {
    if(!fs.existsSync(watchlist[i].from)) {
        console.log(`${watchlist[i].from} does not exist: ignoring it...`);
        continue;
    }
    const stat = fs.lstatSync(watchlist[i].from);
    if(stat.isFile()) {
        watchlist[i].file = true;
    } else if(stat.isDirectory()) {
        watchlist[i].dir = true;
    } else {
        console.log(`${watchlist[i].from} is not a file/directory: ignoring it...`);
    }

    // Create target folder
    fs.mkdirSync(path.join(__dirname, "..", watchlist[i].to), { recursive: true });

    watch_files.add(path.join(__dirname, "..", watchlist[i].from));
    console.log("Watching \"" + watchlist[i].from + "\"...");
}