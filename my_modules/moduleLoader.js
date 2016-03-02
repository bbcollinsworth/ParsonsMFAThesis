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
		util: function() {
			var temp = require('util');
			temp.myExtend = function(originalObj, propsToUpdateObj) {
				for (key in propsToUpdateObj) {
					originalObj[key] = propsToUpdateObj[key];
				}
			};
			return temp;
			//return require('util');
		},
		log: function() {
			return require('./logWithColor.js');
		},
		emit: function() {
			return require('./emit.js');

		},
		users: function() {
			return require('./users.js');
		},
		gameState: function() {
			var temp = require('./gameState.js');
			temp.setupHubs();
			return temp;
		}
	};

	return modules[moduleToLoad]();
};