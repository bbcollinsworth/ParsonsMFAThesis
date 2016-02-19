var colors = require('colors');
var log = require('./logWithColor.js');

module.exports = function(users, _socket) {

	var socket = _socket;

	var getTeamSize = function(t) {
		var existingTeamMembers = 0;

		for (u in users) {
			if (users[u].team == t) {
				existingTeamMembers++;
			}
		}

		log('Team size is ' + existingTeamMembers);
		return existingTeamMembers;
	};

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

			var teamNumber = getTeamSize() + 1;

			var userProps = {
				'socketID': socket.id,
				'index': users.length,
				//'name': '',
				'team': team,
				//var teamNumber = getTeamSize(team) + 1,
				'numberOnTeam': teamNumber,
				'type': setTypeFromTeam(user.team),
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
				'captureData': {
					//# of responses received to fast capture pings
					resCount: 0,
					//# of times enough agents to capture were in range
					captureCount: 0
				},
				'lockedOut': false,
			};

			for (prop in userProps){
				user[prop] = userProps[prop];
			}
			// //will this work?
			// user['socketID'] = socket.id;
			// user['index'] = users.length;
			// //user['name'] = '';
			// user['team'] = team;
			// var teamNumber = getTeamSize(team) + 1;
			// user['numberOnTeam'] = teamNumber;
			// user['type'] = setTypeFromTeam(user.team);
			// user['userID'] = team + teamNumber.toString();
			// user['connected'] = false;
			// user['trackActive'] = false;
			// user['playStarted'] = false;
			// user['warned'] = {
			// 	'50': false,
			// 	'100': false,
			// 	'200': false
			// };
			// user['locationData'] = [];
			// user['captureData'] = {
			// 	//# of responses received to fast capture pings
			// 	resCount: 0,
			// 	//# of times enough agents to capture were in range
			// 	captureCount: 0
			// };
			// user['lockedOut'] = false;
			// userID = ''; //ins1

			log('Created player: ', colors.green);
			console.log(user);

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

		getLocationData: function(limit) {
			var locArray = [];
			if (limit !== undefined) {
				for (i in user.locationData) {
					if (i < limit) {
						locArray.push(user.locationData[i]);
					} else {
						break;
					}
				}
			} else {
				locArray = user.locationData;
			}

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