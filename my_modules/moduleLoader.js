module.exports = function(moduleToLoad) {

	var modules = {
		geolib: function() {
			return require('geolib');
		},
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
			// var temp = require('./logWithColor.js');
			// return temp;
			return require('./logWithColor.js');
		},
		emit: function() {
			// var temp = require('./emit.js');
			// return temp;
			return require('./emit.js');

		},
		users: function() {
			// var temp = require('./users.js');
			// return temp;
			return require('./users.js');
		},
		gameState: function() {
			var temp = require('./gameState.js');
			temp.setupHubs();
			return temp;
			//return require('./gameState.js');
		}
	};

	return modules[moduleToLoad]();
};