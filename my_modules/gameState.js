(function() { //module.exports = function() {

	var include = require('./moduleLoader.js');

	var colors = include('colors');
	var log = include('log');
	var util = include('util');

	var playSettings = {
		trackIntervalS: 3,
		hackTimeM: 1,
		trailDurationM: 2,
		dataSkipInterval: 3,
		introContent: {
			'gov': {
				'screen1': {
					1: "The Government needs your help to stop cyber criminals.",
					2: "At this moment, hackers are attempting to disable vital state security systems in your area.",
					3: "If they succeed, millions of lives could be at risk.",
					4: '<div id="nextButton">OK</div>'
				},
				'screen2': {
					1: "Use this app to detect the mobile activity of suspected hackers nearby.",
					2: "Sensitive security sites are marked in blue. You must intercept the hackers before they disable these sites.",
					3: "If you can get within 20 meters of an active suspect, you can disable their device and stop their attacks.",
					4: '<div id="nextButton">GO</div>'
				}
			},
			'ins': {
				'screen1': {
					1: "Big Data is Watching You.",
					2: "Government and corporate surveillance systems constantly monitor the most intimate details of our lives.",
					3: '<div id="nextButton">It\'s time to fight back.</div>'
				},
				'screen2': {
					1: "This app enables you to detect nearby surveillance sites with your mobile device.",
					2: "If you get close enough, you can hack these sites and disrupt their data collection.",
					3: "Be careful, though: using your phone may enable Government Operatives to track you down.",
					4: '<div id="nextButton">START</div>'
				}
			}
		}
	};

	// var colors = include('colors');
	// var log = include('log');

	//module.exports = function(players) {
	var players = {};

	var hubs = [{
			name: 'tribeca bldg',
			enabled: true,
			lat: 40.720000,
			lng: -74.004604
		}, {
			name: 'by st johns park',
			enabled: true,
			lat: 40.720708,
			lng: -74.006922
		}, {
			name: 'by Canal plastics',
			enabled: true,
			lat: 40.720651,
			lng: -74.003274
		}, {
			name: 'church and ave of Americas',
			enabled: true,
			lat: 40.718805,
			lng: -74.005066
		}, {
			name: 'lispenard and Broadway',
			enabled: true,
			lat: 40.719173,
			lng: -74.002291
		}, {
			name: '17th & Broadway PedPlaza',
			enabled: true,
			lat: 40.737323,
			lng: -73.990213
		}, {
			name: 'Union Square SE Circle',
			enabled: true,
			lat: 40.734795,
			lng: -73.990261
		}, {
			name: 'Union Square Lincoln statue',
			enabled: true,
			lat: 40.736183,
			lng: -73.990122
		}, {
			name: '15th Street near 5th Ave',
			enabled: true,
			lat: 40.736462,
			lng: -73.992086
		}, {
			name: 'Church of St. Francis Xavier',
			enabled: true,
			lat: 40.738258,
			lng: -73.995006
		}, 
		{
			name: 'Quad cinemas',
			enabled: false,
			lat: 40.736045,
			lng: -73.996032
		}, {
			name: '18th near 5th',
			enabled: true,
			lat: 40.738731,
			lng: -73.992364
		}, {
			name: 'University and 13th',
			enabled: false,
			lat: 40.734386,
			lng: -73.992503
		}, 
		{
			name: 'University center',
			enabled: false,
			lat: 40.735305,
			lng: -73.994171
		}, {
			name: 'Popeyes',
			enabled: false,
			lat: 40.736858,
			lng: -73.995447
		}, {
			name: '16th and 5th Ave SW corner park',
			enabled: true,
			lat: 40.737283,
			lng: -73.992879
		}, {
			name: '15th St and 9th Ave NE corner',
			enabled: false,
			lat: 40.741543,
			lng: -74.004475
		}, {
			name: 'Washington Ave and Lincoln Pl',
			enabled: false,
			lat: 40.672643,
			lng: -73.962675
		}, {
			name: 'McNair Park',
			enabled: false,
			lat: 40.670774,
			lng: -73.961985
		}
	];


	var hubStartStats = {
		health: 100,

		hackRange: 50, //in meters
		hackTimeInMinutes: 1,
		hackProgressInterval: 2000,
		attackingPlayers: [],
		get hackTime() {
			return state.settings.hackTimeM * 60000;
			//return hubStats.hackTimeInMinutes * 60000;
		},
		get decrement() {
			return 100 / this.hackTime;
		},
		live: true,
		// getHackTime: function() {
		// 	return hubStats.hackTimeInMinutes * 60000;
		// }, //in milliseconds
		// get live(){
		// 	if (this.health > 0){
		// 		return true;
		// 	} else {
		// 		return false;
		// 	}
		// },
		alertState: 0,
		setAlertState: function() {
			var h = this;

			switch (Math.floor(h.health / 25)) {
				case 0: //hubHealth < 25%
					h.alertState = 4;
					break;
				case 1: //hubHealth < 50%
					h.alertState = 3;
					break;
				case 2: //hubHealth < 75%
					h.alertState = 2;
					break;
				case 3: //hubHealth < 100%
					h.alertState = 1;
					break;
				default:
					h.alertState = 0;
					break;
			}

			console.log("Hub " + h.id + " AlertState set to: " + h.alertState);
		}

	};

	var state = {

		createGameSession: function(startTimestamp){
			this.startTime = startTimestamp;
			this.gameID = "game"+startTimestamp;
		},

		settings: playSettings,

		//'trackIntervalInSeconds': 10,

		get trackingInterval() {
			return this.settings.trackIntervalS * 1000;
			//return this.trackIntervalInSeconds * 1000;
		},

		//'trailDurationInMinutes': 1,

		get suspectTrailDuration() {
			return this.settings.trailDurationM * 60000;
			//return this.trailDurationInMinutes * 60 * 1000;
		},

		newLocRequest: function() {
			var lReq = {
				timestamp: Date.now(),
				resReceived: false //,
				// send: function(){
				// emitTo.socket('getLocation', this);
				// }
			};

			return lReq;
		},

		'players': players,

		'teamPickMethod': 'alternate',

		'teams': {
			'g': 'gov',
			'i': 'ins',
			'default': 'gov', //set to Gov so first player will be int
			'lastAssigned': 'gov', //set to Gov so first player will be int
			alternate: function() {
				this.lastAssigned = (this.lastAssigned == 'ins') ? 'gov' : 'ins';
				log('New player team flipped to ' + this.lastAssigned, colors.standout);
				return this.lastAssigned;
			},
			random: function() {
				this.lastAssigned = (Math.random() < 0.5) ? 'ins' : 'gov';
				log('New player team randomized to ' + this.lastAssigned, colors.standout);
				return this.lastAssigned;
			},
			proximity: function() {
				//this would create opposing players near existing players
				//IF playercount is above a certain number
				//else return this.random()
			} //,
		},

		'hubs': [], //hubs

		setupHubs: function() {

			//hubs.forEach()
			for (i in hubs) {
				//state.hubs.forEach(function(hub){
				var hub = hubs[i];

				//only push enabled hubs - easy activation deactivation for testing
				if (hub.enabled) {

					hub['id'] = +i + 1;
					util.myExtend(hub, hubStartStats);

					state.hubs.push(hub);
				}

				// hub['id'] = +i + 1;
				// hub['health'] = 100.0;
				// hub['hackRange'] = hubStats.hackRange;
				// hub['hackTime'] = hubStats.hackTime; //hubStats.getHackTime();
				// hub['hackProgressInterval'] = hubStats.hackProgressInterval;
				// hub['decrement'] = 100.0 / hub.hackTime;
				// hub['alertState'] = 0;
				// //hub['live'] = true;
				// hub['live'] = true;
				// hub['setAlertState'] = hubStats.setAlertState;
				// hub['attackingPlayers'] = hubStats.attackingPlayers;

			} //);
		},

		get playerCount() {
			var numberOfPlayers = 0;
			//for (var p in players) {
			for (var p in state.players) {
				numberOfPlayers++;
			}
			return numberOfPlayers;
		},
		// playerCount: function() {
		// 	var numberOfPlayers = 0;
		// 	//for (var p in players) {
		// 	for (var p in state.players) {
		// 		numberOfPlayers++;
		// 	}
		// 	return numberOfPlayers;
		// },

		getTeamSize: function(t) {
			log("Get " + t + " team size called", colors.err);
			var existingTeamMembers = 0;

			//var players = state.players;
			for (p in state.players) {
				log("Team for " + state.players[p].userID + " is " + state.players[p].team);
				if (state.players[p].team == t) {
					existingTeamMembers++;
				}
			}

			// for (u in users) {
			// 	if (users[u].team == t) {
			// 		existingTeamMembers++;
			// 	}
			// }

			log('Team size is ' + existingTeamMembers, colors.standout);
			return existingTeamMembers;
		},

		liveHubCount: function() {
			var liveHubs = 0;
			for (var h in hubs) {
				if (hubs[h].live) {
					liveHubs++;
				}
			}
			return liveHubs;
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

	};
	//return state;

	//};

	module.exports = state;
})();