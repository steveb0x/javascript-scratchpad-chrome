function launchScratchpad() {
	chrome.app.window.create('../scratchpad.html', {
		width: 960,
		height: 600,
		frame: 'none'
	});
}