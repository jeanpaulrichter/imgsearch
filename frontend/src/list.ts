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

import { Logger } from "./log.js"
import { Settings } from "./settings.js";

export class Searchlist {

    private filenames: string[] = [];
    private terms: string[] = [];
    private size: number = 0;
    private index: number = 0;
    private log: Logger;
    private settings: Settings;
    private extension: string = "";

    constructor(log: Logger, settings: Settings) {
        this.log = log;
        this.settings = settings;
    }

    private el = {
        "text": document.getElementById("searchterms") as HTMLTextAreaElement,
        "mask": document.getElementById("searchterms_mask") as HTMLElement,
        "cur_filename": document.getElementById("current_filename") as HTMLElement,
        "cur_index": document.getElementById("current_index") as HTMLElement,
        "cur_term": document.getElementById("current_term") as HTMLInputElement,
    };

    /**
     * Validate current searchterms & lock controls
     * @throws Error
     */
    public start(): void {
        this.terms = [];
        this.filenames = [];

        const lines = this.el.text.value.match(/[^\r\n]+/g);
        if(lines === null) {
            throw new Error("No valid search terms found");
        }

        const regex_split = /\|/;
        const regex_file_bad = /[\"*\/:<>?\\|]*/g;

        for(let i = 0; i < lines.length; i++) {
            const t = lines[i].split(regex_split);
            if(t.length == 1) {
                // searchterm == filename
                const str = lines[i].trim();
                if(str.length > 0) {
                    this.terms.push(str);
                    this.filenames.push(str.replace(regex_file_bad, ""));
                }
            } else if(t.length == 2) {
                // seperate filename
                const term = t[0].trim();
                const fn = t[1].trim();
                if(term.length > 0 && fn.length > 0) {
                    this.terms.push(term);
                    this.filenames.push(fn.replace(regex_file_bad, ""));
                } else {
                    throw new Error("Invalid search term: " + lines[i]);
                }
            } else {
                throw new Error("Invalid search term: " + lines[i]);
            }
        }

        if(this.terms.length === 0) {
            throw new Error("Missing valid search terms");
        }

        if(this.settings.format === "jpeg") {
            this.extension = "jpg";
        } else {
            this.extension = this.settings.format;
        }

        this.size = this.terms.length;
        this.index = -1;

        this.el.mask.classList.remove("hidden");
    }

    /**
     * Unlock controls
     */
    public end() {
        this.el.mask.classList.add("hidden");
        this.el.cur_filename.innerHTML = "";
        this.el.cur_index.innerHTML = "";
        this.el.cur_term.value = "";
        this.el.cur_term.disabled = true;
    }

    /**
     * Get current search term
     * @returns search term string
     */
    public term(): string {
        return this.terms[this.index];
    }

    /**
     * Get current filename
     * @returns filename string
     */
    public filename(): string {
        return this.filenames[this.index] + "." + this.extension;
    }

    /**
     * Switch to next search term
     * @returns true if another search term available
     */
    public async next(): Promise<boolean> {
        while(++this.index < this.size) {
            const filename = this.filenames[this.index] + "." + this.extension;
            if(await this.fileExits(filename)) {
                this.log.warning(`"${filename}" already exits: skipping...`);
            } else {
                this.el.cur_filename.innerHTML = filename;
                this.el.cur_index.innerHTML = `${this.index + 1} / ${this.size}`;
                this.el.cur_term.value = this.terms[this.index];
                return true;
            }
        }
        return false;
    }

    /**
     * Check if more search terms available
     * @returns true if no more term available
     */
    public done(): boolean {
        return (this.index >= this.size);
    }


    private async fileExits(filename: string): Promise<boolean> {
        try {
            const res = await fetch("check", {
                "method": "POST",
                "headers": {
                    "Accept": "application/json",
                    "Content-Type": "application/json"
                },
                "body": JSON.stringify({
                    "directory": this.settings.output_dir,
                    "filename": filename
                })
            });
            if(res.status !== 200) {
                throw await res.text();
            }
            const ret = await res.json();
            if(typeof ret.exists !== "boolean") {
                throw new Error("Unexpected response");
            }
            return ret.exists;
        } catch(err) {
            console.error("Failed to check if file exists");
            console.error(err);
            return true;
        }
    }
}