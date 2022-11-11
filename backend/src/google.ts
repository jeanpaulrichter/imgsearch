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
import { SearchResult, ImageProvider, ImageSourceSize, FBGetImageURL } from "./types.js";

/**
 * Google.com image scrape module
 */
export class GoogleSearch implements ImageProvider
{
    private page: puppeteer.Page | undefined;
    private getPage: ()=>Promise<puppeteer.Page>;
    private getFBImage: FBGetImageURL;
    private resExclude = ["image", "stylesheet", "font", "other"];
    private regex_newlines = /\r\n?|\n/g;
    private regex_images = /\["(https:\/\/encrypted-[^,]+?)",\d+,\d+\],\["(http.+?)",(\d+),(\d+)\]/g;

    constructor(getPage: ()=>Promise<puppeteer.Page>, getFBImage: FBGetImageURL) {
        this.getPage = getPage;
        this.getFBImage = getFBImage;
    }

    /**
     * Init puppeteer page
     */
    public async init(): Promise<void> {
        this.page = await this.setupPage();
        console.log("Google ready.");
    }

    /**
     * Search for images on google.com
     * @param term Search string
     * @param size Size of images
     * @param max Maximum number of images retured
     * @returns Array of search results
     */
    public async search(term: string, size: ImageSourceSize, max: number): Promise<SearchResult[]> {
        const ret: SearchResult[] = [];

        try {
            if(!this.page || this.page.isClosed()) {
                this.page = await this.setupPage();
            }

            const url = `https://www.google.com/search?q=${encodeURIComponent(term)}&tbm=isch&client=firefox-b-d&source=lnt${this.getSizeString(size)}`;
            await this.page.goto(url, {
                "waitUntil": "domcontentloaded",
                "timeout": 5000
            });

            const html = (await this.page.content()).replace(this.regex_newlines, "");
            const img_data = [...html.matchAll(this.regex_images)];

            let count = 0;
            for(let i = 0; i < img_data.length && count < max; i++) {
                let url = JSON.parse(`"${img_data[i][2]}"`);

                // stupid facebook image results...
                if(url.substring(0, 27) == "https://lookaside.fbsbx.com") {
                    url = await this.getFBImage(url);
                    if(!url) {
                        continue;
                    }
                }

                ret.push({
                    "thumb_url": JSON.parse(`"${img_data[i][1]}"`),
                    "url": url,
                    "height": Number.parseInt(img_data[i][3]),
                    "width": Number.parseInt(img_data[i][4])
                });
                count++;
            }
        } catch(err) {
            console.error((err instanceof Error) ? err.message : err);
        }

        return ret;
    }

    /**
     * Close puppeteer page
     */
    public async release() {
        if(this.page && !this.page.isClosed()) {
            await this.page.close();
        }
    }

    /**
     * Intercept and abort http requests for images, fonts etc.
     * @param request HTTP request
     */
    private onRequest(request: puppeteer.HTTPRequest) {
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
    private getSizeString(size: ImageSourceSize) {
        switch(size) {
            case ImageSourceSize.large:
                return "&tbs=isz:l";
            case ImageSourceSize.medium:
                return "&tbs=isz:m";
            case ImageSourceSize.small:
                return "&tbs=isz:i";
            default:
                return "";
        }
    }

    private async setupPage(): Promise<puppeteer.Page> {
        try {
            if(this.page && !this.page.isClosed()) {
                return this.page;
            }
            this.page = await this.getPage();
            await this.page.setRequestInterception(true);
            this.page.on("request", this.onRequest.bind(this));

            // trying to get rid of cookie banner...
            await this.page.goto("https://www.google.com/search?q=cool&tbm=isch&client=firefox-b-d&source=lnt", {
                "waitUntil": "domcontentloaded",
                "timeout": 3000            
            });
            await this.page.evaluate(() => {
                const el_forms = document.getElementsByTagName("FORM");
                for(let i = 0; i < el_forms.length; i++) {
                    const form = el_forms[i] as HTMLFormElement;
                    if(form.action.substring(0, 26) == "https://consent.google.com") {
                        form.submit();
                        break;
                    }
                }
            });
            await this.page.waitForNetworkIdle();
            return this.page;
        } catch(err) {
            throw new Error("Failed to setup google browser page: " + ((err instanceof Error) ? err.message : err));
        }
    }
}
