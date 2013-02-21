var editor = CodeMirror.fromTextArea(document.getElementById('js'), {
	mode: 'text/javascript',
	styleActiveLine: true,
	lineNumbers: true,
	lineWrapping: true,
	indentUnit: 4,
	indentWithTabs: true,
	autofocus: true,
	undoDepth: 200,
	matchBrackets: true,
	highlightSelectionMatches: true,
	extraKeys: {
		'Enter': 'newlineAndIndentContinueComment'
	},
	onDragEvent: function(editor, evt) {
		document.getElementsByClassName('CodeMirror-scroll')[0].classList.add('CodeMirror-focused');
		var pos = editor.charCoords(editor.coordsChar({left: evt.clientX, top: evt.clientY}), 'local'),
			cur = editor.display.otherCursor;
		cur.style.display = '';
		cur.style.top = pos.top + 'px';
		cur.style.left = pos.left + 'px';
	},
	gutters: ['jshint-errors', 'CodeMirror-linenumbers'],
	fixedGutter: true
});
setTimeout(function() { editor.setSelection({line: editor.lineCount() - 1, ch: 0}); }, 100);

var emptyRe = /^\s*$/;
function updateHints() {
  editor.operation(function(){
	editor.clearGutter('jshint-errors');
	var errorLines = [];
	var val = editor.getValue();
	if(!emptyRe.test(val)) {
    	JSHINT(val);
		var last;
		for (var i = 0; i < JSHINT.errors.length; ++i) {
			var err = JSHINT.errors[i];
			if (!err) continue;
			if(err.line + err.reason === last) continue;
			last = err.line + err.reason; // JSHINT triggers a lot of errors when you type "/*"
			if(errorLines[err.line - 1]) {
				errorLines[err.line - 1] += '\n' + err.reason;
			} else {
				errorLines[err.line - 1] = err.reason;
			}
		}
		for(var i = 0, linecount = editor.lineCount(); i < linecount; i++) {
			if(errorLines[i]) {
				editor.addLineClass(i, 'wrap', 'jshint-error-line');
				var elm = document.createElement('div');
				elm.title = errorLines[i];
				elm.className = 'jshint-error';
				elm.innerHTML = '&nbsp;';
				editor.setGutterMarker(i, 'jshint-errors', elm);
			} else {
				editor.removeLineClass(i, 'wrap', 'jshint-error-line');
			}
		}
	}
  });
}

var updateHintsTimeout;
editor.on('change', function() {
	updateTitle();
	clearTimeout(updateHintsTimeout);
	updateHintsTimeout = setTimeout(updateHints, 500);
});
setTimeout(updateHints, 100);

var linenumberRe = /CodeMirror-linenumber\b/;
var startLine;
editor.on('gutterClick', function(editor, n) {
	editor.setSelection({line: n + 1, ch: 0}, {line: n, ch: 0});
	startLine = n;
	window.addEventListener('mousemove', selectLines, false);
	window.addEventListener('mouseup', endSelectLines, false);
});
function endSelectLines() {
	window.removeEventListener('mousemove', selectLines, false);
	window.removeEventListener('mouseup', endSelectLines, false);
}
function selectLines(evt) {
	var endLine;
	var target = evt.target;
	if(linenumberRe.test(target.className)) {
		endLine = +evt.target.innerHTML;
	} else if(target.nodeName === 'PRE' || (target = target.parentNode).nodeName === 'PRE') {
		endLine = 1;
		
		target = target.parentNode;
		var node = target.parentNode.firstChild;
		while(node && node.nodeType === 1 && node !== target) {
			endLine++;
			node = node.nextElementSibling;
		}
	} else {
		return;
	}
	
	if(endLine > startLine) {
		editor.setSelection({line: endLine, ch: 0}, {line: startLine, ch: 0});
	} else {
		editor.setSelection({line: startLine + 1, ch: 0}, {line: endLine - 1, ch: 0});
	}
}

var sandbox = document.getElementById('sandbox');
var sandboxWin;
sandbox.onload = function() {
	sandboxWin = sandbox.contentWindow;
	window.addEventListener('message', function(event) {
		if(event.data.cmd === 'done') {
			clearTimeout(longrunningTimeout);
			closeLongrunningDialog();
		} else if(event.data.cmd === 'console') {
			console[event.data.method].apply(console, event.data.args.length ? event.data.args : [undefined]);
		}
	});
};


var longrunningTimeout;
var closeLongrunningDialog = function() {};
function longrunning() {
	closeLongrunningDialog = editor.openConfirm('Script takes long to finish. <button>Cancel script</button> <button>Ask again later</button>', [function() {
		console.log('cancel');
		sandboxWin.postMessage({
			cmd: 'die'
		}, '*');
    }, function() {
		longrunningTimeout = setTimeout(longrunning, 15000);
	}], {
		closeonblur: false
	});
}


CodeMirror.keyMap.pcDefault.F1 = 'help';
CodeMirror.keyMap.pcDefault.F3 = 'findNext';
CodeMirror.keyMap.pcDefault['Shift-F3'] = 'findPrev';
CodeMirror.keyMap.pcDefault['Ctrl-G'] = 'goToLine';
CodeMirror.keyMap.pcDefault['Shift-Ctrl-S'] = 'saveAs';
CodeMirror.keyMap.pcDefault['Ctrl-O'] = 'open';
CodeMirror.keyMap.pcDefault['Ctrl-N'] = 'new';
CodeMirror.keyMap.pcDefault['Ctrl-R'] = 'run';

CodeMirror.keyMap.macDefault.F1 = 'help';
CodeMirror.keyMap.macDefault.F3 = 'findNext';
CodeMirror.keyMap.macDefault['Shift-F3'] = 'findPrev';
CodeMirror.keyMap.macDefault['Cmd-G'] = 'goToLine';
CodeMirror.keyMap.macDefault['Shift-Cmd-S'] = 'saveAs';
CodeMirror.keyMap.macDefault['Cmd-O'] = 'open';
CodeMirror.keyMap.macDefault['Cmd-R'] = 'run';

CodeMirror.commands.goToLine = function() {
	editor.openDialog('Line number: <input type="text" style="width: 6em"/>', function(line) {
		editor.operation(function() {
			line = parseInt(line, 10);
			if(!isFinite(line)) return;
			editor.setSelection({line: line - 1, ch: 0});
		});
    });
};

var helpDialog = '<button style="float:right">Close Help</button>';
var bindings = [];
for(var binding in CodeMirror.keyMap['default']) {
	if(binding !== 'fallthrough') {
		bindings.push([binding, CodeMirror.keyMap['default'][binding]]);
	}
}
bindings.sort(function(a, b) {
	return a[0].charCodeAt(a[0].length - 1) - b[0].charCodeAt(b[0].length - 1);
});
for(var i = 0; i < bindings.length; i++) {
	helpDialog += '<br>' + bindings[i][0] + ': ' + bindings[i][1];
}
CodeMirror.commands.help = function() {
	editor.openDialog(helpDialog);
};
CodeMirror.commands.save = function() {
	save(false);
};
CodeMirror.commands.saveAs = function() {
	save(true);
};
CodeMirror.commands.open = function() {
	chrome.fileSystem.chooseEntry({
		accepts: [{
			mimeTypes: ['text/javascript', 'application/javascript'],
			extensions: ['js']
		}],
		acceptsAllTypes: false
	}, function(entry) {
		entry.file(function(file) {
			chrome.fileSystem.getDisplayPath(entry, function(path) {
				displayPath = path;
				updateTitle(true);
			});
			var reader = new FileReader();
			reader.onloadend = function(e) {
				editor.setValue(this.result);
				fileEntry = entry;
			};
			reader.readAsText(file);
		}, function(err) {
			console.log(err);
		});
	});
};
CodeMirror.commands['new'] = launchScratchpad;
CodeMirror.commands.run = function() {
	sandboxWin.postMessage({
		cmd: 'run',
		value: editor.getSelection() || editor.getValue()
	}, '*');
	longrunningTimeout = setTimeout(longrunning, 1000);
};

var fileEntry;
var displayPath;

function save(isSaveAs, close) {
	if(!fileEntry || isSaveAs) {
		saveAs(close);
	} else {
		doSave(fileEntry, false, close);
	}
}

function saveAs(close) {
	chrome.fileSystem.chooseEntry({
		type: 'saveFile',
		suggestedName: 'scratchpad.js'
	}, function(entry) {
		fileEntry = entry;
		doSave(fileEntry, true, close);
	});
}

function doSave(fileEntry, newPath, close) {
	fileEntry.createWriter(function(fileWriter) {
		var val = editor.getValue();
		fileWriter.onwriteend = function(e) {
			fileWriter.onwriteend = function() {
				if(newPath) {
					chrome.fileSystem.getDisplayPath(fileEntry, function(path) {
						displayPath = path;
						updateTitle(true);
					});
				} else {
					updateTitle(true);
				}
				if(close) {
					window.close();
				}
			};
			fileWriter.truncate(val.length);
		};
		fileWriter.onerror = function(e) {
			console.log('Write failed: ' + e.toString());
		};
		fileWriter.write(new Blob([val], {type: 'text/javascript'}));
    }, function(e) {
		console.log(e);
	});
}

var isSaved = true;
var title = document.getElementById('title');
function updateTitle(saved) {
	isSaved = saved;
	var path = displayPath || 'Scratchpad';
	title.innerText = (saved ? '' : '*') + path;
}

var buttons = document.getElementById('buttons');
function createButton(normalImg, hoverImg, click) {
	var btn = document.createElement('img');
	btn.src = btn._normalSrc = 'img/' + normalImg;
	btn._hoverSrc = 'img/' + hoverImg;
	btn.onmouseover = function() {
		this.src = this._hoverSrc;
	};
	btn.onmouseout = function() {
		this.src = this._normalSrc;
	};
	btn.onclick = click;
	buttons.appendChild(btn);
	return btn;
}

var currentWindow = chrome.app.window.current();
createButton('button_minimize.png', 'button_minimize_hover.png', function() {
	currentWindow.minimize();
});
function maximize() {
	currentWindow.maximize();
}
function restore() {
	currentWindow.restore();
}
var maximizeBtn = createButton('button_maximize.png', 'button_maximize_hover.png', maximize);
createButton('button_close.png', 'button_close_hover.png', function() {
	if(isSaved) {
		window.close();
	} else {
		editor.openConfirm("You haven't saved your work. <button>Save</button> <button>Close without saving</button> <button>Cancel</button>", [function() {
			save(false, true);
		}, function() {
			window.close();
		}]);
	}
});

currentWindow.onMaximized.addListener(function() {
	maximizeBtn.src = maximizeBtn._normalSrc = 'img/button_restore.png';
	maximizeBtn._hoverSrc = 'img/button_restore_hover.png';
	maximizeBtn.onclick = restore;
});
currentWindow.onRestored.addListener(function() {
	maximizeBtn.src = maximizeBtn._normalSrc = 'img/button_maximize.png';
	maximizeBtn._hoverSrc = 'img/button_maximize_hover.png';
	maximizeBtn.onclick = maximize;
});