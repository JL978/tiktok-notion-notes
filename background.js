// chrome.runtime.onInstalled.addListener(() => {
// 	chrome.storage.sync.set({ color });
// 	console.log("Default background color set to %cgreen", `color: ${color}`);
// });
const API_URL = "http://tt-notion.fly.dev"

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

const createWidget = (channel, videoId) => {
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

	document.body.appendChild(container);
}

// on url change
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
	if (changeInfo.status !== "complete") return;

	chrome.scripting.executeScript({
		target: { tabId: tabId },
		function: () => {
			const oldWidget = document.getElementById("tiktok-notion");
			if (oldWidget) {
				oldWidget.remove();
			}
		}
	});

	// check if url is tiktok
	const url = tab.url;
	console.log(tab)
	if (!url?.includes("tiktok")) return;

	try {
		const { channel, videoId } = getVidInfo(url);
		console.log(channel, videoId)

		fetch(API_URL, {
			method: "GET",
		})
			.then(res => res.json())
			.then(data => console.log(data))
			.catch(err => console.log(err))

		// add items on screen
		chrome.scripting.executeScript({
			target: { tabId: tabId },
			function: createWidget,
			args: [channel, videoId]
		});
		// check if video is already in database
	} catch (err) {
		console.log(err);
	}
});
