CodeMirror.Pos = function(line, pos) {
	return {
		line: line,
		ch: pos
	};
};

CodeMirror.prototype.firstLine = function() {
	return 0;
};
CodeMirror.prototype.lastLine = function() {
	return this.lineCount() - 1;
};