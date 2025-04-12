window.addEventListener('message', (event) => {
	if (event.source !== window || event.data?.source !== 'RobloxAltLoader') return;
	
	chrome.runtime.sendMessage({ action: event.data.action });
});
