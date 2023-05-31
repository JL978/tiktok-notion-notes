
chrome.runtime.onInstalled.addListener(() => {
	chrome.storage.sync.set({ widgetEnabled: false });
});

// const API_URL = "http://tt-notion.fly.dev"
const API_URL = "http://localhost:8080"

const isCorrectTikTokURL = (url) => {
	const urlRegex = /https:\/\/www.tiktok.com\/@(.*)\/video\/(.*)/;
	const test = urlRegex.test(url);

	return test;
}

const getVidInfo = (url) => {
	if (!isCorrectTikTokURL(url)) return null;

	const channel = url.match(/@(.*)\/video/)[1];
	const videoId = url.split("/").pop();
	
	return { channel, videoId };
}

const createWidgetWithEmptyData = () => {
	let container = document.querySelector(".WidgetContainer");

	if (!container) {
		container = document.createElement("div");
		container.id = "tiktok-notion"
		container.classList.add("WidgetContainer");

		document.body.appendChild(container);
	} 
		
	container.innerHTML = "";
	const createButton = document.createElement("button");
	createButton.innerHTML = "Create New Notes";
	createButton.classList.add("TTNotionButton");

	const listener = () => {
		createButton.disabled = true;
		createButton.innerHTML = "Creating...";

		// send to background script
		chrome.runtime.sendMessage({ type: "createPage" }, () => {
			createButton.removeEventListener("click", listener);
		})
	}

	createButton.addEventListener("click", listener);

	container.appendChild(createButton);
}


// This is injected into the page so it won't have access to any global variables in this file
// TODO: move this to a separate file
const createWidget = (tags, videoData, API_URL) => {
	const TEXT_COLORS = {
		default: "#32302c",
		gray: "#32302c",
		brown: "#442a1e",
		orange: "#49290e",
		yellow: "#402c1b",
		green: "#1c3829",
		blue: "#183347",
		purple: "#412454",
		pink: "#4c2337",
		red: "#5d1715",
	}

	const TAG_COLORS = {
		default: "rgba(227, 226, 224, 0.5)",
		gray: "rgb(227, 226, 224)",
		brown: "rgb(238, 224, 218)",
		orange: "rgb(250, 222, 201)",
		yellow: "rgb(253, 236, 200)",
		green: "rgb(219, 237, 219)",
		blue: "rgb(211, 229, 239)",
		purple: "rgb(232, 222, 238)",
		pink: "rgb(245, 224, 233)",
		red: "rgb(255, 226, 221)",
	}

	let container = document.querySelector(".WidgetContainer");

	if (!container) {
		container = document.createElement("div");
		container.id = "tiktok-notion"
		container.classList.add("WidgetContainer");
		document.body.appendChild(container)
	} else {
		container.innerHTML = "";
	}

	const notesTitle = document.createElement("h1");
	notesTitle.innerHTML = "Notes";

	const notesField = document.createElement("textarea");
	notesField.id = "tiktok-notes";
	notesField.classList.add("NotesField");
	notesField.placeholder = "Thoughts on the video";

	const notes = videoData?.results[0]?.properties?.Notes?.rich_text[0]?.plain_text || "";
	if (notes) {
		notes.replace(/\n/g, "<br>");
		notesField.value = notes;
	}

	notesField.addEventListener("input", (e) => {
		const notesContent = e.target.value;

		console.log(notesContent, notes)

		if (notesContent !== notes) {
			button.disabled = false;
		} else {
			button.disabled = true;
		}
	})


	const tagsTitle = document.createElement("h1");
	tagsTitle.innerHTML = "Tags";

	// multi select tags
	const tagsContainer = document.createElement("div");
	tagsContainer.classList.add("TagsContainer");

	const selectedTags = videoData?.results[0]?.properties?.Tags?.multi_select;
	tags.forEach(tag => {
		const tagContainer = document.createElement("label");
		tagContainer.style.border = `1px solid ${TEXT_COLORS[tag.color]}`;
		tagContainer.style.color = TEXT_COLORS[tag.color];
		
		tagContainer.innerHTML = tag.name

		const tagCheckbox = document.createElement("input");
		tagCheckbox.type = "checkbox";

		const isSelected = selectedTags?.find(selectedTag => selectedTag.id === tag.id);

		if (isSelected) {
			tagCheckbox.checked = true;
			tagContainer.style.backgroundColor = TAG_COLORS[tag.color];
		}

		tagCheckbox.addEventListener("change", () => {
			if (tagCheckbox.checked) {
				tagContainer.style.backgroundColor = TAG_COLORS[tag.color];
			} else {
				tagContainer.style.backgroundColor = "transparent";
			}

			const tags = Array.from(tagsContainer.children).filter(child => child.children[0]?.checked);

			const tagIds = new Set(tags.map(tag => tag.children[0].id))
			const selectedTagsIds = new Set(selectedTags?.map(tag => tag.id) || [])
			
			//compare contents of tagIds and selectedTagsIds
			if (tagIds.size === selectedTagsIds.size && Array.from(tagIds).every(tagId => selectedTagsIds.has(tagId))) {
				button.disabled = true;
			} else {
				button.disabled = false;
			}
		})

		tagContainer.appendChild(tagCheckbox);
		tagsContainer.appendChild(tagContainer);
	});

	const button = document.createElement("button");
	button.innerHTML = "Update";
	button.disabled = true;
	button.classList.add("TTNotionButton");


	button.addEventListener("click", async () => {
		// get selected tags name
		const tags = Array.from(tagsContainer.children)
			.filter(child => child.children[0]?.checked)
			.map(child => ({
				name: child.childNodes[0]?.nodeValue
		}));
		
		const notes = notesField.value;

		// convert notes back to plain text
		notes.replace(/<br>/g, "\n");
		
		const data = {
			tags,
			notes,
			pageId: videoData.results[0]?.id,
		}

		button.innerHTML = "Updating...";
		button.disabled = true;

		const res = await fetch(API_URL + "/updateDb", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(data),
		});

		const updatedVideoData = await res.json();

		if (!updatedVideoData.error) {
			button.innerHTML = "Update";
		} 
		console.log(updatedVideoData);
	})

	container.appendChild(tagsTitle);
	container.appendChild(tagsContainer);
	container.appendChild(notesTitle);
	container.appendChild(notesField);
	container.appendChild(button);

}

const getDb = async () => {
	const res = await fetch(API_URL + "/db");
	const data = await res.json();
	return data;
}

const getVideoData = async (url) => {
	const res = await fetch(API_URL + "/queryDb" + `?url=${url}`)
	const data = await res.json();
	return data;
}

const removeWidget = (tab) => {
	chrome.scripting.executeScript({
		target: { tabId: tab.id },
		function: () => {
			const oldWidget = document.getElementById("tiktok-notion");
			if (oldWidget) {
				oldWidget.remove();
			}
		},
	});
}

const handleWidget = async (widgetEnabled, tab) => {
	chrome.scripting.insertCSS({
		target: { tabId: tab.id },
		files: ["./widget.css"],
	})

	if (widgetEnabled) {
		const url = tab.url;
		if (!url?.includes("tiktok")) return;

		try {
			chrome.scripting.executeScript({
				target: { tabId: tab.id },
				function: () => {
					const oldWidget = document.getElementById("tiktok-notion");
					if (oldWidget) {
						oldWidget.innerHTML = "Loading...";
					}
				}
			})

			const db = await getDb();

			const tags = db.properties.Tags.multi_select.options
			const videoData = await getVideoData(url);

			const urlDoesNotExist = videoData.results.length === 0;

			// add items on screen
			chrome.scripting.executeScript({
				target: { tabId: tab.id },
				function: urlDoesNotExist ? createWidgetWithEmptyData : createWidget,
				args: [tags, videoData, API_URL]
			});
			// check if video is already in database
		} catch (err) {
			console.log(err);
		}
	} else {
		removeWidget(tab);
	}
}

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
	if (request.type === "createPage") {
		const res = await fetch(API_URL + "/addToDb", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				url: sender.tab.url,
			}),
		})
		const data = await res.json();
		sendResponse(data);
		handleWidget(true, sender.tab)
	}
});

chrome.action.onClicked.addListener(function (tab) {
	chrome.storage.sync.get("widgetEnabled", async (data) => {
		const widgetEnabled = !data.widgetEnabled;
		chrome.storage.sync.set({ widgetEnabled });

		handleWidget(widgetEnabled, tab);
	})
});

const tabUpdateHandler = (tab, newTab) => {
	if (!isCorrectTikTokURL(tab.url)) return;

	chrome.storage.sync.get("widgetEnabled", async (data) => {
		const widgetEnabled = data.widgetEnabled;
		if (newTab && widgetEnabled) return;
		handleWidget(widgetEnabled, tab);
	});
}

// when url in current tab changes
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
	if (changeInfo.status !== "complete") return;

	tabUpdateHandler(tab, false);
});

// when new tab is selected
chrome.tabs.onActivated.addListener((activeInfo) => {
	chrome.tabs.get(activeInfo.tabId, (tab) => {
		tabUpdateHandler(tab, true);
	});
});
