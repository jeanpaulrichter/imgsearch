import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function copy(src, target, process, extension) {
    let srcPath = path.join(__dirname, "..", src);
    const targetPath = path.join(__dirname, "..", target);

    if(!fs.existsSync(srcPath)) {
        throw new Error(srcPath + " does not exist");
    }
    const stat = fs.lstatSync(srcPath);
    if(stat.isDirectory() || stat.isFile()) {
        fs.mkdirSync(targetPath, { recursive: true });
        const srcFilenames = [];

        if(stat.isDirectory()) {
            for(const item of fs.readdirSync(srcPath, { "withFileTypes": true })) {
                if(item.isFile()) {
                    srcFilenames.push(item.name);
                }
            }
        } else {
            srcFilenames.push(path.basename(srcPath));
            srcPath = path.dirname(srcPath);
        }

        for(const filename of srcFilenames) {
            const srcFile = path.join(srcPath, filename);
            let targetFile = path.join(targetPath, filename);

            if(process) {
                const data = process(srcFile);
                if(extension) {
                    const idx = targetFile.lastIndexOf(".");
                    targetFile = targetFile.substring(0, idx + 1) + extension;
                }
                fs.writeFileSync(targetFile, data);
            } else {
                fs.copyFileSync(srcFile, targetFile);
                console.log(`Created "${targetFile.toString()}"`);
            }
        }
    } else {
        throw new Error(srcPath + " is neither file nor directory");
    }
}