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
 * Error thrown on bad user input
*/
export class InputError extends Error {
    constructor(...params: unknown[]) {
        if(params.length > 0 && typeof params[0] === "string") {
            super(params[0]);
        } else {
            super();
        }
        
        if(Error.captureStackTrace !== undefined) {
            Error.captureStackTrace(this, InputError)
        }
  
        this.name = "InputError"
    }
}

/**
 * Error thrown on resource not found
*/
export class NotFoundError extends Error {
    constructor() {
        super();
        
        if(Error.captureStackTrace !== undefined) {
            Error.captureStackTrace(this, NotFoundError)
        }
  
        this.name = "NotFoundError"
    }
}

/**
 * Exception thrown on missing authentication
*/
export class AuthError extends Error {
    constructor(...params : unknown[]) {
        if(params.length > 0 && typeof params[0] === "string") {
            super(params[0]);
        } else {
            super();
        }
  
        if(Error.captureStackTrace !== undefined) {
            Error.captureStackTrace(this, AuthError)
        }
  
        this.name = "AuthError"
    }
}

/**
 * Exception thrown after error was logged
*/
export class LoggedError extends Error {
    constructor() {
        super()
  
        if(Error.captureStackTrace !== undefined) {
            Error.captureStackTrace(this, LoggedError)
        }
  
        this.name = "LoggedError"
    }
}