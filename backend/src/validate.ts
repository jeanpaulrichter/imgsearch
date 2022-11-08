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

import { InputError } from "./exceptions.js";
import { ImageTransform, ImageSource, ImageSourceSize } from "./types.js"

/**
 * Used to validate client GET requests
 */
export class GETValidator {
    private obj: { [key: string ]: unknown };

    constructor(obj: unknown) {
        if(typeof obj !== "object" || obj === null) {
            throw new Error("Invalid input object");
        }
        this.obj = obj as { [key: string ]: unknown };
    }

    /**
     * @returns Valid ImageSource
     * @throws InputError
     */
    public source(): ImageSource {
        if(typeof this.obj.source !== "string") {
            throw new InputError("Missing source");
        }
        if(this.obj.source !== "google" && this.obj.source !== "duckduckgo") {
            throw new InputError("Invalid source");
        }
        return this.obj.source;
    }

    /**
     * @returns Valid ImageSourceSize
     * @throws InputError
     */
    public size(): ImageSourceSize {
        if(typeof this.obj.size !== "string") {
            throw new InputError("Missing source size");
        }
        switch(this.obj.size) {
            case "all":
                return ImageSourceSize.all;
            case "large":
                return ImageSourceSize.large;
            case "medium":
                return ImageSourceSize.medium;
            case "small":
                return ImageSourceSize.small;
            default:
                throw new InputError("Invalid image size");
        }
    }

    /**
     * @returns Valid url
     * @throws InputError
     */
    public url(): string {
        if(typeof this.obj.url !== "string") {
            throw new InputError("Missing url");
        }
        if(this.obj.url.length < 5 || this.obj.url.length > 512) {
            throw new InputError("Invalid url");
        }
        return this.obj.url;
    }

    /**
     * @returns Valid search term
     * @throws InputError
     */
    public term(): string {
        if(typeof this.obj.term !== "string") {
            throw new InputError("Missing search term");
        }
        const searchterm = decodeURIComponent(this.obj.term);
        if(searchterm.length < 3 || searchterm.length > 128) {
            throw new InputError("Invalid search term");
        }
        return searchterm;
    }

    /**
     * @returns Valid maximum images number
     * @throws InputError
     */
    public max(): number {
        let max = 5;
        if(typeof this.obj.max === "string") {
            const temp = Number.parseInt(this.obj.max);
            if(!Number.isInteger(temp) || temp < 1 || temp > 20) {
                throw new InputError("Invalid max");
            }
            max = temp;
        }
        return max;
    }

    public info(): boolean {
        return (this.obj.info === "true");
    }
}

/**
 * Used to validate client POST requests
 */
export class POSTValidator {
    private obj: { [key: string ]: unknown };

    constructor(obj: unknown) {
        if(typeof obj !== "object" || obj === null) {
            throw new Error("Invalid input object");
        }
        this.obj = obj as { [key: string ]: unknown };
    }

    /**
     * @returns Valid url
     * @throws InputError
     */
     public url(): string {
        if(typeof this.obj.url !== "string") {
            throw new InputError("Missing url");
        }
        if(this.obj.url.length < 5 || this.obj.url.length > 512) {
            throw new InputError("Invalid url");
        }
        return this.obj.url;
    }

    /**
     * @returns Valid directory string
     * @throws InputError
     */
    public directory(): string {
        if(typeof this.obj.directory !== "string") {
            throw new InputError("Missing directory");
        }
        if(this.obj.directory.length == 0 || this.obj.directory.length > 512) {
            throw new InputError("Invalid directory");
        }
        return this.obj.directory;
    }

    /**
     * @returns Valid filename
     * @throws InputError
     */
    public filename(): string {
        if(typeof this.obj.filename !== "string") {
            throw new InputError("Missing filename");
        }
        const s = this.obj.filename.replace(/[\"*\/:<>?\\|]*/g, "");
        if(s.length == 0 || s.length > 256) {
            throw new InputError("Invalid filename");
        }
        return s;
    }

    /**
     * @returns Valid image transformation options or undefined
     * @throws InputError
     */
    public transform(): ImageTransform | undefined {

        let mime: string | undefined = undefined;
        let rw: number | undefined = undefined;
        let rh: number | undefined = undefined;
        let rfit: "cover" | "contain" | "fill" | undefined = undefined;
        let rcolor: string | undefined = undefined;
        let cx: number | undefined = undefined;
        let cy: number | undefined = undefined;
        let cw: number | undefined = undefined;
        let ch: number | undefined = undefined;

        // Image format
        if(this.obj.format) {
            if(this.obj.format === "png" || this.obj.format === "jpeg" || this.obj.format === "webp" || this.obj.format === "gif") {
                mime = "image/" + this.obj.format;
            } else {
                throw new InputError("Invalid output format");
            }
        }

        // Image resize
        if(this.obj.rw || this.obj.rh || this.obj.rfit || this.obj.rcolor) {
            if(typeof this.obj.rw !== "number" || typeof this.obj.rh !== "number" || typeof this.obj.rfit !== "string") {
                throw new InputError("Invalid resize options (rw,rh,rfit)");
            }
            if(this.obj.rfit !== "cover" && this.obj.rfit !== "contain" && this.obj.rfit !== "fill") {
                throw new InputError("Invalid resize option rfit: expected cover, contain or fill");
            }
            rfit = this.obj.rfit;

            if(rfit === "contain") {
                if(typeof this.obj.rcolor !== "string" || this.obj.rcolor.length === 0 || this.obj.rcolor.length > 256) {
                    throw new InputError("Invalid resize color");
                }
                rcolor = this.obj.rcolor;
            }

            if(!Number.isNaN(this.obj.rw) && !Number.isNaN(this.obj.rh) 
                && this.obj.rw >= 8 && this.obj.rw <= 2048 && this.obj.rh >= 8 && this.obj.rh <= 2048) {
                rw = this.obj.rw;
                rh = this.obj.rh;
            } else {
                throw new InputError("Invalid resize dimensions (rw, rh)");
            }
        }

        // Image crop
        if(this.obj.cx || this.obj.cy || this.obj.cw || this.obj.ch) {
            if(typeof this.obj.cx !== "number" || typeof this.obj.cy !== "number" || typeof this.obj.cw !== "number" || typeof this.obj.ch !== "number") {
                throw new InputError("Invalid crop options (cx,cy,cw,ch)");
            }

            if(!(Number.isNaN(this.obj.cx) || Number.isNaN(this.obj.cy) || Number.isNaN(this.obj.cw) || Number.isNaN(this.obj.ch)) 
                && this.obj.cx >= 0 && this.obj.cy >= 0 && this.obj.cw >= 0 && this.obj.ch >= 0
                && this.obj.cx <= 4086 && this.obj.cy <= 4086 && this.obj.cw <= 4086 && this.obj.ch <= 4086) {

                cx = this.obj.cx;
                cy = this.obj.cy;
                cw = this.obj.cw;
                ch = this.obj.ch;
            } else {
                throw new InputError("Invalid crop options");
            }
        }

        if(mime !== undefined || rw !== undefined || cx !== undefined) {
            return {
                "resize_width": rw,
                "resize_height": rh,
                "resize_fit": rfit,
                "resize_color": rcolor,
                "crop_left": cx,
                "crop_top": cy,
                "crop_width": cw,
                "crop_height": ch,
                "mime": mime
            }
        } else {
            return undefined;
        }
    }
}