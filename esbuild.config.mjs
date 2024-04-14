import esbuild from "esbuild";
import process from "process";
import builtins from "builtin-modules";
//? in case this plugin needs to ship images, keep:
//? https://www.npmjs.com/package/esbuild-plugin-inline-image in mind.

import { fsJSON, devHooksProxy } from "./helpers.mjs";

// tsconfig is used to determine the target javascript version of the compiled code
const tsconfig = await fsJSON("tsconfig.json");
// manifest is used to generate the header of the compiled code
const manifest = await fsJSON("manifest.json");

// generate header for the compiled source code
const banner = (()=>{
	// prepare the header content
	const lines = [
		`Welcome to the compiled source code of „${manifest.name}”!`,
		`This compiled version is based on v${manifest.version} of the following repository:`,
		`${manifest.helpUrl}`,
		"", // empty line between footer and content
	];

	// determine the width of the header (minus borders)
	let width = 0;
	for(let line of lines) {
		width = Math.max(width, line.length);
	}

	// provide a right-aligned footer
	const footer = `made with love by ${manifest.author}`;
	lines.push(`${" ".repeat(width - footer.length)}${footer}`);

	// add borders
	for(let i = 0; i < lines.length; i++) {
		const line = lines[i];
		lines[i] = `| ${line}${" ".repeat(width - line.length)} |`;
	}

	// add top and bottom borders
	lines.unshift(`/*${"*".repeat(width)}*\\`);
	lines.push(`\\*${"*".repeat(width)}*/`);

	// return the header as a string
	return lines.join("\n");
})();

const prod = (process.argv[2] === "production");
console.info(`! Building in ${prod ? "production" : "development"} mode.`);

const devHooks = await devHooksProxy({
	path: "./.devhooks.mjs",
	logs: true,
});

const config = {
	banner: {
		js: banner,
	},
	entryPoints: ["main.ts"],
	bundle: true,
	external: [
		"obsidian",
		"electron",
		"@codemirror/autocomplete",
		"@codemirror/collab",
		"@codemirror/commands",
		"@codemirror/language",
		"@codemirror/lint",
		"@codemirror/search",
		"@codemirror/state",
		"@codemirror/view",
		"@lezer/common",
		"@lezer/highlight",
		"@lezer/lr",
		...builtins],
	format: "cjs",
	target: tsconfig.compilerOptions.target,
	logLevel: "info",
	sourcemap: prod ? false : "inline",
	treeShaking: true,
	outfile: "main.js",
	minify: !!prod,
};

await devHooks.esConfig({
	config,
	prod,
});

const ctx = await esbuild.context(config);

await devHooks.esPreBuild({
	ctx,
	prod,
});

const buildResult = await (async () => {
	if (devHooks.has("esBuild")) {
		return await devHooks.esBuild({
			ctx,
			prod,
		});
	}

	return await ctx[prod ? "rebuild" : "watch"]();
})();

await devHooks.esPostBuild({
	ctx,
	result: buildResult,
	prod,
});
