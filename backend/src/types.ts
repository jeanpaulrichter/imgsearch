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

export type Image = {
    mime: string,
    data: Buffer,
    width: number,
    height: number
};

export type SearchResult = {
    url: string,
    thumb_url: string,
    width: number,
    height: number
};

export type ImageTransform = {
    resize_width?: number,
    resize_height?: number,
    resize_fit?: "cover" | "contain" | "fill",
    resize_color?: string,
    crop_left?: number,
    crop_top?: number,
    crop_width?: number,
    crop_height?: number,
    mime?: string
};

export type ImageSource = "google" | "duckduckgo";

export enum ImageSourceSize {
    all,
    large,
    medium,
    small
}

export interface ImageProvider {
    init(): Promise<void>;
    release(): Promise<void>;
    search(term: string, size: ImageSourceSize, max: number): Promise<SearchResult[]>;
}

export type FBGetImageURL = (url:string)=>Promise<string|undefined>;