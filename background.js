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

// on url change
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
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

		const getDivFunc = (channel, videoId) => {
				console.log("HELLO FROM GETDIVFUNC")
				// delete old div
				const oldDiv = document.getElementById("tiktok-notion");
				if (oldDiv) {
					oldDiv.remove();
				}

				const div = document.createElement("div");
				div.id = "tiktok-notion";
				div.style.position = "fixed";
				div.style.top = "10px";
				div.style.left = "10px";
				div.style.zIndex = 1000;
				div.style.backgroundColor = "white";
				div.style.padding = "10px";
				div.innerHTML = `${channel}: ${videoId}`;

				document.body.appendChild(div);
		}

		// add items on screen
		chrome.scripting.executeScript({
			target: { tabId: tabId },
			function: getDivFunc,
			args: [channel, videoId]
		});
		// check if video is already in database
	} catch (err) {
		console.log(err);
	}
});
