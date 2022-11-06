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

/**
 * Very simple GUI logger
 */
export class Logger {
    private container: HTMLElement;

    constructor() {
        this.container = document.getElementById("panel_log") as HTMLElement;
    }

    public msg(s: string) {
        this.container.appendChild(this.getDiv(s));
        this.container.scrollTop = this.container.scrollHeight;
    }
    
    public error(s: string) {
        this.container.appendChild(this.getDiv(s, "error"));
        this.container.scrollTop = this.container.scrollHeight;
    }
    
    public warning(s: string) {
        this.container.appendChild(this.getDiv(s, "warning"));
        this.container.scrollTop = this.container.scrollHeight;
    }

    public clear() {
        this.container.innerHTML = "";
    }

    private getDiv(str: string, classname = "") {
        
        const el_div = document.createElement("div");
        const el_date = document.createElement("span");
        el_date.innerHTML = this.getTimeString();
        el_date.className = "log-time";
        const el_msg = document.createElement("span");
        el_msg.innerHTML = str;
        el_msg.className = "log-msg " + classname;
        el_div.appendChild(el_date);
        el_div.appendChild(el_msg);
        return el_div;
    }

    private getTimeString() {
        // there is probably a more elegant way to do this...
        const d = new Date();
        let t = d.getMonth() + 1;
        const s_month = (t < 10) ? "0" + t : t.toString();
        t = d.getDate();
        const s_day = (t < 10) ? "0" + t : t.toString();
        t = d.getHours();
        const s_hour = (t < 10) ? "0" + t : t.toString();
        t = d.getMinutes();
        const s_min = (t < 10) ? "0" + t : t.toString();
        t = d.getSeconds();
        const s_sec = (t < 10) ? "0" + t : t.toString();
        return `${d.getFullYear()}/${s_month}/${s_day} ${s_hour}:${s_min}:${s_sec}`;
    }
}