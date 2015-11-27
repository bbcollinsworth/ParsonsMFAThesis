
module.exports = function(io) {
	var socket;

	return {
		//SHOULDN'T USE: this will globally set socket!
		setSocket: function(sock){
			socket = sock;
		},
		//SHOULDN'T USE: this will go to globally set socket!
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


// var io;
// //var socket;

// //passes io module to emit
// exports.start = function(_io) {
// 	io = _io;
// };

// //passes socket.id after user connection
// // exports.setSocket = function(_sock) {
// // 	socket = _sock;
// // };

// //emits to this socket.id -- but probably won't work universal
// // exports.socket = function(tag, emitObj) {
// // 	emitObj['tag'] = tag;
// // 	io.to(socket.id).emit('serverMsg', emitObj);
// // };

// //emits to a specified user
// exports.user = function(user, tag, emitObj) {
// 	emitObj['tag'] = tag;
// 	io.to(user.socketID).emit('serverMsg', emitObj);
// };

// //emits to a specified team
// exports.team = function(team, tag, emitObj) {
// 	emitObj['tag'] = tag;
// 	io.to(team).emit('serverMsg', emitObj);
// };

// //broadcast emit to everyone
// exports.all = function(tag, emitObj) {
// 	emitObj['tag'] = tag;
// 	io.emit('serverMsg', emitObj);
// };