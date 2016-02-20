module.exports = function(colors,log) {
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
		name: 'Union Square Lincoln statue',
		lat: 40.736183,
		lng: -73.990122
	}, {
		name: '15th Street near 5th Ave',
		lat: 40.736523,
		lng: -73.992729
	}, {
		name: 'Church of St. Francis Xavier',
		lat: 40.738258,
		lng: -73.995006
	}, {
		name: 'Quad cinemas',
		lat: 40.736045,
		lng: -73.996032
	}, {
		name: '18th near 5th',
		lat: 40.738731,
		lng: -73.992364
	}, {
		name: 'University and 13th',
		lat: 40.734386,
		lng: -73.992503
	}, {
		name: 'University center',
		lat: 40.735305,
		lng: -73.994171
	}, {
		name: 'Popeyes',
		lat: 40.736858,
		lng: -73.995447
	}];
	// {
	// 	name: '16th and 5th Ave SW corner park',
	// 	lat: 40.737283,
	// 	lng: -73.992879
	// },
	// {
	// 	name: '15th St and 9th Ave NE corner',
	// 	lat: 40.741543,
	// 	lng: -74.004475
	// }, 
	// {
	// 	name: 'Washington Ave and Lincoln Pl',
	// 	lat: 40.672643,
	// 	lng: -73.962675
	// }, {
	// 	name: 'McNair Park',
	// 	lat: 40.670774,
	// 	lng: -73.961985
	// }


	var hubStats = {
		hackRange: 50, //in meters
		hackTimeInMinutes: 3,
		hackProgressInterval: 2000,
		attackingPlayers: [],
		getHackTime: function() {
			return hubStats.hackTimeInMinutes * 60000;
		}, //in milliseconds
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
			// variedDefault: function() {

			// 	if (gameState.randomize) {

			// 	} else {
			// 		teams.default = teams.default == 'ins' ? 'gov' : 'ins';
			// 		log('Default team switched to ' + teams.default, colors.standout);
			// 		return teams.default;
			// 	}
			// }
		},

		'hubs': hubs,

		setupHubs: function() {

			for (i in state.hubs) {
				//state.hubs.forEach(function(hub){
				var hub = state.hubs[i];

				hub['id'] = +i + 1;
				hub['health'] = 100.0;
				hub['hackRange'] = hubStats.hackRange;
				hub['hackTime'] = hubStats.getHackTime();
				hub['hackProgressInterval'] = hubStats.hackProgressInterval;
				hub['decrement'] = 100.0 / hub.hackTime;
				hub['alertState'] = 0;
				hub['live'] = true;
				hub['setAlertState'] = hubStats.setAlertState;
				hub['attackingPlayers'] = hubStats.attackingPlayers;

			}; //);
		},

		playerCount: function() {
			var numberOfPlayers = 0;
			//for (var p in players) {
			for (var p in state.players) {
				numberOfPlayers++;
			}
			return numberOfPlayers;
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
	return state;

};

// module.exports = state;