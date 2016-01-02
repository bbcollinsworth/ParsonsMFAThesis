var app = {};
var socket;

var msg = function(text) {
	$('#alertBodyText').html('<p>' + text + '</p>');
};

var attachEvents = function() {
	$('#app').on('ready', function() {
		readyCheckRunning = false;
		emit('clientInitialized', {});
	});
};

//alt ready function -- NOT CURRENTLY IN USE
// app.ready = function() {
// 	readyCheckRunning = false;
// 	emit('clientInitialized', {});
// };

app.init = function() {
	msg('Connecting...');
	startup.initServices();
	startup.parseHash(); //check URL hash for team and playerID data
	startup.initMap(); //initialize map
	startup.connectToServer(); //connect to socket server
	//socket = io.connect(); //alt connect to socket server
	//msg("Initializing socket");
	attachEvents(); //attach event listeners
	startup.readyCheck(); //start checking for server and map loading
};


function emit(tag, emitObj) {
	emitObj['tag'] = tag;
	socket.emit('clientMsg', emitObj);
	console.log('Sending ' + tag + ' to server');
}


app.init();

//INCOMING SOCKET FUNCTIONS
socket.on('serverMsg', function(res, err) {

	var handleServerMsg = {

		connected: function() {
			clientState.connected = true;
			console.log("Connected to server");
			msg('Connected to server.');
			vibrate(1000); // vibrate for check
		},

		//1sec for new/returning player + teamHash, uniqueID
		playerTypeCheck: function() {
			var storedUserFound = false;
			var allIDs = res.userIDs;
			//check for stored id matching existing player:
			if (localStorage.userID !== undefined) {
				for (var i in allIDs) {
					if (localStorage.userID == allIDs[i]) {
						console.log("Stored User Found!:" + allIDs[i]);
						storedUserFound = true;
						break;
					}
				}
			}

			if (storedUserFound) { //send returning player
				emit('returningPlayer', {
					userID: localStorage.userID
				});
			} else { //send new player
				emit('newPlayer', {
					teamHash: teamHash,
					uniqueID: uniqueHash
				});
			}
		},

		newUserID: function() {
			if (clientState.features.localstorage.supported) {
				localStorage.setItem("userID", res.newID);
				console.log("UserID stored locally as: " + localStorage.userID);
			} else {
				console.log("Warning: localStorage unsupported. ID not stored.");
			}
			msg('Hello Player ' + res.newID + '!');

			startup.svcCheck();

			//$('#alertBodyText').append(svcCheckList());
		}

	};

	handleServerMsg[res.tag]();


});