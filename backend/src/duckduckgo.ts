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

import * as puppeteer from "puppeteer";
import { SearchResult, ImageProvider, ImageSourceSize } from "./types.js";

/**
 * duckduckgo.com image scrape module
 */
export class DuckDuckSearch implements ImageProvider
{
    private page: puppeteer.Page;
    private resExclude = ["image", "stylesheet", "font", "other"];

    constructor(page: puppeteer.Page) {
        this.page = page;
    }

    /**
     * Init puppeteer page
     */
    public async init(): Promise<void> {
        await this.page.setRequestInterception(true);
        this.page.on("request", this.onRequest.bind(this));
    }

    /**
     * Search for images on duckduckgo.com
     * @param term Search string
     * @param size Image size
     * @param max Maximum number of images retured
     * @returns Array of search results
     */
    public async search(term: string, size: ImageSourceSize, max: number): Promise<SearchResult[]> {
        const ret: SearchResult[] = [];

        const url = `https://duckduckgo.com/?q=${encodeURIComponent(term)}&iar=images&iax=images&ia=images&atb=v343-1${this.getSizeString(size)}`;
        await this.page.goto(url, {waitUntil: "domcontentloaded"});

        // There should be an easier way to do this...

        await this.page.waitForSelector("div.tile", { "timeout": 1000 });
        for(let i = 0; i < max; i++) {
            const thumb_url = await this.page.evaluate((i: number) => {
                const el_images = document.querySelectorAll("div.tile--img");
                if(i < el_images.length) {
                    const el_image = el_images[i] as HTMLElement;
                    el_image.click();
                    const el_img = el_image.querySelector("img");
                    if(el_img) {
                        return el_img.src;
                    }
                }
            }, i);
            if(!thumb_url) {
                continue;
            }

            await this.page.waitForSelector("div.c-detail__filemeta", { "timeout": 500 });
            const info = await this.page.evaluate(() => {
                const fuck = document.querySelectorAll("div.detail__pane");
                for(let x = 0; x < fuck.length; x++) {
                    const el_pane = fuck[x] as HTMLDivElement;
                    if(el_pane.style.transform == "translateX(0px)") {
                        const el_detail = el_pane.querySelector("div.c-detail__filemeta");
                        if(el_detail) {
                            const el_a = el_detail.nextElementSibling;
                            if(el_a) {
                                return {
                                    "size": el_detail.innerHTML,
                                    "url": (el_a as HTMLLinkElement).href
                                }
                            }
                        }
                        break;
                    }
                }
            });
            if(!info) {
                continue;
            }

            const tsplit = info.size.split("×");
            if(tsplit.length !== 2) {
                continue;
            }

            const width = Number.parseInt(tsplit[0]);
            const height = Number.parseInt(tsplit[1]);

            if(Number.isNaN(width) || Number.isNaN(height) || width <= 0 || height <= 0) {
                continue;
            }

            ret.push({
                "url": info.url,
                "thumb_url": thumb_url,
                "width": width,
                "height": height
            });
        }

        return ret;
    }

    /**
     * Close puppeteer page
     */
    public async release(): Promise<void> {
        if(!this.page.isClosed()) {
            await this.page.close();
        }
    }

    /**
     * Intercept and abort http requests for images, fonts etc.
     * @param request HTTP request
     */
    private onRequest(request: puppeteer.HTTPRequest): void {
        if (this.resExclude.includes(request.resourceType())) {
            request.abort();
        } else {
            request.continue();
        }
    }

    /**
     * Returns url component string for image size
     * @param size Image size
     * @returns url component string
     */
    private getSizeString(size: ImageSourceSize):string {
        switch(size) {
            case ImageSourceSize.large:
                return "&iaf=size%3ALarge";
            case ImageSourceSize.medium:
                return "&iaf=size%3AMedium";
            case ImageSourceSize.small:
                return "&iaf=size%3ASmall";
            default:
                return "";
        }
    }
}
