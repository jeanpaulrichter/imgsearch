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

import { SearchResult, Point, Rect } from "./types.js";
import { CanvasSelection } from "./canvas_selection.js";
import { CanvasInfo } from "./canvas_info.js";

/**
 * Manages canvas to display image
 */
export class ImageCanvas {
    private image: HTMLImageElement;
    private url: string;
    private ctx: CanvasRenderingContext2D;
    private image_info: CanvasInfo;
    private selection: CanvasSelection;
    private resize_observer: ResizeObserver;
    private canvas_rect: DOMRect;
    private parent_rect: DOMRect;
    private mouseDown: boolean;
    private visible: boolean;
    private try_to_load: boolean;
    private el = {
        "parent": document.getElementById("panel_canvas") as HTMLElement,
        "container": document.getElementById("canvas") as HTMLDivElement,
        "canvas": document.querySelector("#canvas canvas") as HTMLCanvasElement
    };

    constructor() {
        this.url = "";
        this.visible = false;
        this.mouseDown = false;
        this.try_to_load = false;
        this.el.container.style.display = "none";
        this.image_info = new CanvasInfo();
        this.selection = new CanvasSelection(this.el.container);
        this.ctx = this.el.canvas.getContext("2d") as CanvasRenderingContext2D;
        this.image = new Image();
        this.image.crossOrigin="anonymous";
        this.image.addEventListener("load", this.onImageLoad.bind(this));
        this.image.addEventListener("error", this.onImageError.bind(this));
        this.resize_observer = new ResizeObserver(this.onResize.bind(this));
        this.resize_observer.observe(this.el.container.parentElement as HTMLElement);
        this.canvas_rect = new DOMRect();
        this.parent_rect = new DOMRect();
        window.addEventListener("mousedown", this.onMouseDown.bind(this));
        window.addEventListener("mousemove", this.onMouseMove.bind(this));
        window.addEventListener("mouseup", this.onMouseUp.bind(this));
    }

    public setImage(image: SearchResult) {
        this.el.canvas.width = image.width;
        this.el.canvas.height = image.height;
        this.try_to_load = true;
        this.url = image.url;
        this.image.src = "image?url=" + encodeURIComponent(image.url);
    }

    public getCropSelection(): Rect | undefined {
        if(this.visible) {
            return this.selection.getScaledRect();
        } else {
            return undefined
        }
    }

    public clear() {
        this.selection.clear();
        this.el.container.style.display = "none";
        this.el.parent.classList.remove("canvas--loaded");
        this.image.src = "";
        this.visible = false;
        this.image_info.clear();
        this.url = "";
    }

    private getPosition(clientX: number, clientY: number): Point {
        const pos = {
            "x": clientX - this.canvas_rect.left,
            "y": clientY - this.canvas_rect.top
        };
        return pos;
    }

    private scale() {
        this.parent_rect = this.el.parent.getBoundingClientRect();

        const scale = Math.min(this.parent_rect.width / this.el.canvas.width, this.parent_rect.height / this.el.canvas.height);

        const width = this.el.canvas.width * scale;
        const height = this.el.canvas.height * scale;

        const top = (this.parent_rect.height - height) / 2;
        const left = (this.parent_rect.width - width) / 2;

        this.el.container.style.width = width.toFixed(2) + "px";
        this.el.container.style.height = height.toFixed(2) + "px";
        this.el.container.style.top = top.toFixed(2) + "px";
        this.el.container.style.left = left.toFixed(2) + "px";

        this.canvas_rect = this.el.canvas.getBoundingClientRect();
    }

    private onImageLoad() {
        this.try_to_load = false;
        this.selection.clear();
        this.el.container.style.display = "";
        this.scale();        
        this.ctx.drawImage(this.image, 0, 0);
        this.visible = true;
        this.mouseDown = false;
        this.el.parent.classList.add("canvas--loaded");
        this.image_info.set(this.url);
    }

    private onImageError() {
        if(this.try_to_load) {
            this.el.canvas.width = 250;
            this.el.canvas.height = 250;
            this.image.src = "/images/notfound.png";
            this.try_to_load = false;
        }
    }

    private onMouseDown(event: MouseEvent) {
        if(this.visible && event.clientX >= this.parent_rect.left && event.clientX <= this.parent_rect.right
            && event.clientY >= this.parent_rect.top && event.clientY <= this.parent_rect.bottom) {
            event.preventDefault();
            this.mouseDown = true;
            this.selection.start(this.getPosition(event.clientX, event.clientY));
        }
    }

    private onMouseUp(event: MouseEvent) {
        if(this.mouseDown) {
            this.selection.update(this.getPosition(event.clientX, event.clientY));
            this.mouseDown = false;
        }        
    }

    private onMouseMove(event: MouseEvent) {
        if(this.mouseDown) {
            this.selection.update(this.getPosition(event.clientX, event.clientY));
        }
    }

    private onResize() {
        this.selection.clear();
        this.scale();
    }
}