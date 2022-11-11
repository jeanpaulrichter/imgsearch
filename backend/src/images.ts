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

import sharp from "sharp";
import http from "follow-redirects";
import fs from "node:fs/promises";
import { imageSize } from "image-size";
import type { Image, ImageTransform } from "./types.js"
import { NotFoundError } from "./exceptions.js"

/**
 * Used to download and save images
 */
export class ImageCache {

    private cache = new Map<string, Image>();
    private size = 20;
    
    /**
     * Initialize ImageCache
     * @param size Number of image to be cached at a time
     * @throws Error
     */
    public async init(size: number) {
        if(size > 0 && size < 500) {
            this.size = size;
        }
    }

    /**
     * Get image by web url
     * @param url Image url
     * @returns Image (*not found*-image on error)
     */
    public async get(url: string): Promise<Image> {

        let image = this.cache.get(url);

        try {
            if(image === undefined) {
                image = await this.download(url);
                this.cache.set(url, image);
                if(this.cache.size > this.size) {
                    this.cache.delete(this.cache.keys().next().value);
                }
            }
            return image;
        } catch(err) {
            console.error("Failed to download \"" + url + "\"");
            if(err instanceof Error) {
                console.error(err.message);
            } else {
                console.error(err);
            }
            throw new NotFoundError();
        }
    }

    /**
     * Save image locally
     * @param url Image web url
     * @param path Output file path
     * @param transform Image transform information (resize, crop)
     * @returns true on success
     */
    public async save(url: string, path: string, transform?: ImageTransform): Promise<boolean> {
        try {
            const image = await this.get(url);
            const image_t = await this.transform(image, transform);
            await fs.writeFile(path, image_t.data);
            return true;
        } catch(err) {
            console.error("Failed to write \"" + path + "\"");
            if(err instanceof Error) {
                console.error(err.message);
            }
            return false;
        }
    };

    private download(url: string): Promise<Image> {
        return new Promise(function(resolve, reject) {
            const _url = new URL(url);
    
            const options = {
                "host": _url.hostname,
                "path": _url.pathname + _url.search,
                "headers": {
                    "User-Agent": "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:65.0) Gecko/20100101 Firefox/65.0"
                },
                "maxRedirects": 6,
                "timeout": 2000
            };
    
            const buf: any[] = [];
            const prot = _url.protocol === "https:" ? http.https : http.http;
    
            const req = prot.request(options, res => {
                if(res.statusCode !== 200) {
                    reject("Bad Status code: " + res.statusCode);
                } else if(res.headers["content-type"] === undefined) {
                    reject("Missing content-Type");
                } else if(res.headers["content-type"].substring(0, 6) !== "image/") {
                    reject("Not an image");
                } else {
                    res.on("data", chunk => {
                        buf.push(chunk);
                    });
                  
                    res.on("end", function () {
                        const data = Buffer.concat(buf);
                        try {
                            const size = imageSize(data);
                            if(!size.type || !size.width || !size.height || size.width == 0 || size.height == 0) {
                                throw new Error("Invalid image size");
                            } else {
                                let mime = "image/" + (size.type === "jpg") ? "jpeg" : size.type;
                                resolve({
                                    "mime": mime,
                                    "width": size.width,
                                    "height": size.height,
                                    "data": data
                                });
                            }
                        } catch(err) {
                            console.error(err instanceof Error ? err.message : err);
                            reject("Failed parse image");
                        }
                    });
        
                    res.on("close", () => {
                        if(!res.complete) {
                            reject("Failed to complete request");
                        }
                    });
        
                    res.on("error", err => {
                        reject(err);
                    });
                }
            });
            req.end();
        });
    }
    

    /**
     * Returns transform image for valid transform options
     * @param image Image 
     * @param transform Transform options
     * @returns Transformed image
     */
    private async transform(image: Image, transform?: ImageTransform): Promise<Image> {
        if(transform !== undefined) {
            let image_t = sharp(image.data);
            let width = image.width;
            let height = image.height;

            if(transform.crop_left !== undefined && transform.crop_top !== undefined && transform.crop_width && transform.crop_height) {
                image_t = image_t.extract({
                    "left": transform.crop_left,
                    "top": transform.crop_top,
                    "width": transform.crop_width,
                    "height": transform.crop_height
                });
                width = transform.crop_width;
                height = transform.crop_height;
            }

            if(transform.resize_width && transform.resize_height && transform.resize_fit) {
                image_t = image_t.resize(transform.resize_width, transform.resize_height, {
                    "fit": transform.resize_fit,
                    "position": "center",
                    "background": transform.resize_color
                });
                width = transform.resize_width;
                height = transform.resize_height;
            }

            let mime = transform.mime ? transform.mime : image.mime;
            switch(mime) {
                case "image/png":
                    image_t = image_t.png();
                    break;
                case "image/jpeg":
                    image_t = image_t.jpeg();
                    break;
                case "image/webp":
                    image_t = image_t.webp();
                    break;
                case "image/gif":
                    image_t = image_t.gif();
                    break;
            }

            return {
                "mime": mime,
                "data": await image_t.toBuffer(),
                "width": width,
                "height": height
            };
        } else {
            return image;
        }
    }
}

