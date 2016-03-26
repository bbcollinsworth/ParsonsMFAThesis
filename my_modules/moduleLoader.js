module.exports = function(moduleToLoad) {

	var modules = {
		globalModules: function() {
			var g = {
				'geolib': modules.geolib(),
				'util': modules.util(),
				'colors': modules.colors(),
				'log': modules.log(),
				'emitModule': modules.emit(),
				'userModule': modules.users()
			};

			for (var key in g) {
				GLOBAL[key] = g[key];
			}

		},
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
			temp.myExtend = function(originalObj, updateObj) {
				var descriptor, prop;
				for (prop in updateObj) {
					descriptor = Object.getOwnPropertyDescriptor(updateObj, prop);
					Object.defineProperty(originalObj, prop, descriptor);
					//originalObj[key] = propsToUpdateObj[key];
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
			//temp.setupHubs();
			return temp;
		}
	};

	return modules[moduleToLoad]();
};