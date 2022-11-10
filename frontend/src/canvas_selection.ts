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

    private visible: boolean;
    private rect: Rect;
    private startpos: Point;
    private endpos: Point;
    private shift: boolean;
    private el: {
        "btnClearCrop": HTMLButtonElement,
        "canvas": HTMLCanvasElement,
        "selection": HTMLDivElement
    };

    constructor(container: HTMLDivElement) {
        this.el = {
            "btnClearCrop": document.getElementById("btnClearCrop") as HTMLButtonElement,
            "canvas": container.firstElementChild as HTMLCanvasElement,
            "selection": container.lastElementChild as HTMLDivElement
        }
        this.el.selection.style.display = "none";
        this.visible = false;
        this.rect = new Rect();
        this.startpos = new Point(); 
        this.endpos = new Point();
        this.shift = false;
        this.el.btnClearCrop.addEventListener("click", this.onClickBtnClear.bind(this));
        window.addEventListener("keydown", this.onKeyDown.bind(this));
        window.addEventListener("keyup", this.onKeyUp.bind(this));
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

        if(this.shift) {
            let size = 9999999;
            let tsize;
            if(this.rect.x + this.rect.width > this.el.canvas.clientWidth) {
                tsize = this.el.canvas.clientWidth - this.rect.x;
                if(tsize < size) {
                    size = tsize;
                }
            }
            if(this.rect.y + this.rect.height > this.el.canvas.clientHeight) {
                tsize = this.el.canvas.clientHeight - this.rect.y;
                if(tsize < size) {
                    size = tsize;
                }
            }
            if(this.rect.x < 0) {
                tsize = this.rect.width + this.rect.x;
                if(tsize < size) {
                    size = tsize;
                }
            }
            if(this.rect.y < 0) {
                tsize = this.rect.height + this.rect.y;
                if(tsize < size) {
                    size = tsize;
                }
            }
            if(this.rect.width < size) {
                size = this.rect.width;
            }
            if(this.rect.height < size) {
                size = this.rect.height;
            }

            if(this.startpos.x > this.endpos.x) {
                this.rect.x += (this.rect.width - size);
            }
            this.rect.width = size;

            if(this.startpos.y > this.endpos.y) {
                this.rect.y = this.startpos.y - size;
            }
            this.rect.height = size;
        } else {
            if(this.rect.x < 0) {
                this.rect.width += this.rect.x;
                this.rect.x = 0;                
            }
            if(this.rect.x + this.rect.width > this.el.canvas.clientWidth) {
                this.rect.width = this.el.canvas.clientWidth - this.rect.x;
            }
            if(this.rect.y < 0) {
                this.rect.height += this.rect.y;
                this.rect.y = 0;                
            }
            if(this.rect.y + this.rect.height > this.el.canvas.clientHeight) {
                this.rect.height = this.el.canvas.clientHeight - this.rect.y;
            }
        }

        if(this.rect.width > 0 && this.rect.height > 0) {
            this.visible = true;
            this.el.selection.style.left = this.rect.x.toFixed() + "px";
            this.el.selection.style.top = this.rect.y.toFixed() + "px";
            this.el.selection.style.width = this.rect.width.toFixed() + "px";
            this.el.selection.style.height = this.rect.height.toFixed() + "px";
            this.el.selection.style.display = "block";
        } else {
            this.visible = false;
            this.el.selection.style.display = "none";
        }
        this.el.btnClearCrop.disabled = !this.visible;
    }

    public getScaledRect(): Rect | undefined {
        if(this.visible) {
            const sx = this.el.canvas.width / this.el.canvas.clientWidth;
            const sy = this.el.canvas.height / this.el.canvas.clientHeight;
            const rect = {
                "x": Math.round(this.rect.x * sx),
                "y": Math.round(this.rect.y * sy),
                "width": Math.round(this.rect.width * sx),
                "height": Math.round(this.rect.height * sy)
            }
            // just in case: make sure rect is valid
            if(rect.x < 0) {
                rect.x = 0;
            } else if(rect.x >= this.el.canvas.width) {
                rect.x = this.el.canvas.width - 1;
            }
            if(rect.y < 0) {
                rect.y = 0;
            } else if(rect.y >= this.el.canvas.height) {
                rect.y = this.el.canvas.height - 1;
            }
            if(rect.x + rect.width > this.el.canvas.width) {
                rect.width = this.el.canvas.width - rect.x;
            }
            if(rect.y + rect.height > this.el.canvas.height) {
                rect.height = this.el.canvas.height - rect.y;
            }
            return rect;
        } else {
            return undefined;
        }
    }

    public isVisible(): boolean {
        return this.visible;
    }

    public clear(): void {
        this.visible = false;
        this.el.selection.style.display = "none";
        this.el.btnClearCrop.disabled = true;
    }

    private onClickBtnClear() {
        this.clear();
    }

    private onKeyDown(evt: KeyboardEvent) {
        this.shift = evt.shiftKey;
    }

    private onKeyUp(evt: KeyboardEvent) {
        this.shift = evt.shiftKey;
    }
}
