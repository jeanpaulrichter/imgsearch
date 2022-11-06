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

import { ImageManager } from "./images.js"
import { Settings } from "./settings.js"
import { Searchlist } from "./list.js"
import { Logger } from "./log.js"
import { Resizer } from "./resizer.js"

enum Button {
    start = 0,
    abort = 1,
    change = 2,
    skip = 3,
    save = 4
}

export class ImageSearch {

    private working: boolean;
    private log: Logger;
    private settings: Settings;
    private list: Searchlist;
    private images: ImageManager;
    private buttons: HTMLButtonElement[];
    private resizer: Resizer;

    constructor() {
        this.buttons = [
            document.getElementById("btnStart") as HTMLButtonElement,
            document.getElementById("btnAbort") as HTMLButtonElement,
            document.getElementById("btnChangeTerm") as HTMLButtonElement,
            document.getElementById("btnSkip") as HTMLButtonElement,
            document.getElementById("btnSave") as HTMLButtonElement
        ];

        this.buttons[Button.start].addEventListener("click", this.onStart.bind(this))
        this.buttons[Button.abort].addEventListener("click", this.onAbort.bind(this));
        this.buttons[Button.skip].addEventListener("click", this.onSkip.bind(this));
        this.buttons[Button.change].addEventListener("click", this.onChangeTerm.bind(this));
        this.buttons[Button.save].addEventListener("click", this.onSave.bind(this));
        

        document.getElementById("current_term")!.addEventListener("keyup", this.onKeyUpCurrentTerm.bind(this));

        this.working = false;
        this.log = new Logger();
        this.settings = new Settings();
        this.list = new Searchlist(this.log, this.settings);
        this.images = new ImageManager(this.log, this.settings);
        this.resizer = new Resizer();

        this.resizer.addHorizontal("splitter_horizontal", "main_left", "main_right");
        this.resizer.addVertical("splitter_right_vertical", "panel_canvas", "panel_log");
        this.resizer.addVertical("splitter_left_vertical_1", "panel_searchterms", "panel_results");
        this.resizer.addVertical("splitter_left_vertical_2", "panel_searchterms", "panel_results");
    }

    private async nextSearch() {
        this.disableButtons(true, Button.abort, Button.change, Button.skip, Button.save);
        while(this.working && await this.list.next()) {
            if(await this.images.search(this.list.term())) {
                if(this.settings.auto) {
                    await this.images.save(this.list.filename());
                } else {
                    this.disableButtons(false, Button.abort, Button.change, Button.skip, Button.save);
                    break;
                }
            }
        }
        if(this.list.done()) {
            this.log.msg("Done");
            this.endSearch();
        }
    }

    private disableButtons(v: boolean, ...buttons: Button[] ) {
        for(const x of buttons) {
            this.buttons[x].disabled = v;
        }
    }

    private endSearch() {
        this.working = false;
        this.images.clear();
        this.disableButtons(false, Button.start);
        this.disableButtons(true, Button.abort, Button.change, Button.skip, Button.save);
        this.settings.end();
        this.list.end();
    }

    private async onStart() {
        try {
            await this.settings.start();
            this.list.start();
            this.log.clear();
            this.disableButtons(true, Button.start);
            this.working = true;
            this.nextSearch();
        } catch(err) {
            if(err instanceof Error) {
                this.log.error(err.message);
            } else {
                console.error(err);
            }
            this.endSearch();
        }
    }

    private onAbort() {
        this.log.msg("Abort");
        this.endSearch();
    }

    private onSkip() {
        this.log.msg("Skipping \"" + this.list.filename() + "\"");
        this.nextSearch();
    }

    private async onChangeTerm(evt: Event) {
        const el_term = document.getElementById("current_term") as HTMLInputElement;
        if(el_term.value.length >= 3) {
            const el_btn = evt.target as HTMLButtonElement;
            el_btn.disabled = true;
            await this.images.search(el_term.value);
            el_btn.disabled = false;
        }
    }

    private async onKeyUpCurrentTerm(evt: KeyboardEvent) {
        const el_term = evt.target as HTMLInputElement;
        if (evt.key === "Enter" || evt.keyCode === 13) {
            if(el_term.value.length >= 3) {
                const el_btn = document.getElementById("btnChangeTerm") as HTMLButtonElement;
                el_btn.disabled = true;
                await this.images.search(el_term.value);
                el_btn.disabled = false;
            }
        }
    }

    private async onSave(evt: Event) {
        const el_btn = evt.target as HTMLButtonElement;
        el_btn.disabled = true;
        await this.images.save(this.list.filename());
        await this.nextSearch();
    }
}

let app: ImageSearch | null = null;

window.addEventListener("load", () => {
    app = new ImageSearch();
})

