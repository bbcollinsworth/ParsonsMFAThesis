(function() { //module.exports = function() {

	var startZones = {
		'university center': {
			lat: 40.735305,
			lng: -73.994171
		},
		'McNair Park': {
			//enabled: true,
			lat: 40.670774,
			lng: -73.961985
		}

	};

	var playSettings = {
		hubDownTarget: 3,
		trackIntervalS: 3,
		hackTimeM: 3.0,
		trailDurationM: 2,
		dataSkipInterval: 3,
		teamPickMethod: 'alternate', //'insIfNoHash', //
		maxGovDistance: 500, //in meters
		startZones: {
			'gov': {
				lat: 40.735275026168516,
				lng: -73.99410009384155
			},
			'ins': {
				lat: 40.73714480561841,
				lng: -73.99032354354858
			}
		},
		// startZone: function(team) {
		// 	var z = {
		// 		'ins': 'university center',
		// 		'gov': 'McNair Park'
		// 	}
		// 	return startZones[z[team]];
		// },
		introContent: {
			'gov': {
				'screen1': {
					1: "<b>Stopping cyber crime starts with you.</b>",
					2: "At this moment, hackers are attempting to disable vital Government security systems in your area.",
					3: "If they succeed, millions of lives could be at risk.",
					//4: '<div id="nextButton">OK</div>'
					button: {
						txt: 'OK',
						//id: 'nextButton',
						onClick: 'nextIntroScreen'
						// clickEvent: function(){
						// 	msg(intro[team].screen2);
						// }
					}
				},
				'screen2': {
					1: "Use this app to detect the mobile activity of suspected hackers nearby.",
					2: "Sensitive security sites are marked in blue. <b>Intercept all hackers before they disable these sites.</b>",
					3: "Get within 20 meters of an active suspect to lock their device and stop their attacks.",
					//4: '<div id="nextButton">GO</div>'
					button: {
						txt: 'GO',
						//id: 'nextButton',
						onClick: 'introComplete'
						// clickEvent: function(){
						// 	$('#app').trigger('introComplete');
						// }
					}
				}
			},
			'ins': {
				'screen1': {
					1: "Big Data is Watching You.",
					2: "Government and corporate surveillance systems constantly monitor the most intimate details of our lives.",
					//3: '<div id="nextButton">It\'s time to fight back.</div>'
					button: {
						txt: "It's time to fight back",
						//id: 'nextButton',
						onClick: 'nextIntroScreen'
					}
				},
				'screen2': {
					1: "This app enables you to detect nearby surveillance sites with your mobile device.",
					2: "If you get close enough, you can hack these sites. <b>Hacking <u>at least 3 sites</u> will disrupt government data collection.</b>",
					3: "BE CAREFUL: When your phone is active, you reveal your position to Government Operatives.",
					//4: '<div id="nextButton">START</div>'
					button: {
						txt: 'START',
						//id: 'nextButton',
						onClick: 'introComplete'
						// clickEvent: function(){
						// 	$('#app').trigger('introComplete');
						// }
					}
				}
			}
		}
	};

	// var colors = include('colors');
	// var log = include('log');

	//module.exports = function(players) {
	var players = {

	};

	var hubs = [{
		name: 'tribeca bldg',
		enabled: false,
		lat: 40.720000,
		lng: -74.004604
	}, {
		name: 'by st johns park',
		enabled: false,
		lat: 40.720708,
		lng: -74.006922
	}, {
		name: 'by Canal plastics',
		enabled: false,
		lat: 40.720651,
		lng: -74.003274
	}, {
		name: 'church and ave of Americas',
		enabled: false,
		lat: 40.718805,
		lng: -74.005066
	}, {
		name: 'lispenard and Broadway',
		enabled: false,
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
	}, {
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
		enabled: true,
		lat: 40.734386,
		lng: -73.992503
	}, {
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
		enabled: true,
		lat: 40.741267,
		lng: -74.004077
	}, {
		name: 'High Line at 14th',
		enabled: false,
		lat: 40.741969,
		lng: -74.007770
	}, {
		name: 'Gansevoort and Greenwich patio',
		enabled: false,
		lat: 40.739530,
		lng: -74.006278
	}, {
		name: '16th and 8th Ave park',
		enabled: true,
		lat: 40.741359,
		lng: -74.002029
	}, {
		name: 'Washington Ave and Lincoln Pl',
		enabled: true,
		lat: 40.672614,
		lng: -73.962410
	}, {
		name: 'McNair Park',
		enabled: true,
		lat: 40.670774,
		lng: -73.961985
	}];


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
		//live: true,
		// getHackTime: function() {
		// 	return hubStats.hackTimeInMinutes * 60000;
		// }, //in milliseconds
		get live() {
			if (this.health > 0) {
				return true;
			} else {
				return false;
			}
		},
		get attackerCount() {
			var count = 0;
			for (uID in state.players) {
				if (state.players[uID].hubAttacking === this) {
					log(uID + " is attacking hub " + this.id + "/" + this.name, colors.bgYellow);

					count++;
				}
			};
			log("Total attacking players for '" + this.name + "': " + count);
			return count;
		},
		alertState: 0,
		setAlertState: function() {
			var h = this;

			if (h.attackingPlayers < 1) {
				h.alertState = 0;
			} else {

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
				}
			}

			console.log("Hub " + h.id + " AlertState set to: " + h.alertState);
		},
		updateAttackingPlayers: function(player, addOrRemove) {
			var h = this;
			var foundIndex = -1;

			log("Checking for " + player.userID + " in attacking players for " + h.id, colors.standout);

			for (var i = 0; i < h.attackingPlayers.length; i++) {
				if (player.userID == h.attackingPlayers[i]) {
					foundIndex = i;
					break;
				}
			}

			var update = {
				add: function() {
					if (foundIndex < 0) {
						h.attackingPlayers.push(player.userID);
						log("Adding " + player.userID + "to Attacking Players for " + h.id, colors.standout);
					}
				},
				remove: function() {
					if (foundIndex >= 0) {
						h.attackingPlayers.splice(i, 1);
						log("Removed " + player.userID + "from attacking players; new length is: ", colors.standout);
						log(h.attackingPlayers.length, colors.standout);
					}

				}
			};

			update[addOrRemove]();
		}

	};

	var state = {

		createGameSession: function(setup) {
			playSettings.gameCreateTime = Date.now();
			playSettings.serverStart = serverStartTime; //setup.serverStart;
			//this.gameStart = setup.gameStart;
			for (var setting in setup) {
				playSettings[setting] = setup[setting];
			}

			this.players = {};

			playSettings.gameID = "game-" + setup.gameStart;

			log("Game Sessions Created. Playsettings are: ", colors.hilite);
			//log(playSettings);
			log(this.settings);
		},

		get gameStarted() {
			if (Date.now() > state.settings.gameStart) {
				log("Game has started", colors.bgGreen);
				return true;
			} else {
				log("Game not yet started", colors.error);
				return false;
			}
		},

		'settings': playSettings,

		get score() {

			var s = {
				hubs: {
					hacked: state.hackedHubCount,
					goal: state.settings.hubDownTarget
				},
				hackers: {
					locked: state.lockoutCount,
					live: state.liveInsCount
				}
			};
			log("Current score is: ", colors.hilite);
			log(s);
			return s;
		},
		// 'score': {
		// 	hubs: {
		// 		hacked: state.hackedHubCount,
		// 		goal: state.settings.hubDownTarget
		// 	},
		// 	hackers: {
		// 		locked: state.lockoutCount,
		// 		live: state.liveInsCount
		// 	}
		// },

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

		'playerLogs': {},

		//'teamPickMethod': 'alternate',
		'teams': {
			get pickMethod() {
				return state.settings.teamPickMethod;
			},
			//'pickMethod': settings.teamPickMethod,
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
			},
			insIfNoHash: function() {
				this.lastAssigned = 'ins';
				log('No hash so new player set to ' + this.lastAssigned, colors.standout);
				return this.lastAssigned;
			}
		},

		getTeam: function(hash) {
			var teams = state.teams;
			var pickedTeam = teams['default'];
			log("teamhash is: " + hash);

			if (teams.hasOwnProperty(hash)) { //teams[hash] !== undefined) {
				log("Set teamhash " + hash + " found. Setting to that team.");
				pickedTeam = teams[hash];
				teams.lastAssigned = pickedTeam; //so next unassigned player will join other team
			} else {
				pickedTeam = teams[teams.pickMethod](); //teams['default'];
			}
			log('Picked team is: ' + pickedTeam);
			return pickedTeam;
		},

		'hubs': [], //hubs

		setupHubs: function() {

			log("Setup hubs called", colors.err);

			state.hubs.getByName = function(hubName) {
				for (var i = 0; i < state.hubs.length; i++) {
					if (state.hubs[i].name === hubName) {
						return state.hubs[i];
					}
				}
			};

			hubs.forEach(function(hub, i) {
				//for (i in hubs) {
				//state.hubs.forEach(function(hub){
				//var hub = hubs[i];

				//only push enabled hubs - easy activation deactivation for testing
				if (hub.enabled) {


					util.myExtend(hub, hubStartStats);

					state.hubs.push(hub);

					hub['index'] = state.hubs.indexOf(hub);
					hub['id'] = +hub.index + 1;
				}

			});

		},

		getPlayerBySocketID: function(sID) {
			log("Searching for player with socketID " + sID);
			var toReturn;

			for (var uID in state.players) {
				if (state.players[uID].socketID == sID) {
					toReturn = state.players[uID];
					break;
				}
			}

			if (toReturn === undefined) {
				log("ERROR: Player not found by SocketID", colors.err);
			}

			return toReturn;
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
			for (var p in state.players) {
				log("Team for " + state.players[p].userID + " is " + state.players[p].team);
				if (state.players[p].team == t) {
					existingTeamMembers++;
				}
			}

			log('Team size is ' + existingTeamMembers, colors.standout);
			return existingTeamMembers;
		},

		get liveHubCount() {
			var liveHubs = 0;
			state.hubs.forEach(function(hub) {
				//for (var h in hubs) {
				if (hub.live) {
					//if (hubs[h].live) {
					liveHubs++;
				}
			});
			return liveHubs;
		},

		get hackedHubCount() {
			var hackedHubs = 0;
			state.hubs.forEach(function(hub) {
				//for (var h in hubs) {
				if (hub.live) {
					//if (hubs[h].live) {

				} else {
					hackedHubs++;
				}
			});
			return hackedHubs;
		},

		get liveInsCount() {
			var count = 0;

			for (var i in state.players) {
				var p = state.players[i];
				if (p.team == 'ins' && !p.lockedOut) {
					count++;
				}
			}
			log('Live ins count is ' + count);
			return count;

		},

		get lockoutCount() {
			var count = 0;

			for (var i in state.players) {
				var p = state.players[i];
				if (p.team == 'ins' && p.lockedOut) {
					count++;
				}
			}
			log('Ins locked out count is ' + count);
			return count;
		},

		//startingHubs: this.liveHubCount,
		downHubs: 0,

		// liveHubCount: function() {
		// 	var liveHubs = 0;
		// 	hubs.forEach(function(hub)) {
		// 		//for (var h in hubs) {
		// 		if (hub.live) {
		// 			//if (hubs[h].live) {
		// 			liveHubs++;
		// 		}
		// 	}
		// 	return liveHubs;
		// },

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