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

import type { SearchResult } from "./types.js";
import { ImageCanvas } from "./canvas.js";
import { Settings } from "./settings.js"
import { Logger } from "./log.js";

export class ImageManager {
    private settings: Settings;
    private log: Logger;
    private canvas: ImageCanvas
    private images: SearchResult[];
    private index: number;
    private el = {
        "cur_term": document.getElementById("current_term") as HTMLInputElement,
        "results": document.getElementById("panel_results") as HTMLDivElement
    };
    private cur_selection: HTMLElement | null;

    constructor(log: Logger, settings: Settings) {
        this.canvas = new ImageCanvas();
        this.log = log;
        this.settings = settings;
        this.images = [];
        this.index = 0;
        this.cur_selection = null;
    }

    public async search(term: string): Promise<boolean> {
        try {
            this.el.cur_term.disabled = true;
            this.clear();
            const timestamp = Date.now();

            const url = `search?source=${this.settings.source}&term=${encodeURIComponent(term)}&max=${this.settings.image_count}`;  
            this.log.msg("Searching for \"" + term + "\"...");

            const res = await fetch(url);
            if(res.status !== 200) {
                throw new Error(await res.text());
            }
            this.images = await res.json() as SearchResult[];
            this.index = 0;

            if(this.images.length === 0) {
                return false;
            }

            if(!this.settings.auto) {
                for(let i = 0; i < this.images.length; i++) {
                    const el_div = document.createElement("DIV") as HTMLDivElement;
                    const el_span = document.createElement("SPAN") as HTMLSpanElement;
                    const el_img = document.createElement("IMG") as HTMLImageElement;
                    el_div.dataset.index = i.toString();
                    el_span. innerHTML = this.images[i].width + " x " + this.images[i].height;
                    el_img.src = this.images[i].thumb_url;                    
                    el_img.addEventListener("click", this.onClickImage.bind(this));
                    el_div.appendChild(el_img);
                    el_div.appendChild(el_span);
                    this.el.results.appendChild(el_div);
                }
                this.el.cur_term.disabled = false;
            }

            const seconds = ((Date.now() - timestamp) / 1000).toFixed(2);
            this.log.msg("Found " + this.images.length + " images in " + seconds + " seconds.");
            
            return true;
        } catch(err) {
            console.error(err);
            this.log.error("Search for \"" + term + "\" failed.");
            return false;
        }
    }

    public async save(filename: string): Promise<boolean> {
        if(this.images.length == 0 || this.index >= this.images.length || this.index < 0) {
            console.error("Nothing to save");
            return false;
        }
        
        try {
            const options: {[key: string]: string | number } = {};
            options.url = this.images[this.index].url;
            options.directory = this.settings.output_dir;
            options.filename = filename;
            options.format = this.settings.format;

            if(this.settings.resize) {
                options.rw = this.settings.resize_width;
                options.rh = this.settings.resize_height;
                options.rfit = this.settings.resize_fit;
                if(options.rfit == "contain") {
                    options.rcolor = this.settings.resize_color;
                }
            }
            const crop_rect = this.canvas.getCropSelection();
            if(crop_rect) {
                options.cx = crop_rect.x;
                options.cy = crop_rect.y;
                options.cw = crop_rect.width;
                options.ch = crop_rect.height;
            }

            const res = await fetch("save", {
                "method": "POST",
                "headers": {
                    "Accept": "application/json",
                    "Content-Type": "application/json"
                },
                "body": JSON.stringify(options)
            });
            if(res.status !== 200) {
                throw await res.text();
            }
            const ret = await res.json();
            if(ret.success) {
                this.log.msg("Saved image \"" + filename + "\"");
            } else {
                this.log.error("Failed to save \"" + filename + "\"");
            }
            return ret.success;

        } catch(err) {
            this.log.error("Failed to save \"" + filename + "\"");
            console.error(err);
            return false;
        }
    }

    public clear() {
        this.cur_selection = null;
        while (this.el.results.lastElementChild) {
            this.el.results.removeChild(this.el.results.lastElementChild);
        }
        this.canvas.clear();
    }

    private onClickImage(evt: Event) {
        if(evt.target instanceof HTMLElement) {
            const el_div = evt.target.tagName === "DIV" ? evt.target : evt.target.parentElement as HTMLElement;
            if(this.cur_selection !== el_div) {
                this.index = Number.parseInt(el_div.dataset.index!);
                if(this.cur_selection) {
                    this.cur_selection.classList.remove("selected");
                }
                el_div.classList.add("selected");
                this.cur_selection = el_div;
                this.canvas.setImage(this.images[this.index]);
            }
        }
    }
}