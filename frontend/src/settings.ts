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

import type { ImageSource, ImageFormat, ResizeFit } from "types.js"

declare class Pickr {
    static create(options: any): {
        on: (e: string, color: any) => void;
    };
}

export class Settings {
    public source: ImageSource = "google";
    public image_size: string = "";
    public image_count: number = 2;
    public output_dir: string = "";
    public format: ImageFormat = "jpeg";
    public resize: boolean = true;
    public resize_width: number = 0;
    public resize_height: number = 0;
    public resize_fit: ResizeFit = "cover";
    public resize_color: string = "";
    
    public auto: boolean = false;

    private el = {
        "source": document.getElementById("source") as HTMLSelectElement,
        "image_size": document.getElementById("image_size") as HTMLSelectElement,
        "image_count": document.getElementById("image_count") as HTMLSelectElement,
        "output_dir": document.getElementById("output_dir") as HTMLInputElement,
        "format": document.getElementById("format") as HTMLSelectElement,
        "resize": document.getElementById("resize") as HTMLInputElement,
        "resize_width": document.getElementById("resize_width") as HTMLInputElement,
        "resize_height": document.getElementById("resize_height") as HTMLInputElement,
        "resize_fit": document.getElementById("resize_fit") as HTMLSelectElement,
        "resize_color": document.getElementById("resize_color") as HTMLButtonElement,
        "auto": document.getElementById("auto") as HTMLInputElement,
        "mask": document.getElementById("settings_mask") as HTMLElement
    };

    constructor() {
        this.el.output_dir.addEventListener("input", this.onInputDirectory.bind(this));
        this.el.resize.addEventListener("change", this.onClickResize.bind(this));
        this.el.resize_width.addEventListener("input", this.onInputResize.bind(this));
        this.el.resize_height.addEventListener("input", this.onInputResize.bind(this));
        this.el.auto.addEventListener("change", this.onClickAutomatic.bind(this));

        const pickr = Pickr.create({
            el: "#resize_color",
            theme: "nano",
            container: "body",
            swatches: [
                "rgba(0, 0, 0, 1)",
                "rgba(255, 255, 255, 1)",
                "rgba(0, 0, 0, 0)"
            ],
            default: "#FFFFFF",
            useAsButton: true,
            components: {
                preview: true,
                opacity: true,
                hue: true,
                interaction: { hex: false, rgba: false, hsla: false, hsva: false, cmyk: false, input: true, clear: false, save: false }
            }
        });

        pickr.on("change", (color: any) => {
            this.resize_color = color.toHEXA().toString();
            this.el.resize_color.style.backgroundColor = this.resize_color;
        });
    }

    /**
     * Unlock settings controls
     * @param value true/false
     */
    public end() {
        this.el.mask.classList.add("hidden");
    }

    /**
     * Validate settings controls
     * @throws Error
     */
    public async start() {
        // Source
        if(this.el.source.value !== "google" && this.el.source.value !== "duckduckgo") {
            throw new Error("Invalid image source");
        }
        this.source = this.el.source.value;

        // Image size
        this.image_size = this.el.image_size.value;

        // Image count
        this.image_count = Number.parseInt(this.el.image_count.value);
        if(Number.isNaN(this.image_count) || this.image_count <= 0 || this.image_count > 10) {
            throw new Error("Invalid max image option");
        }

        // Output directory
        if(!await this.validateOutputDir(this.el.output_dir.value)) {
            throw new Error("Invalid output directory");
        }
        this.output_dir = this.el.output_dir.value;

        // Format
        if(this.el.format.value !== "jpeg" && this.el.format.value !== "png" && this.el.format.value !== "webp" && this.el.format.value !== "gif") {
            throw new Error("Invalid image format");
        }
        this.format = this.el.format.value;

        // Resize
        this.resize = this.el.resize.checked;
        this.resize_width = Number.parseInt(this.el.resize_width.value);
        this.resize_height = Number.parseInt(this.el.resize_height.value);
        if(this.resize && (!Number.isInteger(this.resize_width) || !Number.isInteger(this.resize_height)
            || this.resize_width < 8 || this.resize_width > 2048 || this.resize_height < 8 || this.resize_height > 2048)) {
            throw new Error("Invalid resize size (8-2048)");
        }
        if(this.el.resize_fit.value !== "cover" && this.el.resize_fit.value !== "contain" && this.el.resize_fit.value !== "fill") {
            throw new Error("Invalid resize fit option");
        }
        this.resize_fit = this.el.resize_fit.value;

        // Auto
        this.auto = this.el.auto.checked;

        this.el.mask.classList.remove("hidden");
    }

    /**
     * Validate output path string
     * @param path Output directory path
     * @returns true if directory exists
     */
    private async validateOutputDir(path: string): Promise<boolean> {
        try {
            const res = await fetch("check", {
                "method": "POST",
                "headers": {
                    "Accept": "application/json",
                    "Content-Type": "application/json"
                },
                "body": JSON.stringify({
                    "directory": path
                })
            });
            if(res.status !== 200) {
                throw await res.text();
            }
            const v = await res.json();
            if(typeof v.exists === "boolean") {
                return v.exists;
            } else {
                throw new Error("Unexpected return data");
            }
        } catch(err) {
            console.error("Failed to validate output folder.");
            console.error(err);
        }
        return false;
    }

    /**
     * "Input" eventhandler for output directory
     * @param evt Event
     */
    private async onInputDirectory() {
        if(await this.validateOutputDir(this.el.output_dir.value)) {
            this.el.output_dir.classList.remove("error-bg");
        } else {
            this.el.output_dir.classList.add("error-bg");
        }
    }
    
    /**
     * "Input" eventhandler for resize_width and resize_height
     * @param evt Event
     */
    private onInputResize(evt: Event) {
        const el_input = evt.target as HTMLInputElement;
        const v = Number.parseInt(el_input.value);
        if(Number.isNaN(v) || v < 8 || v > 2048 || el_input.value.match(/^[0-9]+$/g) === null) {
            el_input.classList.add("error-bg");
        } else {
            el_input.classList.remove("error-bg");
        }
    }
    
    /**
     * "click" eventhandler for resize checkbox
     */
    private onClickResize() {
        this.el.resize_width.disabled = !this.el.resize.checked;
        this.el.resize_height.disabled = !this.el.resize.checked;
        this.el.resize_fit.disabled = !this.el.resize.checked;
        this.el.resize_color.disabled = !this.el.resize.checked;
    }
    
    /**
     * "click" event handler for auto checkbox
     */
    private onClickAutomatic() {
        if(this.el.auto.checked) {
            this.el.image_count.selectedIndex = 0;
            this.el.image_count.disabled = true;
        } else {
            this.el.image_count.disabled = false;
        }
    }
}

