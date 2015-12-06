//module.exports = function(players) {
var players = {};

var state = {

	'players': players,

	playerCount: function() {
		var numberOfPlayers = 0;
		for (var p in players) {
			numberOfPlayers++;
		}
		return numberOfPlayers;
	},

	'preStart': {
		text: {
			1: "Checking play requirements...",
			2: 'Press "Accept" when prompted by your browser.'
		},
		//send list of device features to check for and enable
		features: {
			geolocation: {
				supported: false,
				setup: function() {
					return navigator.geolocation;
				}
			},
			vibrate: {
				supported: false,
				setup: function(vibrateLength) {
					try {
						navigator.vibrate = navigator.vibrate ||
							navigator.webkitVibrate ||
							navigator.mozVibrate ||
							navigator.msVibrate;
						navigator.vibrate(vibrateLength);
						msg("Vibrate successful!");
					} catch (err) {
						msg(err.message);
					}
				}
			},
			localstorage: {
				supported: false,
				setup: function() {
					return localStorage;
				}
			}
		}
	}
	//};

	//return state;

};

module.exports = state;