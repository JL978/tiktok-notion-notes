chrome.runtime.onInstalled.addListener(() => {
	chrome.storage.sync.set({ widgetEnabled: false });
});

// const API_URL = "http://tt-notion.fly.dev"
const API_URL = "http://localhost:8080"

const getVidInfo = (url) => {
	// tiktok video url format: https://www.tiktok.com/[channelName]/video/[videoId]
	// Check correct url format

	const urlRegex = /https:\/\/www.tiktok.com\/@(.*)\/video\/(.*)/;
	const test = url.match(urlRegex);
	if (!test) {
		throw new Error("Invalid TikTok URL");
	}

	const channelRegex = /@(.*)\/video/;
	const channel = url.match(channelRegex)[1];

	const videoId = url.split("/").pop();
	
	return { channel, videoId };
}

const createWidget = (channel, videoId, tags) => {
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
		const tagContainer = document.createElement("div");
		tagContainer.style.display = "flex";
		tagContainer.style.alignItems = "center";
		tagContainer.style.marginRight = "10px";

		const tagCheckbox = document.createElement("input");
		tagCheckbox.type = "checkbox";
		tagCheckbox.id = tag.id + "-checkbox";
		tagCheckbox.style.marginRight = "5px";
		tagCheckbox.style.cursor = "pointer";
		tagCheckbox.style.backgroundColor = tag.color;
		
		const tagLabel = document.createElement("label");
		tagLabel.htmlFor = tag.id + "-checkbox";
		tagLabel.innerHTML = tag.name;
		tagLabel.style.cursor = "pointer";
		tagLabel.style.userSelect = "none";

		tagContainer.appendChild(tagLabel);
		tagContainer.appendChild(tagCheckbox);
		tagsContainer.appendChild(tagContainer);
	});

	container.appendChild(tagsContainer);

	document.body.appendChild(container);
}

const getDb = async () => {
	const res = await fetch(API_URL + "/db");
	const data = await res.json();
	return data;
}

chrome.action.onClicked.addListener(function (tab) {
	chrome.storage.sync.get("widgetEnabled", async (data) => {
		const widgetEnabled = !data.widgetEnabled;
		chrome.storage.sync.set({ widgetEnabled });
		console.log(widgetEnabled)

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
				const { channel, videoId } = getVidInfo(url);
				console.log(channel, videoId)

				const db = await getDb();

				const tags = db.properties.Tags.multi_select.options
				console.log(tags)


				fetch(API_URL + "/queryDb" + `?url=${url}`)
					.then(res => res.json())
					.then(data => console.log(data))
					.catch(err => console.log(err))

				// add items on screen
				chrome.scripting.executeScript({
					target: { tabId: tab.id },
					function: createWidget,
					args: [channel, videoId, tags]
				});
				// check if video is already in database
			} catch (err) {
				console.log(err);
			}
		}
	})
});
