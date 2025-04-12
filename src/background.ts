const robloxProfileUrl = /^https:\/\/www\.roblox\.com\/users\/\d+(\/[^\/?#]*)?(\/)?([?#].*)?$/;

let profileTabId: number | null = null;

chrome.action.onClicked.addListener(async (activeTab) => {
	if (activeTab.incognito) {
		chrome.notifications.create({
			title: 'Roblox Alt Loader',
			message: 'You are not supposed to run this extension in Incognito mode',
			contextMessage: 'Run the extension in a Roblox profile page',
			iconUrl: chrome.runtime.getURL('icon.png'),
			type: 'basic',
		});
		
		return;
	}
	
	if (!robloxProfileUrl.test(activeTab.url ?? '')) {
		chrome.notifications.create({
			title: 'Roblox Alt Loader',
			message: 'Active tab does not match a Roblox profile URL',
			contextMessage: 'Open the profile you want your alt to join (must be friends/joins set to everyone)',
			iconUrl: chrome.runtime.getURL('icon.png'),
			type: 'basic',
		});
		
		return;
	}
	
	profileTabId = null;
	
	if (!await chrome.extension.isAllowedIncognitoAccess()) {
		chrome.notifications.create({
			title: 'Roblox Alt Loader',
			message: 'No access to Incognito windows, this extension runs using Incognito tabs, so this permission is required',
			contextMessage: 'To allow in Incognito mode, click this notification then find and turn on "Allow in Incognito"',
			iconUrl: chrome.runtime.getURL('icon.png'),
			type: 'basic',
		}, (notificationId) => {
			const listener = (otherNotificationId: string) => {
				if (otherNotificationId !== notificationId) {
					return;
				}
				
				chrome.notifications.onClicked.removeListener(listener);
				chrome.tabs.create({ active: true, url: `chrome://extensions/?id=${chrome.runtime.id}` });
			};
			
			chrome.notifications.onClicked.addListener(listener);
		});
		return;
	}
	
	const openWindows = await chrome.windows.getAll();
	for (const window of openWindows) {
		if (window.incognito) {
			chrome.notifications.create({
				title: 'Roblox Alt Loader',
				message: 'Please close all existing incognito tabs in order to start the extension',
				iconUrl: chrome.runtime.getURL('icon.png'),
				type: 'basic',
			});
			
			return;
		}
	}
	
	console.log('Creating Incognito window');
	
	const returnUrl = encodeURIComponent(activeTab.url!.toString());
	const window = await chrome.windows.create({
		incognito: true,
		focused: true,
		type: 'normal',
		url: `https://www.roblox.com/login?returnUrl=${returnUrl}`,
		state: 'maximized',
	});
	
	const windowId = window.id;
	if (windowId === undefined) {
		return;
	}
	
	const tab = window.tabs?.[0];
	profileTabId = tab?.id ?? null;
	console.log('Opened Roblox login page in Incognito window');
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
	if (tabId !== profileTabId) {
		return;
	}
	
	if (changeInfo.status === 'complete' && robloxProfileUrl.test(tab.url ?? '')) {
		console.log('Detected profile page, executing script');
		
		chrome.scripting.executeScript({
			target: { tabId },
			func: () => {
				const waitForElement = async (selector: string): Promise<Element> => {
					return new Promise<Element>((resolve) => {
						const element = document.querySelector(selector);
						if (element !== null) {
							resolve(element);
						}
						
						new MutationObserver((_, observer) => {
							const element = document.querySelector(selector);
							if (element !== null) {
								observer.disconnect();
								resolve(element);
							}
						}).observe(document, { childList: true, subtree: true });
					});
				};
				
				(async () => {
					const joinGameButton = await waitForElement('#join-game-button') as HTMLButtonElement;
					joinGameButton.click();
					
					window.postMessage({ source: 'RobloxAltLoader', action: 'joinedGame' }, '*');
				})();
			},
			world: 'ISOLATED',
		});
	}
});

chrome.runtime.onMessage.addListener((message, sender) => {
	if (sender.tab?.id === profileTabId && message?.action === 'joinedGame') {
		setTimeout(() => {
			if (profileTabId === null) {
				return;
			}
			
			chrome.tabs.remove(profileTabId);
			profileTabId = null;
		}, 5_000);
	}
});
