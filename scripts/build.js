import path from "node:path";
import fs from "node:fs";
import sass from "sass";
import { rollup } from "rollup";
import { terser } from "rollup-plugin-terser";
import typescript from "@rollup/plugin-typescript";
import { fileURLToPath } from 'node:url';
import { copy } from "./copy.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function process(dir, entry, output, format, external) {
    const srcDir = path.join(__dirname, "..", dir);
    const configFile = path.join(srcDir, "tsconfig.json");
    const entryFile = path.join(srcDir, entry);
    const outputFile = path.join(__dirname, "..", output);

    const bundle = await rollup({
        "input": entryFile,
        "plugins": [ typescript({
            "tsconfig": configFile,
            "sourceMap": false,
            "mapRoot": undefined
        })],
        "external": external
    });
    await bundle.write({
        "file": outputFile,
        "format": format,
        "plugins": [terser({
            "format": {
                "comments": false
            }
        })],
        "sourcemap": false
    });
    console.log(`Created "${outputFile}"`);
}

export async function build() {
    try {
        const backend_externals = ["node:url", "node:path", "node:fs", "node:fs/promises", "node:http", "follow-redirects", "express", "puppeteer", "sharp", "image-size"];

        const distPath = path.join(__dirname, "../dist");
        if(fs.existsSync(distPath)) {
            fs.rmSync(distPath, { recursive: true });
            console.log(`Deleted "${distPath.toString()}`);
        }
        
        console.log("Building imgsearch...");
        copy("frontend/html", "dist/www");
        copy("frontend/css", "dist/www/css", (file) => { return sass.compile(file).css.toString(); }, "css");
        copy("frontend/images", "dist/www/images");
        copy("frontend/fonts", "dist/www/css/fonts");
        copy("frontend/thirdparty/css", "dist/www/css");
        copy("frontend/thirdparty/js", "dist/www/js");
        copy("config.ini", "dist");
        await process("backend", "src/server.ts", "dist/server.cjs", "cjs", backend_externals);
        await process("frontend", "src/index.ts", "dist/www/js/index.js", "es");

        console.log("Done. You can now run \"npm run package\" to build a binary package.");

    } catch (err) {
        if(err instanceof Error) {
            console.error(err.message);
        } else {
            console.error(err);
        }        
    }
}

build();