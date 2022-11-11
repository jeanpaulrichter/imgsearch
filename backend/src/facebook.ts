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
 
/**
 * Used to get "real" image url from https://lookaside.fbsbx.com/...
 */
export class Facebook
{
    private page: puppeteer.Page | undefined;
    private getPage: ()=>Promise<puppeteer.Page>;
    private resExclude = ["image", "stylesheet", "font", "other"];

    constructor(getPage: ()=>Promise<puppeteer.Page>) {
        this.getPage = getPage;
    }

    /**
     * Init puppeteer page
     */
    public async init(): Promise<void> {
        this.page = await this.setupPage();
        console.log("Facebook ready.");
    }

    /**
     * Get real image url
     * @param url facebook url
     * @returns Array of search results
     */
    public async getImageURL(url: string): Promise<string | undefined> {
        try {
            if(!this.page || this.page.isClosed()) {
                this.page = await this.setupPage();
            }
            // to be honest: there has to be a smarter way than this...
            let tries = 0;

            while(tries < 2) {
                await this.page.goto(url, {
                    "waitUntil": "domcontentloaded",
                    "timeout": 3000
                });

                const html = await this.page.content();
                const img = html.match(/<img data-visualcompletion="media-vc-image[^>]+?src="([^"]+)[^>]+?>/);

                if(Array.isArray(img) && img.length == 2) {
                    return img[1].replace(/&amp;/g, "&");
                }
                tries++;
            }
            console.error("Failed to get image url from https://lookaside.fbsbx.com/...")
            return undefined;
        } catch(err) {
            console.error(err instanceof Error ? err.message : err);
        }
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

    private async setupPage(): Promise<puppeteer.Page> {
        try {
            if(this.page && !this.page.isClosed()) {
                return this.page;
            }
            this.page = await this.getPage();
            await this.page.setRequestInterception(true);
            this.page.on("request", this.onRequest.bind(this));

            return this.page;
        } catch(err) {
            throw new Error("Failed to setup facebook browser page: " + ((err instanceof Error) ? err.message : err));
        }
    }
}
