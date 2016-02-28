// var colors = require('colors');
// var log = require('./logWithColor.js');

module.exports = function(users, _socket) {

	var include = require('./moduleLoader.js');

	var colors = include('colors');
	var log = include('log');
	var gameState = include('gameState');
	// log("GameState from userModule is: ");
	// log(gameState);

	var socket = _socket;

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
				'index': users.length,
				//'name': '',
				'team': team,
				//var teamNumber = getTeamSize(team) + 1,
				'numberOnTeam': teamNumber,
				'type': setTypeFromTeam(team),
				'userID': team + teamNumber.toString(),
				'connected': false,
				'trackActive': false,
				'playStarted': false,
				'warned': {
					'50': false,
					'100': false,
					'200': false
				},
				'locationData': [],
				'lastLocRequest': {},
				'captureData': {
					//# of responses received to fast capture pings
					resCount: 0,
					//# of times enough agents to capture were in range
					captureCount: 0
				},
				'goneDark': false,
				'lockedOut': false,
			};

			for (prop in userProps) {
				user[prop] = userProps[prop];
			}

			log('Created player: ', colors.green);
			log(user);

		},
		//switches user socket when reconnecting to server
		update: function(newSocket) {
			socket = newSocket;
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

		getLocationData: function(sinceTime) { //limit) {
			var locArray = [];
			if (sinceTime !== undefined) {
				for (i in user.locationData) {
					log(user.locationData);
					if (user.locationData[i].time > sinceTime) {
						locArray.push(user.locationData[i]);
					} else {
						//break;
					}
				}
			} else {
				locArray = user.locationData;
			}
			// if (limit !== undefined) {
			// 	for (i in user.locationData) {
			// 		if (i < limit) {
			// 			locArray.push(user.locationData[i]);
			// 		} else {
			// 			break;
			// 		}
			// 	}
			// } else {
			// 	locArray = user.locationData;
			// }
			log(locArray.length + " of " + user.locationData.length + " LocDataPoints being sent to Gov",colors.standout);

			return locArray;
		},

		lockout: function() {
			user.lockedOut = true;
			log("Player " + user.userID + "lockout status is: " + user.lockedOut, colors.orange);
		},

		disconnect: function() {
			user.socketID = '';
			user.connected = false;
			log(user.userID + ' has gone dark', colors.orange);
		}

	};

	return user;
};