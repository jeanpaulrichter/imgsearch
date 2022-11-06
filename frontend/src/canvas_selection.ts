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

import { Point, Rect } from "./types.js"

/**
 * Manages div overlay over canvas as crop area selection
 */
export class CanvasSelection {

    private el_canvas: HTMLCanvasElement;
    private el_selection: HTMLElement;
    private visible: boolean;
    private rect: Rect;
    private startpos: Point;
    private endpos: Point;
    private el = {
        "btnClearCrop": document.getElementById("btnClearCrop") as HTMLButtonElement
    }

    constructor(container: HTMLDivElement) {
        this.el_canvas = container.firstElementChild as HTMLCanvasElement;
        this.el_selection = container.lastElementChild as HTMLElement;
        this.el_selection.style.display = "none";
        this.visible = false;
        this.rect = new Rect();
        this.startpos = new Point();
        this.endpos = new Point();
        this.el.btnClearCrop.addEventListener("click", this.onClickBtnClear.bind(this));
    }

    public start(startpos: Point): void {
        this.startpos.x = startpos.x;
        this.startpos.y = startpos.y;
    }

    public update(endpos: Point): void {
        this.endpos.x = endpos.x;
        this.endpos.y = endpos.y;

        if(this.startpos.x < this.endpos.x) {
            this.rect.x = this.startpos.x;
            this.rect.width = this.endpos.x - this.startpos.x;
        } else {
            this.rect.x = this.endpos.x;
            this.rect.width = this.startpos.x - this.endpos.x;
        }
        if(this.startpos.y < this.endpos.y) {
            this.rect.y = this.startpos.y;
            this.rect.height = this.endpos.y - this.startpos.y;
        } else {
            this.rect.y = this.endpos.y;
            this.rect.height = this.startpos.y - this.endpos.y;
        }

        if(this.rect.width > 0 && this.rect.height > 0) {
            this.visible = true;
            this.el_selection.style.left = this.rect.x.toFixed() + "px";
            this.el_selection.style.top = this.rect.y.toFixed() + "px";
            this.el_selection.style.width = this.rect.width.toFixed() + "px";
            this.el_selection.style.height = this.rect.height.toFixed() + "px";
            this.el_selection.style.display = "block";
        } else {
            this.visible = false;
            this.el_selection.style.display = "none";
        }
        this.el.btnClearCrop.disabled = !this.visible;
    }

    public getScaledRect(): Rect | undefined {
        if(this.visible) {
            const sx = this.el_canvas.width / this.el_canvas.clientWidth;
            const sy = this.el_canvas.height / this.el_canvas.clientHeight;
            return {
                "x": Math.round(this.rect.x * sx),
                "y": Math.round(this.rect.y * sy),
                "width": Math.round(this.rect.width * sx),
                "height": Math.round(this.rect.height * sy)
            }
        } else {
            return undefined;
        }
    }

    public isVisible(): boolean {
        return this.visible;
    }

    public clear(): void {
        this.visible = false;
        this.el_selection.style.display = "none";
        this.el.btnClearCrop.disabled = true;
    }

    private onClickBtnClear() {
        this.clear();
    }
}
