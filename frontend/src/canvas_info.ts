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

import { ImageInfo } from "./types.js"

export class CanvasInfo {
    private el = {
        "url": document.getElementById("info_url") as HTMLLinkElement,
        "mime": document.getElementById("info_mime") as HTMLDivElement,
        "size": document.getElementById("info_size") as HTMLDivElement,
        "filesize": document.getElementById("info_filesize") as HTMLDivElement
    }

    public async set(url: string) {
        try {
            const res = await fetch(`image?url=${encodeURIComponent(url)}&info=true`);
            if(res.status !== 200) {
                throw new Error(await res.text());
            }
            const info = await res.json() as ImageInfo;

            this.el.url.href = url;
            this.el.url.innerHTML = url;
            this.el.mime.innerHTML = info.mime;
            this.el.size.innerHTML = `${info.width}x${info.height}`;
            
            if(info.filesize >= 1000) {
                const kb = info.filesize / 1000;
                if(kb >= 1000) {
                    const mb = kb / 1000;
                    this.el.filesize.innerHTML = `${mb.toFixed(2)} MB`;
                }  else {
                    this.el.filesize.innerHTML = `${kb.toFixed()} KB`;
                }
            } else {
                this.el.filesize.innerHTML = `${info.filesize.toFixed()} B`;
            }     

        } catch(err) {
            console.error("Failed to get image info");
        }
    }

    public clear() {
        this.el.url.innerHTML = "";
        this.el.mime.innerHTML = "";
        this.el.size.innerHTML = "";
        this.el.filesize.innerHTML = "";
    }
}