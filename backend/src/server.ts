/**
 * Copyright 2022 github.com/jeanpaulrichter
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import http from "node:http";
import path from "node:path";
import express from "express";
import fs from "node:fs";
import { fileURLToPath } from 'node:url';

import { InputError, AuthError, LoggedError, NotFoundError } from "./exceptions.js";
import { Scraper } from "./scraper.js";
import { ImageCache } from "./images.js";
import { GETValidator, POSTValidator } from "./validate.js";
import { IniConfig } from "./config.js";

const config = new IniConfig();
const scraper = new Scraper();
const images = new ImageCache();
const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "www"))); // path.join for pkg

/**
 * /image?url=image_url
 * Returns image or information about image
 */
app.get("/image", async(req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
        const query = new GETValidator(req.query);
        const image = await images.get(query.url());
        if(query.info()) {
            res.set("Content-Type", "application/json").send({
                "width": image.width,
                "height": image.height,
                "mime": image.mime,
                "filesize": image.data.byteLength
            });
        } else {
            res.set("Content-Type", image.mime).set("Access-Control-Allow-Origin", "localhost");
            res.set("ImageWidth", image.width.toString()).set("ImageHeight", image.height.toString());
            res.end(image.data, "binary");
        }
    } catch(err) {
        next(err);
    }
});

/**
 * /search?source=xxx&term=yyy&max=zzz
 * Returns array of found images (see ImageInfo)
 */
app.get("/search", async(req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
        const query = new GETValidator(req.query);
        const images = await scraper.search(query.source(), query.term(), query.max());
        res.set("Content-Type", "application/json").send(images);
    } catch(err) {
        next(err);
    }
});

/**
 * Check if local directory or file exist
 * dir: directory path
 * file: filename (optional)
 */
app.post("/check", (req: express.Request, res: express.Response) => {
    const body = new POSTValidator(req.body);
    if(req.body.filename !== undefined) {
        const filepath = path.join(body.directory(), body.filename());
        res.send({
            "exists": fs.existsSync(filepath)
        });
    } else {
        const dir = body.directory();
        res.send({
            "exists": fs.existsSync(dir) && fs.lstatSync(dir).isDirectory()
        });
    }
});

/**
 * Save image
 * url: image url
 * dir: local directory
 * file: filename
 */
app.post("/save", async(req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
        const body = new POSTValidator(req.body);
        const filepath = path.join(body.directory(), body.filename());
        const ret = await images.save(body.url(), filepath, body.transform());
        res.send({
            "success": ret
        });
    } catch(err) {
        next(err);
    }
});

/**
 * Error handler
 */
app.use((err: unknown, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if(res.headersSent) {
        return next(err);
    }
    if(err instanceof InputError) {
        res.status(400).send(err.message);
    } else if(err instanceof AuthError) {
        res.status(401).send("Unauthorized request")
    } else if(err instanceof NotFoundError) {
        res.status(404).send("Resource not found");
    } else {
        if(!(err instanceof LoggedError)) {
            console.error(err);
        }
        res.status(500).send("Internal error");
    }
});

const server = http.createServer(app);

server.on("error", err => {
    console.error(err);
    process.exit(2);
});

/**
 * Initialize sub modules
 */
async function init() {
    await config.init("config.ini");
    await scraper.init(config.chrome);    
    await images.init(config.cachesize);
}

/**
 * Startup server...
 */
init().then(() => {
    server.listen(config.port, () => {
        const address = server.address();
        if(typeof address === "object" && address !== null) {
            console.log("Imgsearch started. Listening at port " + address.port);    
        } else {
            console.error("Failed to get server address");
            process.exit(3);
        }
    });
}).catch(err => {
    if(err instanceof Error) {
        console.error(err.message);
    } else {
        console.error(err);
    }
    process.exit(1);
})
