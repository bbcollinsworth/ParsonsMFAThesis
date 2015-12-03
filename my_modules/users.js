var colors = require('colors');
var log = require('./logWithColor.js');

module.exports = function(users, _socket, _log) {
	
	var socket = _socket;

	function getTeamSize(t) {
		var existingTeamMembers = 0;

		for (u in users) {
			if (users[u].team == t) {
				existingTeamMembers++;
			}
		}
		// users.forEach(function(u) {
		// 	if (u.team == t) {
		// 		teamMembers++;
		// 	}
		// });
		console.log('Team size is ' + existingTeamMembers);
		return existingTeamMembers;
	}

	var user = {
		//stores properties of new user
		create: function(team) {
			//will this work?
			user['socketID'] = socket.id;
			user['index'] = users.length;
			//user['name'] = '';
			user['team'] = team;
			var teamNumber = getTeamSize(team) + 1;
			user['numberOnTeam'] = teamNumber;
			user['userID'] = team + teamNumber.toString();
			user['locationData'] = [];
			user['captureData'] = {
				//# of responses received to fast capture pings
				resCount: 0,
				//# of times enough agents to capture were in range
				captureCount: 0
			};
			user['lockedOut'] = false;
			userID = 'ins1';

			log('Created player: ',colors.green);
			console.log(user);

		},
		//switches user socket when reconnecting to server
		update: function(newSocket){
			socket = newSocket;
			user['socketID'] = socket.id;
			console.log(user.userID + " socket updated to: " + socket.id,colors.green);
		},
		//adds user to team
		addToTeam: function(teamName,isNewPlayer) {
			socket.join(team);
			log('User ' + user.id + ' added to ' + team,colors.green);
		}
	};

	return user;
};


// var user = module.exports = function(users, socket) {
// 	//var socket;

// 	//users = [];
// 	var socketID, index, team, numberOnTeam, userID;
// 	var locationData = [];
// 	var captureData = {
// 		//# of responses received to fast capture pings
// 		resCount: 0,
// 		//# of times enough agents to capture were in range
// 		captureCount: 0
// 	};
// 	var lockedOut = false;

// 	function getTeamSize(t) {
// 		var existingTeamMembers = 0;
// 		for (u in users) {
// 			if (u.team == t) {
// 				teamMembers++;
// 			}
// 		}
// 		// users.forEach(function(u) {
// 		// 	if (u.team == t) {
// 		// 		teamMembers++;
// 		// 	}
// 		// });

// 		return existingTeamMembers;
// 	}

// 	var get = function(property) {
// 		return user[property];
// 	};

// 	return {
// 		get: function(property) {
// 			return user[property];
// 		},
// 		create: function(team) {
// 			//will this work?
// 			user['socketID'] = socket.id;
// 			user['index'] = users.length;
// 			//user['name'] = '';
// 			user['team'] = team;
// 			var teamNumber = getTeamSize(team) + 1;
// 			user['numberOnTeam'] = teamNumber;
// 			user['userID'] = team + teamNumber.toString();
// 			user['locationData'] = [];
// 			user['captureData'] = {
// 				//# of responses received to fast capture pings
// 				resCount: 0,
// 				//# of times enough agents to capture were in range
// 				captureCount: 0
// 			};
// 			user['lockedOut'] = false;
// 			userID = 'ins1';

// 			console.log('Created player: ');
// 			console.log(user);

// 			// newUser = {
// 			// 	'socketID': socket.id,
// 			// 	'index': users.length,
// 			// 	'name': ,
// 			// 	'team': team,
// 			// 	'numberOnTeam': ,
// 			// 	'userID': ,
// 			// 	'locationData': [],
// 			// 	'captureData': {
// 			// 		//# of responses received to fast capture pings
// 			// 		resCount: 0,
// 			// 		//# of times enough agents to capture were in range
// 			// 		captureCount: 0
// 			// 	},
// 			// 	'lockedOut': false


// 			// };
// 		},
// 		//emits to THIS user (i.e. socket.id)
// 		addToTeam: function(teamName, isNewPlayer) {
// 			socket.join(team);
// 			console.log('User ' + user.id + ' added to ' + team);
// 		},
// 		'socketID': get('socketID'),
// 		index: get('index'),
// 		team: get('team'),
// 		numberOnTeam: user.numberOnTeam,
// 		'userID': get('userID'),
// 		locationData: user.locationData,
// 		captureData: user.captureData,
// 		lockedOut: user.lockedOut
// 	};
// };