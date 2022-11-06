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

import fs from "node:fs/promises"

/**
 * Very simple *.ini options reader
 */
export class IniConfig {
    public port = -1;
    public chrome = "";
    public cachesize = 15;

    /**
     * Read in ini options
     * @param file ini file
     * @throws Error
     */
    public async init(file: string) {
        const buf = await fs.readFile(file);
        const str = buf.toString();
        const lines = str.match(/[^\r\n]+/g);

        if(lines == null) {
            throw new Error("config file \"" + file + "\" is empty");
        }

        const reg_split = /=/;
        for(let i = 0; i < lines.length; i++) {
            const s = lines[i].split(reg_split);
            if(s.length != 2 || s[0].length == 0 || s[1].length == 0) {
                console.log("Invalid line in \"" + file + "\": " + lines[i]);
                continue;
            }
            const key = s[0].trim();
            const value = s[1].trim();
            switch(key) {
                case "port": {
                    this.port = Number.parseInt(value);
                    if(Number.isNaN(this.port) || this.port <= 0 || this.port > 65535) {
                        throw new Error("Invalid port number in \"" + file + "\"");
                    }
                    break;
                }
                case "chromium": {
                    if(value.length < 4) {
                        throw new Error("Invalid chromium path in \"" + file + "\"");
                    }
                    this.chrome = value;
                    break;
                }
                case "cachesize": {
                    this.cachesize = Number.parseInt(value);
                    if(Number.isNaN(this.cachesize) || this.cachesize <= 0 || this.cachesize > 500) {
                        throw new Error("Invalid cachesize number in \"" + file + "\"");
                    }
                    break;
                }
                default: {
                    console.log("Unrecognized key in \"" + file +"\": " + lines[i]);
                }
            }
        }

        if(this.port === -1) {
            throw new Error("Missing key \"port\" in \"" + file + "\"");
        }
        if(this.chrome === "") {
            throw new Error("Missing key \"chromium\" in \"" + file + "\"");
        }
    }
}