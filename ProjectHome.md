This extension adds a JavaScript scratchpad to Chrome, inspired by Firefox's scratchpad.

  * All code you run is completely sandboxed, so you can't access any of the open tabs or do any DOM manipulation.
  * Code doesn't block the interface, so you can safely write `while(1) console.log('message')` and cancel execution without crashing the scratchpad or Chrome.
  * Save and open scripts anywhere on the disk you like.
  * Syncing and auto-saving is not supported yet, although you could save to Dropbox.
  * Uses the CodeMirror editor for code highlighting, auto-indentation and more, and JSHint for detailed error hints
  * F12 doesn't work, but right click -> inspect element does and as an added bonus, if you close the Scratchpad without first closing the Developer Tools, they'll open next time automatically.