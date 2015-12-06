var app = {};
var socket;

var govHash, insHash;
var teamHash, uniqueHash;
var vibrate, geo, storage;

var clientState = {
	connected: false,
	mapLoaded: false,
	readyCheckRunning: false,
	ready: false,
	features: {
		geolocation: {
			title: 'Geolocation',
			supported: false,
			ready: false,
			setup: navigator.geolocation
		},
		vibrate: {
			title: 'Vibration',
			supported: false,
			ready: true, //no prep required
			setup: function(vibrateLength) {
				try {
					navigator.vibrate = navigator.vibrate ||
						navigator.webkitVibrate ||
						navigator.mozVibrate ||
						navigator.msVibrate;
					navigator.vibrate(vibrateLength);
					msg("Vibrate successful!");
				} catch (err) {
					msg(err.message);
				}
			}
		},
		localstorage: {
			title: 'Local Storage',
			supported: false,
			ready: true, //no prep required
			setup: localStorage
		}
	}
};


var msg = function(text) {
	$('#alertBodyText').html('<p>' + text + '</p>');
};

var attachEvents = function() {
	$('#app').on('ready', function() {
		readyCheckRunning = false;
		emit('clientReady', {});
	});
};
//alt ready function
app.ready = function() {
	readyCheckRunning = false;
	emit('clientReady', {});
};

var svcCheckList = function() {

	var list = $('<ul />', {
		'data-role': "listview", //collapsibleset",
		'id': "svcCheckList"
	});


	var alertBody = $('#alertBodyText');

	//alertBody.html('');

	alertBody.html(list);
	alertBody.trigger('create');

	//$('#svcCheckList').collapsibleset();

	var createItem = function(featureName, supported, ready) {

		var icon = "";
		if (!supported) {
			icon = "ui-icon-delete"
		} else if (!ready) {
			icon = "ui-icon-alert"
		} else {
			icon = "ui-icon-check"
		};

		var listItem = $('<li />', {
			//'data-role': "collapsible",
			'data-inset': "true",
			'data-iconpos': "right",
			'class': "feature-list ui-corner-all " + icon + " ui-btn-icon-right" //,
			//'html': itemName + itemHelpText
		});

		$('#svcCheckList').append(listItem);

		//alertBody.append(listItem);

		var itemName = $('<h3 />', {
			'text': featureName,
			'class': "feature-title"
		});
		console.log(itemName.toString());
		var itemHelpText = $('p />', {
			'text': "Help text..."
		});

		listItem.append(itemName, itemHelpText);
		//listItem.append(itemHelpText);

		//return listItem;
	};

	var createList = function(featuresList) {

		// var list = $('<div />', {
		// 	'data-role': "collabsibleset",
		// 	'id': "svcCheckList"
		// });
		//var list = ;
		$.each(featuresList, function(key, featureObj) {
			//list.append(createItem(value));
			createItem(featureObj.title,featureObj.supported,featureObj.ready);
		});

		$('#svcCheckList').listview("refresh");
		//$('#svcCheckList').collapsibleset("refresh");
		// console.log("Features checklist created: ");
		// console.log(list);
	};

	//var finalList = 
	createList(clientState.features);
	// createList({
	// 	1: 'Vibration',
	// 	2: 'Geolocation',
	// 	3: 'Local Storage'
	// });

	// var finalList = $('<div />', {
	// 	'data-role': "collabsibleset",
	// 	'id': "svcCheckList",
	// 	'html': createList({1: 'Vibration',2: 'Geolocation', 3: 'Local Storage'})
	// });

	//return finalList;
};

var initServices = function(argument) {

	var supportCheck = function(feature) {
		var thisFeature = clientState.features[feature];
		try {
			thisFeature.supported = Modernizr[feature]; //feature in navigator;
			console.log("Raw var for " + feature + ": " + (Modernizr[feature]));
		} catch (err) {
			thisFeature = {
				supported: false
			};
			console.log(err.message);
		}

		if (thisFeature.supported) {
			var supportedMsg = feature + " supported.";
			$('#footerText').append('<p>' + supportedMsg + '</p>');
			console.log(supportedMsg);
			//need to return feature variable
			return thisFeature.setup;
		} else {
			var unsupportedMsg = feature + " not supported.";
			$('#footerText').append('<p>' + unsupportedMsg + '</p>');
			console.log(unsupportedMsg);
			return function() {
				console.log("Error: " + feature + " not supported. skipping...");
				return;
			};
		}
	};

	vibrate = supportCheck('vibrate');
	console.log(vibrate);
	vibrate(1000);

	geo = supportCheck('geolocation');
	geo.getCurrentPosition(function(position) {
		console.log('Position: ' + position.coords.latitude + ', ' + position.coords.longitude);
	});
	console.log("Location Svcs initialized");

	storage = supportCheck('localstorage');
};

app.init = function() {
	msg('Connecting...');
	initServices();
	parseHash(); //check URL hash for team and playerID data
	initMap(); //initialize map
	socket = io.connect(); //connect to socket server
	msg("Initializing socket");
	attachEvents(); //attach event listeners
	readyCheck(); //start checking for ready state
};

function parseHash() {
	msg('Parsing hash...');
	var thisHash = location.hash;
	msg('Hash is ' + thisHash);
	var parsedHash = thisHash.split("&");
	parsedHash[0] = parsedHash[0].slice(1, 100);
	msg('Parsed hash is ' + parsedHash[0] + ', ' + parsedHash[1]);
	console.log("Hash:");
	console.log(parsedHash[0]);
	console.log(parsedHash[1]);

	teamHash = parsedHash[0];
	uniqueHash = parsedHash[1];
	//NEED TO DO LOCALSTORAGE CHECK
	if (clientState.features.localstorage.supported) {
		localStorage.setItem("teamHash", teamHash);
		localStorage.setItem("uniqueID", uniqueHash);
	}
}

function emit(tag, emitObj) {
	emitObj['tag'] = tag;
	socket.emit('clientMsg', emitObj);
	console.log('Sending ' + tag + ' to server');
}

function initMap() {
	msg("Initializing map");
	//initializing mapbox.js / leaflet map
	L.mapbox.accessToken = 'pk.eyJ1IjoiZnVja3lvdXJhcGkiLCJhIjoiZEdYS2ZmbyJ9.6vnDgXe3K0iWoNtZ4pKvqA';

	var map = L.mapbox.map('map', 'fuckyourapi.o7ne7nmm', {
			zoomControl: false
		})
		.setView([40.734801, -73.998799], 16)
		.on('ready', function() {
			clientState.mapLoaded = true;
			console.log("Map is initialized!");
			//sendMapReady();
		});

	//to override relative positioning from leaflet style
	$('#map').css({
		"position": "static"
	});
}

function readyCheck() {
	clientState.readyCheckRunning = true;

	msg("Checking if ready");
	if (clientState.connected && clientState.mapLoaded) {
		clientState.ready = true;
		$('#app').trigger('ready');
		// emit('clientReady', {});
	} else {
		var readyCounter = 60;
		//mobileAlert("CONNECTING...");

		var waitForReady = setInterval(function() {

			console.log("Waiting for ready state...");
			if (clientState.connected && clientState.mapLoaded) {
				clientState.ready = true;
				$('#app').trigger('ready');
				//emit('clientReady', {});
				//closeAlert();
				//console.log("Close msg called");
				clearInterval(waitForReady);
			} else if (readyCounter > 0) {
				readyCounter--;
				if (!clientState.connected) {
					console.log("Waiting for connection.");
				}
				if (!clientState.mapLoaded) {
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

			svcCheckList();

			//$('#alertBodyText').append(svcCheckList());
		}

	};

	handleServerMsg[res.tag]();


});