
module.exports = function(io,socket) {
	//var socket;

	return {
		//emits to THIS user (i.e. socket.id)
		socket: function(tag,emitObj){
			emitObj['tag'] = tag;
			io.to(socket.id).emit('serverMsg', emitObj);
			console.log('Sending ' + tag + ' to ' + socket.id);
		},
		//emits to a specified user
		user: function(user, tag, emitObj) {
			emitObj['tag'] = tag;
			io.to(user.socketID).emit('serverMsg', emitObj);
			console.log('Sending ' + tag + ' to user ' + user.socketID);
		},
		//emits to a specified team
		team: function(team, tag, emitObj) {
			emitObj['tag'] = tag;
			io.to(team).emit('serverMsg', emitObj);
			console.log('Sending ' + tag + ' to team ' + team);
		},
		//broadcast emit to everyone
		all: function(tag, emitObj) {
			emitObj['tag'] = tag;
			io.emit('serverMsg', emitObj);
			console.log('Sending ' + tag + ' to all players');
		}
	};
};
