var colors = require('colors');
var log = require('./logWithColor.js');

module.exports = function(users, _socket) {
	
	var socket = _socket;

	function getTeamSize(t) {
		var existingTeamMembers = 0;

		for (u in users) {
			if (users[u].team == t) {
				existingTeamMembers++;
			}
		}

		log('Team size is ' + existingTeamMembers);
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
			log(user);

		},
		//switches user socket when reconnecting to server
		update: function(newSocket){
			socket = newSocket;
			user['socketID'] = socket.id;
			log(user.userID + " socket updated to: " + socket.id,colors.green);
		},
		//adds user to team
		addToTeam: function(teamName,isNewPlayer) {
			socket.join(team);
			log('User ' + user.id + ' added to ' + team,colors.green);
		}
	};

	return user;
};
