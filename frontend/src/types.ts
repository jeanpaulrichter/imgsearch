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
 * Result of image search
 */
export type SearchResult = {
    url: string,
    thumb_url: string,
    width: number,
    height: number
};

export type ImageInfo = {
    width: number,
    height: number,
    mime: string,
    filesize: number;
};

export type ImageSource = "google" | "duckduckgo";

export type ResizeFit = "cover" | "contain" | "fill";

export type ImageFormat = "jpeg" | "png" | "webp" | "gif";

export class Point {
    constructor(x?: number, y?: number) {
        this.x = x ? x : 0;
        this.y = y ? y : 0;
    }

    public x: number;
    public y: number;
}

export class Rect {
    constructor(x?: number, y?: number, width?: number, height?: number) {
        this.x = x ? x : 0;
        this.y = y ? y : 0;
        this.width = width ? width : 0;
        this.height = height ? height : 0;
    }

    public x: number;
    public y: number;
    public width: number;
    public height: number;
};