module.exports = function(moduleToLoad) {

	var modules = {
		colors: function() {
			var temp = require('colors');
			temp.setTheme({
				err: 'bgRed',
				standout: 'bgMagenta',
				sendingMsg: 'magenta'
			});
			return temp;
		},
		log: function() {
			var temp = require('./logWithColor.js');
			return temp;
		},
		emit: function() {
			var temp = require('./emit.js');
			return temp;

		},
		users: function() {
			var temp = require('./users.js');
			return temp;
		},
		gameState: function() {
			var temp = require('./gameState.js');
			return temp;
		}
	};

	return modules[moduleToLoad]();
};