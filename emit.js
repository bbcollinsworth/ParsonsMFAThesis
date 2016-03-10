module.exports = function(io, _socket) {

	var s = {
		'storedSocket': _socket,
		//emits to THIS user (i.e. socket.id)
		socket: function(tag, emitObj) {
			emitObj['tag'] = tag;
			//io.to(socket.id).emit('serverMsg', emitObj);
			_socket.emit('serverMsg', emitObj);
			log('Sending ' + tag + ' to ' + _socket.id, colors.sendingMsg);
		},

		socketVol: function(tag, emitObj) {
			emitObj['tag'] = tag;
			//io.to(socket.id).emit('serverMsg', emitObj);
			_socket.volatile.emit('serverMsg', emitObj);
			//console.
			log('Sending ' + tag + ' to ' + _socket.id, colors.sendingMsg);
		},
		//emits to a specified user
		user: function(user, tag, emitObj) {
			emitObj['tag'] = tag;
			io.to(user.socketID).emit('serverMsg', emitObj);
			//console.
			log('Sending ' + tag + ' to user ' + user.socketID, colors.sendingMsg);
		},
		//emits to a specified team
		team: function(team, tag, emitObj) {
			emitObj['tag'] = tag;
			io.to(team).emit('serverMsg', emitObj);
			//console.
			log('Sending ' + tag + ' to team ' + team, colors.sendingMsg);
		},
		//broadcast emit to everyone
		all: function(tag, emitObj) {
			emitObj['tag'] = tag;
			io.emit('serverMsg', emitObj);
			//console.
			log('Sending ' + tag + ' to all players', colors.sendingMsg);
		}
	};

	return s;
};