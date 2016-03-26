module.exports = function(users, _emit) { //, _socket) {

	var include = require('./moduleLoader.js');
	var gameState = include('gameState');

	var emitTo = _emit;
	var socket = emitTo.storedSocket;
	// log("Stored socket is");
	// log(emitModule.storedSocket);

	var user = {
		//stores properties of new user
		create: function(team) {

			var setTypeFromTeam = function(teamName) {
				switch (teamName) {
					case 'gov':
						return 'agent';
					case 'ins':
					default:
						return 'suspect';
				}
			};

			var teamNumber = gameState.getTeamSize(team) + 1;

			var userProps = {
				'socketID': socket.id,
				'index': gameState.playerCount,
				//'name': '',
				'team': team,
				//var teamNumber = getTeamSize(team) + 1,
				'numberOnTeam': teamNumber,
				'type': setTypeFromTeam(team),
				'userID': team + teamNumber.toString(),
				'connected': false,
				'trackActive': false,
				'svcCheckComplete': false,
				'playStarted': false,
				'warned': {
					'50': false,
					'100': false,
					'200': false
				},
				'locationData': [],
				'lastLocRequest': {},
				//'hubAttacking': {},
				'captureData': {
					//# of responses received to fast capture pings
					resCount: 0,
					//# of times enough agents to capture were in range
					captureCount: 0
				},
				'goneDark': false,
				'lockedOut': false,
			};

			util.myExtend(user, userProps);
			// for (prop in userProps) {
			// 	user[prop] = userProps[prop];
			// }

			log('Created player: ', colors.green);
			log(user);

		},
		//switches user socket when reconnecting to server
		update: function(newEmit) {
			emitTo = newEmit;
			socket = emitTo.storedSocket;
			user['socketID'] = socket.id;
			log(user.userID + " socket updated to: " + socket.id, colors.green);
		},
		//adds user to team
		addToTeam: function(teamName) { //,isNewPlayer)
			socket.join(teamName);
			log('User ' + user.userID + ' added to ' + teamName, colors.orange);
		},

		removeFromTeam: function(teamName) {
			socket.leave(teamName);
			log('User ' + user.userID + ' removed from ' + teamName, colors.orange);
		},

		getLastLocation: function() {
			if (user.locationData.length > 0) {
				return user.locationData[0];
			} else {
				return;
			}
		},

		getLocationData: function(sinceTime) { //limit) {
			var locArray = [];
			if (sinceTime !== undefined) {
				// for (i in user.locationData) {
				for (var i = 0; i < user.locationData.length; i += gameState.settings.dataSkipInterval) {
					//log(user.locationData);
					if (user.locationData[i].time > sinceTime) {
						locArray.push(user.locationData[i]);
					} else {
						//break;
					}
				}
			} else {
				//*****NOTE: NO SKIP HERE
				locArray = user.locationData;
			}

			log(locArray.length + " of " + user.locationData.length + " LocDataPoints being sent to Gov", colors.standout);

			return locArray;
		},

		getHubsByDistance: function() {

			log("Finding hubs by distance to " + user.userID, colors.standout);

			var hubsObj = {};

			var hubs = gameState.hubs;

			gameState.hubs.forEach(function(hub,i){
				if (hub.live) {
					hubsObj[hub.name] = {
						"latitude": hub.lat,
						"longitude": hub.lng //,
						//"name": hubs[i].name
					};
				}
			});

			var sortedHubs = geolib.orderByDistance({
				"latitude": user.locationData[0].lat,
				"longitude": user.locationData[0].lng
			}, hubsObj);

			for (var i=0; i<sortedHubs.length;i++){
				// var matchingHub = hubs[sortedHubs[i].key];
				log("Looking to match hub " + sortedHubs[i].key);
				var matchingHub = hubs.getByName(sortedHubs[i].key);
				log("Match hub found! " + matchingHub.name,colors.bgYellow);
				for (prop in matchingHub) {
					sortedHubs[i][prop] = matchingHub[prop];
				}
			}
		
			// for (i in hubs) {
			// 	//is key same as index? Testing killing hub 3 seemed to work
			// 	if (hubs[i].live) {
			// 		hubsObj[i] = {
			// 			"latitude": hubs[i].lat,
			// 			"longitude": hubs[i].lng //,
			// 			//"name": hubs[i].name
			// 		};
			// 	}

			// }

			// var sortedHubs = geolib.orderByDistance({
			// 	"latitude": user.locationData[0].lat,
			// 	"longitude": user.locationData[0].lng
			// }, hubsObj);

			// for (i in sortedHubs) {
			// 	var matchingHub = hubs[sortedHubs[i].key];
			// 	for (prop in matchingHub) {
			// 		sortedHubs[i][prop] = matchingHub[prop];
			// 	}
			// }

			log("Sorted hubs by distance: ");
			log(sortedHubs);

			return sortedHubs;

		},

		setDark: function() {
			log("No locUpdate from client " + user.userID, colors.red);
			log("Player " + user.userID + " has gone dark.", colors.err);
			user.goneDark = true;
			user.trackActive = false;
			user.stopHacking();
		},

		stopHacking: function(attackedHub) {

			var clearHack = function(aHub) {

				delete user.hubAttacking;
				//user.hubAttacking = {};

				aHub.updateAttackingPlayers(user, 'remove');

				if (aHub.attackerCount < 1) {
				//if (aHub.attackingPlayers.length < 1) {
					aHub.alertState = 0;
					log("Fully clearing hack for " + aHub.name, colors.standout);
					emitTo.team('gov', 'hubAttackStopped', {
						hubName: aHub.name,
						hubID: aHub.id,
						hubIndex: aHub.index, //res.hubIndex,
						hubAlertState: aHub.alertState,
						latestHubInfo: aHub
					});
				}
			};

			if (user.hubAttacking){
			clearHack(user.hubAttacking);
			}

			// if (attackedHub !== undefined) {
			// 	clearHack(attackedHub);
			// } else {

			// 	//for (var h in gameState.hubs) {
			// 	gameState.hubs.forEach(function(hub) {
			// 		//var aHub = gameState.hubs[h];
			// 		for (var p in hub.attackingPlayers) {
			// 			if (user.userID == hub.attackingPlayers[p]) {
			// 				clearHack(hub);
			// 			}
			// 		}
			// 	});
			// }
			//};
		},

		clearDark: function() {
			log("Player " + user.userID + " active again.", colors.bgGreen);
			user.goneDark = false;
			user.trackActive = true;
		},

		lockout: function() {
			user.lockedOut = true;
			user.stopHacking();
			log("Player " + user.userID + "lockout status is: " + user.lockedOut, colors.orange);
		},

		disconnect: function() {
			user.socketID = '';
			user.connected = false;
			user.setDark();
			log(user.userID + ' has been disconnected.', colors.bgYellow);
		}

	};

	return user;
};