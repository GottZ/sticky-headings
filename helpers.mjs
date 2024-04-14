/**
 * Utility functions for filesystem operations and development hooks.
 *
 * @module helpers
 * @see module:helpers.fsExists
 * @see module:helpers.fsJSON
 * @see module:helpers.devHooksProxy
 *
 * @license
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2024 Jan-Stefan Janetzky <github@gottz.de>
 * Source Repository at https://github.com/GottZ/sticky-headings
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import fs from "node:fs/promises";

/**
 * Check if a file or directory exists.
 *
 * ! nodejs deprecated fs.exists, so we need to use fs.access instead
 * since fs.access doesn't have a binary promise API, we need to wrap it in a another promise...
 *
 * @param {string} path - The path to the file or directory.
 * @returns {Promise<boolean>} A promise that resolves to `true` if the file or directory exists, and `false` otherwise.
 */
export function fsExists (path) {
	return new Promise(resolve => {
	fs.access(path, fs.constants.F_OK)
	.then(() => resolve(true))
	.catch(() => resolve(false));
})}

/**
 * Read a JSON file from the filesystem.
 *
 * ! not gonna import directly from json as long as this api is experimental:
 * https://nodejs.org/api/esm.html#esm_json_modules
 * (node:25440) ExperimentalWarning: Importing JSON modules is an experimental feature and might change at any time
 * import something from "./something.json" with { type: "json" };
 *
 * @param {string} path - The path to the JSON file.
 * @returns {Promise<object>} The parsed JSON object.
 */
export async function fsJSON (path) {
	return JSON.parse(await fs.readFile(path, "utf-8"));
}

/**
 * Load a dynamic module from path with development hooks if present in filesystem.
 *
 * @param {object} options - The options object.
 * @param {string} options.path - The path to the module with development hooks.
 * @param {boolean} [options.logs=true] - Whether to log the usage of development hooks.
 * @returns {Promise<object>} The module with development hooks.
 */
export async function devHooksProxy (options) {
	const { path, logs = true } = options;
	const hasDevHooks = await fsExists(path);
	const module = hasDevHooks ? await import(path) : {};

	if (hasDevHooks) {
		if (logs) console.warn("! Using devHooks");
	} else {
		if (logs) console.info("! Skipping devHooks");
	}

	// eslint-disable-next-line no-undef
	const proxy = new Proxy(module, {
		get(target, prop) {
			if (prop === "has") {
				return prop => prop in module;
			}
			// stop recursive "await" resolution
			if (prop === "then") {
				return undefined;
			}
			if (prop in target && typeof target[prop] === "function") {
				if (logs) console.warn(`! Using devHook: „${prop}”`);
				return target[prop];
			} else {
				if (hasDevHooks) {
					if (logs) console.info(`! Skipping devHook: „${prop}”`);
				}
				return ()=>{};
			}
		},
	});
	return proxy;
}
