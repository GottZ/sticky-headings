import {
	//App,
	Plugin,
	//Notice,
} from "obsidian";

// ToDo:
// [o] add pane to the top of the reading space
//     [o] reading mode
//     [ ] writing mode
//     [ ] source mode
// [x] figure out how to get headings of the current leave
// [ ] filter headings by level for a strict hierarchy
// [ ] display flattened headings
//     [ ] on load
//     [ ] on scroll
//     [ ] on file change
// [o] reading mode
// [ ] writing mode
// [ ] source mode

export default class StickyHeadingsPlugin extends Plugin {
	async onload() {
		const {
			app: {
				workspace: ws,
			},
		} = this;

		await new Promise(resolve => ws.onLayoutReady(() => resolve(true)));

		// iterate through all visible markdown views
		for (const leave of ws.getLeavesOfType("markdown")) {
			// headings:
			//   app.metadataCache.getFileCache(leave.view.file).headings
			// current line (floating point number to reflect in-between line scroll pos)
			//   leave.view.getEphemeralState().scroll
			//   leave.view.previewMode.getScroll()
			// actual dom node that scrolls:
			//   leaf.view.previewMode.containerEl.firstChild
			console.log(leave);

			// ToDo: register listener to unload this leave
		}

		// ToDo: register listener to load new leaves
	}

	onunload() {
		// ToDo: unload listeners and reverse DOM changes
	}
}
