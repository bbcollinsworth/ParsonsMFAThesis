var app = {};
var socket;

var player = {
	pos: {}
};

var msg = function(text) {
	$('#alertBodyText').html('<p>' + text + '</p>');
};

var attachEvents = function() {
	$('#app').on('initialized', function() {
		readyCheckRunning = false;
		emit('clientInitialized', {});
	});

	$('#app').on('ready', function() {
		//readyCheckRunning = false;
		// localStorage.setItem('svcCheckComplete',true);
		emit('readyToPlay', {});
	});

	$('#searchButton').off('click').on('click', function() {
		msg('Ping button clicked');
		emit('findSuspects', {
			existingLocData: []
		});
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

	var storeAndSendLocation = function(p) {
		player.pos = {
			lat: p.coords.latitude,
			lng: p.coords.longitude,
			time: Date.now()
		};

		emit('locationUpdate', {
			locData: player.pos
		});
	};

	var renderHubs = function(hubData){
		$.each(hubData, function(i, hub) {
			L.circle([hub.lat, hub.lng], hub.hackRange).addTo(map);
		});
	};

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
		},

		returningReadyCheck: function() {
			if (localStorage.svcCheckComplete) {
				$('#app').trigger('ready');
			} else {
				startup.svcCheck();
			}
		},

		getLocation: function(callback) {
			geo.getCurrentPosition(function(position) {
				console.log('Position: ' + position.coords.latitude + ', ' + position.coords.longitude);

				storeAndSendLocation(position);

				if (callback !== undefined) {
					callback();
				}
			});
		},

		trackLocation: function() {
			geo.watchPosition(function(position) {
				console.log('Latest Watched Position: ' + position.coords.latitude + ', ' + position.coords.longitude);

				storeAndSendLocation(position);

			});
		},

		hubStartData: function(){
			renderHubs(res.hubs);
		},

		suspectData: function() {
			console.log('Suspect data is: ');
			console.log(res.locData);

			var suspectMarker = {
				'marker-size': 'large',
				'marker-symbol': 'pitch',
				'marker-color': '#ff0000'
			};

			var agentMarker = {
				'marker-size': 'large',
				'marker-symbol': 'police',
				'marker-color': '#0000ff'
			};

			$.each(res.locData, function(userID, player) {

				var latestPos = player.locData[0];
				var markerIcon = {};

				switch (player.team) {
					case 'gov':
						markerIcon = agentMarker;
						break;
					case 'ins':
					default:
						markerIcon = suspectMarker;
						break;
				}

				L.marker([latestPos.lat, latestPos.lng], {
					icon: L.mapbox.marker.icon(markerIcon)
				}).addTo(map);
			});

		}
	};

	handleServerMsg[res.tag]();


});