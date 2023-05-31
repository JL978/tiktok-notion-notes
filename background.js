
chrome.runtime.onInstalled.addListener(() => {
	chrome.storage.sync.set({ widgetEnabled: false });
});

// const API_URL = "http://tt-notion.fly.dev"
const API_URL = "http://localhost:8080"

const verifyUrl = (url) => {
	const urlRegex = /https:\/\/www.tiktok.com\/@(.*)\/video\/(.*)/;
	const test = url.match(urlRegex);
	if (!test) {
		throw new Error("Invalid TikTok URL");
	}
}

const getVidInfo = (url) => {
	verifyUrl(url);

	const channel = url.match(/@(.*)\/video/)[1];
	const videoId = url.split("/").pop();
	
	return { channel, videoId };
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

	const container = document.createElement("div");
	container.id = "tiktok-notion";

	container.style.position = "fixed";
	container.style.top = "10px";
	container.style.left = "10px";
	container.style.zIndex = 1000;
	container.style.backgroundColor = "white";
	container.style.padding = "10px";
	
	const title = document.createElement("h1");
	title.innerHTML = "TikTok Notes";

	const notesField = document.createElement("textarea");
	notesField.id = "tiktok-notes";
	notesField.placeholder = "Notes";

	const notes = videoData?.results[0]?.properties?.Notes?.rich_text[0]?.plain_text || "";
	if (notes) {
		notes.replace(/\n/g, "<br>");
		notesField.value = notes;
	}

	const selectedTags = videoData?.results[0]?.properties?.Tags?.multi_select;

	container.appendChild(title);
	container.appendChild(notesField);

	// multi select tags
	const tagsContainer = document.createElement("div");
	tagsContainer.style.display = "flex";
	tagsContainer.style.flexWrap = "wrap";
	tagsContainer.style.marginTop = "10px";

	const tagsTitle = document.createElement("h2");
	tagsTitle.innerHTML = "Tags";
	tagsTitle.style.marginRight = "10px";
	tagsContainer.appendChild(tagsTitle);

	tags.forEach(tag => {
		const tagContainer = document.createElement("label");
		tagContainer.style.border = `1px solid ${TEXT_COLORS[tag.color]}`;
		tagContainer.style.borderRadius = "1000px";
		tagContainer.style.padding = "5px";
		tagContainer.style.userSelect = "none";
		tagContainer.style.color = TEXT_COLORS[tag.color];
		
		tagContainer.innerHTML = tag.name

		const tagCheckbox = document.createElement("input");
		tagCheckbox.type = "checkbox";
		tagCheckbox.style.display = "none";

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

	notesField.addEventListener("input", (e) => {
		const notesContent = e.target.value;

		console.log(notesContent, notes)

		if (notesContent !== notes) {
			button.disabled = false;
		} else {
			button.disabled = true;
		}
	})

	console.log(videoData)

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

		const res = await fetch(API_URL + "/updateDb", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(data),
		});

		const updatedVideoData = await res.json();

		console.log(updatedVideoData);

		button.disabled = true;
	})

	container.appendChild(tagsContainer);
	container.appendChild(button);

	document.body.appendChild(container);
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

const handleWidget = async (widgetEnabled, tab) => {
	chrome.scripting.executeScript({
		target: { tabId: tab.id },
		function: () => {
			const oldWidget = document.getElementById("tiktok-notion");
			if (oldWidget) {
				oldWidget.remove();
			}
		}
	});

	if (widgetEnabled) {
		const url = tab.url;
		if (!url?.includes("tiktok")) return;

		try {
			const db = await getDb();

			const tags = db.properties.Tags.multi_select.options
			console.log(db)
			const videoData = await getVideoData(url);

			// add items on screen
			chrome.scripting.executeScript({
				target: { tabId: tab.id },
				function: createWidget,
				args: [tags, videoData, API_URL]
			});
			// check if video is already in database
		} catch (err) {
			console.log(err);
		}
	}
}

chrome.action.onClicked.addListener(function (tab) {
	chrome.storage.sync.get("widgetEnabled", async (data) => {
		const widgetEnabled = !data.widgetEnabled;
		chrome.storage.sync.set({ widgetEnabled });

		handleWidget(widgetEnabled, tab);
	})
});

const tabUpdateHandler = (tab) => {
	try {
		verifyUrl(tab.url);
	} catch (err) {
		return;
	}

	chrome.storage.sync.get("widgetEnabled", async (data) => {
		const widgetEnabled = data.widgetEnabled;
		handleWidget(widgetEnabled, tab);
	});
}

// when url in current tab changes
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
	if (changeInfo.status !== "complete") return;

	tabUpdateHandler(tab);
});

// when new tab is selected
chrome.tabs.onActivated.addListener((activeInfo) => {
	chrome.tabs.get(activeInfo.tabId, (tab) => {
		tabUpdateHandler(tab);
	});
});
