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

class Panel {
    constructor(id: string) {
        this.element = document.getElementById(id) as HTMLElement;
        this.size = 0;
        this.grow = 0;
    }

    public element: HTMLElement;
    public size: number;
    public grow: number;
};

enum Direction {
    horizontal,
    vertical
};

class Splitter {
    private dir: Direction;
    private size: number;
    private grow: number;
    private panel1: Panel;
    private panel2: Panel;
    private pos: number;

    constructor(dir: Direction, panel1: string, panel2: string) {
        this.dir = dir;
        this.size = 0;
        this.grow = 0;
        this.pos = 0;
        this.panel1 = new Panel(panel1);
        this.panel2 = new Panel(panel2);
    }

    public getDirection(): Direction {
        return this.dir;
    }

    public start(x: number, y: number): Splitter {
        this.panel1.grow = Number(getComputedStyle(this.panel1.element).flexGrow);
        this.panel2.grow = Number(getComputedStyle(this.panel2.element).flexGrow);
        this.grow = this.panel1.grow + this.panel2.grow;

        if(this.dir === Direction.horizontal) {
            this.panel1.size = this.panel1.element.offsetWidth;
            this.panel2.size = this.panel2.element.offsetWidth;
            this.pos = x;
        } else {
            this.panel1.size = this.panel1.element.offsetHeight;
            this.panel2.size = this.panel2.element.offsetHeight;
            this.pos = y;
        }
        this.size = this.panel1.size + this.panel2.size;
        return this;
    }

    public update(x: number, y: number): void {
        let pos = this.dir === Direction.horizontal ? x : y;
        const d = pos - this.pos;

        this.panel1.size += d;
        this.panel2.size -= d;
        if (this.panel1.size < 0) {
            this.panel1.size = 0;
            this.panel2.size = this.size;
        }
        if (this.panel2.size < 0) {
            this.panel2.size = 0;
            this.panel1.size = this.size;
        }

        this.panel1.element.style.flexGrow = (this.grow * (this.panel1.size / this.size)).toString();
        this.panel2.element.style.flexGrow = (this.grow * (this.panel2.size / this.size)).toString();

        this.pos = pos;
    }
};

export class Resizer {

    private splitter: Map<HTMLElement, Splitter>;
    private current: Splitter | null;
    private html: HTMLElement;

    constructor() {
        this.splitter = new Map<HTMLElement, Splitter>();
        this.current = null;
        this.html = document.querySelector("html") as HTMLElement;

        document.body.addEventListener("mousedown", this.onMouseDown.bind(this));
        window.addEventListener("mousemove", this.onMouseMove.bind(this));
        window.addEventListener("mouseup", this.onMouseUp.bind(this));
    }

    public addHorizontal(splitter: string, panel1: string, panel2: string) {
        this.splitter.set(document.getElementById(splitter)!, new Splitter(Direction.horizontal, panel1, panel2));
    }

    public addVertical(splitter: string, panel1: string, panel2: string) {
        this.splitter.set(document.getElementById(splitter)!, new Splitter(Direction.vertical, panel1, panel2));
    }

    private onMouseDown(evt: MouseEvent) {
        const splitter = this.splitter.get(evt.target as HTMLElement);
        if(!splitter) {
            return;
        }
        evt.preventDefault();
        if(splitter.getDirection() === Direction.horizontal) {
            this.html.style.cursor = "ew-resize";
        } else {
            this.html.style.cursor = "ns-resize";
        }
        this.current = splitter.start(evt.pageX, evt.pageY);
    }

    private onMouseMove(evt: MouseEvent) {
        if(this.current !== null) {
            this.current.update(evt.pageX, evt.pageY);
        }
    }

    private onMouseUp() {
        if(this.current) {
            this.html.style.cursor = "";
            this.current = null;
        }        
    }
}