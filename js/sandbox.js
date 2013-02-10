function setUpWorker() {
	worker = new Worker(window.URL.createObjectURL(new Blob(["\
var window = this;\
var messages = [];\
setInterval(function() {\
	if(messages.length) {\
		var msg;\
		try {\
			self.postMessage(msg = messages.shift());\
		} catch(e) {\
			if(msg.args) {\
				msg.args = msg.args.map(function(elm) {\
					return elm + '';\
				});\
				self.postMessage(msg);\
			}\
		}\
	}\
}, 100);\
var getConsoleMethod = function(method) {\
	return function() {\
		messages.push({\
			cmd: 'console',\
			method: method,\
			args: [].slice.call(arguments)\
		});\
	};\
};\
\
var console = (function() {\
	var time = getConsoleMethod('time'),\
		timeEnd = getConsoleMethod('timeEnd'),\
		times = {};\
	return {\
		log: getConsoleMethod('log'),\
		debug: getConsoleMethod('debug'),\
		time: function(name) {\
			times[name || 'time'] = +new Date();\
		},\
		timeEnd: function(name) {\
			name || (name = 'time');\
			console.debug(name + ': ' + (+new Date() - times[name]) + 'ms');\
		}\
	};\
})();\
\
var geval = eval;\
self.onmessage = function(event) {\
	geval(event.data);\
	setTimeout(function() {\
		messages.push({\
			cmd: 'done'\
		});\
	});\
};"], {type: 'text/javascript'})));
	worker.addEventListener('message', function(event) {
		source.postMessage(event.data, origin);
	}, false);
	worker.addEventListener('error', function(event) {
		source.postMessage({
			cmd: 'done'
		}, origin);
	}, false);
}

var source, origin;

var worker;
setUpWorker();

window.addEventListener('message', function(event) {
	switch(event.data.cmd) {
		case 'run':
			source = event.source;
			origin = event.origin;
			worker.postMessage(event.data.value);
			break;
		case 'die':
			worker.terminate();
			setUpWorker();
			break;
	}
});