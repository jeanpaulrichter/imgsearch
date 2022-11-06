import {exec} from "pkg";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from 'node:url';
import { copy } from "./copy.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function pack() {
    try {
        const distPath = path.join(__dirname, "../dist");
        if(!fs.existsSync(distPath)) {
            throw new Error("Please build first: npm run build");
        }

        const binPath = path.join(__dirname, "../bin");
        if(fs.existsSync(binPath)) {
            fs.rmSync(binPath, { recursive: true });
            console.log(`Deleted "${binPath.toString()}`);
        }
        
        console.log("Packaging imgsearch...");
    
        copy("node_modules/sharp/build/Release", "bin/sharp/build/Release");
        copy("config.ini", "bin");
        await exec([path.join(__dirname, "..", "package.json"), "--compress", "GZip"]);
    
        console.log("Done. (see /bin)");
    } catch(err) {
        if(err instanceof Error) {
            console.error(err.message);
        } else {
            console.error(err);
        }
    }
}

pack();