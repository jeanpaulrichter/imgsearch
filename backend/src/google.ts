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
import type { SearchResult, ImageProvider } from "./types.js";

/**
 * Google.com image scrape module
 */
export class GoogleSearch implements ImageProvider
{
    private page: puppeteer.Page;
    private resExclude = ['image', 'stylesheet', 'font', 'other'];
    private regex_newlines = /\r\n?|\n/g;
    private regex_images = /\["(https:\/\/encrypted-[^,]+?)",\d+,\d+\],\["(http.+?)",(\d+),(\d+)\]/g;

    constructor(page: puppeteer.Page) {
        this.page = page;
    }

    /**
     * Init puppeteer page
     */
    public async init(): Promise<void> {

        await this.page.setRequestInterception(true);
        this.page.on("request", this.onRequest.bind(this));

        try {
            // trying to get rid of cookie banner...
            // better international version needed...
            await this.page.goto("https://www.google.com/search?q=cool&tbm=isch&client=firefox-b-d&source=lnt", {waitUntil: "domcontentloaded"});
            await this.page.click("button[aria-label='Alle akzeptieren']");
            await this.page.waitForNetworkIdle(); 
        } catch(err) {
            //
        }
    }

    /**
     * Search for images on google.com
     * @param term Search string
     * @param max Maximum number of images retured
     * @returns Array of search results
     */
    public async search(term: string, max: number): Promise<SearchResult[]> {
        const ret: SearchResult[] = [];

        const url = `https://www.google.com/search?q=${encodeURIComponent(term)}&tbm=isch&client=firefox-b-d&source=lnt`;
        await this.page.goto(url, {waitUntil: "domcontentloaded"});

        const html = (await this.page.content()).replace(this.regex_newlines, "");
        const img_data = [...html.matchAll(this.regex_images)];

        for(let i = 0; i < img_data.length && i < max; i++) {
            ret.push({
                "thumb_url": JSON.parse(`"${img_data[i][1]}"`),
                "url": JSON.parse(`"${img_data[i][2]}"`),
                "height": Number.parseInt(img_data[i][3]),
                "width": Number.parseInt(img_data[i][4])
            });
        }

        return ret;
    }

    /**
     * Close puppeteer page
     */
    public async release() {
        if(!this.page.isClosed()) {
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
}
