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
import { GoogleSearch } from "./google.js";
import { DuckDuckSearch } from "./duckduckgo.js";
import { Facebook } from "./facebook.js";
import type { SearchResult, ImageSource, ImageSourceSize, ImageProvider } from "./types.js";

/**
 * Web image scraper. Used image source classes to do the work
 */
export class Scraper
{
    private browser: puppeteer.Browser | null = null;
    private provider: {[key: string]: ImageProvider} = {};
    private chromium: string = "";

    private facebook: Facebook | undefined;

    constructor() {}

    /**
     * Initialize scraper
     * @param chromium_path Path to chromium for puppeteer to use
     */
    public async init(chromium_path: string) {
        this.chromium = chromium_path;

        const getPage = this.getPage.bind(this);
        await this.launchBrowser();

        this.facebook = new Facebook(getPage);
        this.facebook.init();

        this.provider.google = new GoogleSearch(getPage, this.facebook.getImageURL.bind(this.facebook));
        this.provider.google.init();

        this.provider.duckduckgo = new DuckDuckSearch(getPage);
        this.provider.duckduckgo.init();
    }

    /**
     * Search for image
     * @param source Image source
     * @param size Image size
     * @param term Searchterm
     * @param max Maximum number of images to return
     * @returns Array of results
     */
    public async search(source: ImageSource, size: ImageSourceSize, term: string, max: number): Promise<SearchResult[]> {
        return this.provider[source].search(term, size, max);
    }

    /**
     * Close chromium instance
     */
    public release() {
        if(this.browser) {
            this.browser.close();
        }
    }

    private async getPage(): Promise<puppeteer.Page> {
        if(this.browser == null || !this.browser.isConnected()) {
            this.browser = await this.launchBrowser();
        }
        return await this.browser.newPage();
    }

    private async launchBrowser() {
        this.browser = await puppeteer.launch({
            "headless": false,
            "executablePath": this.chromium
        });
        return this.browser;
    }
}
