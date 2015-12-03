var app = {};
var socket;
var gameState = {
	connected: false,
	mapReady: false
};

var govHash, insHash;

app.init = function() {
	$('#alertBodyText').html('<p>Connecting...</p>');
	parseHash();
	initMap();
	socket = io.connect();
	readyCheck();
};

function parseHash() {
	var thisHash = location.hash;
	var parsedHash = thisHash.split("&");
	console.log("Hash:");
	console.log(parsedHash[0]);
	console.log(parsedHash[1]);

	var teamHash = parsedHash[0];
	var uniqueHash = parsedHash[1];
	localStorage.setItem("teamHash", teamHash);
	localStorage.setItem("uniqueID", uniqueHash);


	// switch (parsedHash[0]) {
	//     case govHash:
	//         gameState['team'] = 'gov';
	//         break;
	//     case insHash:
	//     default:
	//         gameState['team'] = 'ins';
	//         break;
	// }
}

function emit(tag, emitObj) {
	emitObj['tag'] = tag;
	socket.emit('clientMsg', emitObj);
	console.log('Sending ' + tag + ' to server');
}

function initMap() {
	//initializing mapbox.js / leaflet map
	L.mapbox.accessToken = 'pk.eyJ1IjoiZnVja3lvdXJhcGkiLCJhIjoiZEdYS2ZmbyJ9.6vnDgXe3K0iWoNtZ4pKvqA';

	var map = L.mapbox.map('map', 'fuckyourapi.o7ne7nmm', {
			zoomControl: false
		})
		.setView([40.734801, -73.998799], 16)
		.on('ready', function() {
			gameState.mapReady = true;
			console.log("Map is initialized!");
			//sendMapReady();
		});

	//to override relative positioning from leaflet style
	$('#map').css({
		"position": "static"
	});
}

function readyCheck() {
	if (gameState.connected && gameState.mapReady) {
		emit('clientReady', {});
	} else {
		var readyCounter = 60;
		//off for demo
		//mobileAlert("CONNECTING...");

		var waitForReady = setInterval(function() {

			console.log("Waiting for ready state...");
			if (gameState.connected && gameState.mapReady) {
				emit('clientReady', {});
				console.log("Ready. Alerting server...");
				//closeAlert();
				//console.log("Close alert called");
				clearInterval(waitForReady);
			} else if (readyCounter > 0) {
				readyCounter--;
				if (!gameState.connected) {
					console.log("Waiting for connection.");
				}
				if (!gameState.mapReady) {
					console.log("Waiting for map.");
				}

				console.log(readyCounter * 0.5 + "seconds");
			} else {
				console.log("Not ready. Reloading");
				clearInterval(waitForReady);
				window.location.reload();
			}
		}, 500);

	}
}

function sendMapReady() {
	console.log("Map is initialized!");

	if (gameState.connected) {
		console.log("Connected. Alerting server...");
		emit('mapLoaded', {});
	} else {
		var connectCounter = 60;
		//off for demo
		//mobileAlert("CONNECTING...");

		var waitForConnect = setInterval(function() {

			console.log("Waiting for server...");
			if (gameState.connected) {
				emit('mapLoaded', {});
				console.log("Connected. Alerting server...");
				//closeAlert();
				//console.log("Close alert called");
				clearInterval(waitForConnect);
			} else if (connectCounter > 0) {
				connectCounter--;
				console.log(connectCounter * 0.5 + "seconds");
			} else {
				console.log("No connection. Reloading");
				clearInterval(waitForConnect);
				window.location.reload();
			}
		}, 500);
	}
}

app.init();

//INCOMING SOCKET FUNCTIONS
socket.on('serverMsg', function(res, err) {

	var handleServerMsg = {

		connected: function(){
			gameState.connected = true;
			console.log("Connected to server");
			$('#alertBodyText').html('<p>Connected to server. Hello, Jasmine!</p>');
		},

		playerTypeCheck: function(){
			var storedUserFound = false;
			var allIDs = res.userIDs;
			if (localStorage.userID !== undefined) {
				for (var i in allIDs) {
					if (localStorage.userID == allIDs[i]) {
						console.log("Stored User Found!:" + allIDs[i]);
						storedUserFound = true;
						break;
					}
				}
			}
		}
	};

	handleServerMsg[res.tag]();

	// switch (res.tag) {

	// 	case 'connected':
	// 		gameState.connected = true;
	// 		console.log("Connected to server");
	// 		$('#alertBodyText').html('<p>Connected to server. Hello, Jasmine!</p>');
	// 		break;

	// 	case 'playerTypeCheck':
	// 		var storedUserFound = false;
	// 		var allIDs = res.userIDs;
	// 		if (localStorage.userID !== undefined) {
	// 			for (var i in allIDs) {
	// 				if (localStorage.userID == allIDs[i]) {
	// 					console.log("Stored User Found!:" + allIDs[i]);
	// 					storedUserFound = true;
	// 					break;
	// 				}
	// 			}
	// 		}
	// 		break;

	// }
});