//module.exports = function(players) {
var players = {};

var hubs = [{
	name: '17th & Broadway PedPlaza',
	lat: 40.737323,
	lng: -73.990213
}, {
	name: 'Union Square SE Circle',
	lat: 40.734795,
	lng: -73.990261
}, {
	name: '15th Street near 5th Ave',
	lat: 40.736523,
	lng: -73.992729

}];

var hubStats = {
	hackRange: 75, //in meters
	hackTimeInMinutes: 5,
	getHackTime: function() {
		return hubStats.hackTimeInMinutes * 60000;
	} //in milliseconds

};

var state = {

	'players': players,

	'hubs': hubs,

	setupHubs: function() {

		for (i in state.hubs) {
			//state.hubs.forEach(function(hub){
			var hub = state.hubs[i];

			hub['id'] = +i+1;
			hub['health'] = 100.0;
			hub['hackRange'] = hubStats.hackRange;
			hub['hackTime'] = hubStats.getHackTime();
			hub['decrement'] = 100.0 / hub.hackTime;
			hub['alertState'] = 0;

		}; //);
	},

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