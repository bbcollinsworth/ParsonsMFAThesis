var app = {};
var socket;

// var govHash, insHash;
// var teamHash, uniqueHash;
// var vibrate, geo, storage;



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

// var svcCheckList = function() {

// 	var list = $('<ul />', {
// 		'data-role': "listview", //collapsibleset",
// 		'id': "svcCheckList"
// 	});

// 	var alertBody = $('#alertBodyText');

// 	//alertBody.html('');
// 	alertBody.html(list);
// 	alertBody.trigger('create');

// 	var createItem = function(feature) {

// 		var icon = "";
// 		var helpText = "";

// 		if (!feature.supported) {
// 			icon = "ui-icon-delete";
// 			helpText = feature.noSupportText;
// 		} else if (!feature.ready) {
// 			icon = "ui-icon-alert";
// 			helpText = feature.helpText;
// 			feature.readyTest(); //test for ready state (e.g. ping location)
// 		} else {
// 			icon = "ui-icon-check";
// 			//$("ui-icon-check").css({"background-color": "yellow"});
// 		}

// 		var listItem = $('<li />', {
// 			//'data-role': "collapsible",
// 			'data-inset': "false",
// 			'data-iconpos': "right",
// 			'class': "feature-list ui-corner-all " + icon + " ui-btn-icon-right" //,
// 			//'html': itemName + itemHelpText
// 		});

// 		$('#svcCheckList').append(listItem);

// 		var itemName = $('<h3 />', {
// 			'text': feature.title, //featureName,
// 			'class': "feature-title"
// 		});
// 		console.log(itemName.toString());

// 		var itemHelpText = $('<p />', {
// 			'text': helpText
// 		});

// 		listItem.append(itemName, itemHelpText);
// 		//listItem.append(itemHelpText);

// 		//return listItem;
// 	};

// 	var createList = function(featuresList) {

// 		var allServicesReady = true;

// 		$.each(featuresList, function(key, featureObj) {
// 			if (!featureObj.supported || !featureObj.ready) {
// 				createItem(featureObj);
// 			}

// 			if (featureObj.supported && !featureObj.ready) {
// 				allServicesReady = false;
// 			}
// 		});

// 		if (allServicesReady){
// 			//$('#svcCheckList').append("<h3>Ready!</h3>");
// 			msg("Ready!");
// 		}

// 		$('#svcCheckList').listview("refresh");
// 		//$('#svcCheckList').collapsibleset("refresh");
// 	};

// 	createList(clientState.features);

// };

// var initServices = function() {

// 	var initialize = function(feature) {
// 		var thisFeature = clientState.features[feature];
// 		try {
// 			thisFeature.supported = Modernizr[feature]; //feature in navigator;
// 			//console.log("Raw var for " + feature + ": " + (Modernizr[feature]));
// 		} catch (err) {
// 			thisFeature = {
// 				supported: false
// 			};
// 			console.log(err.message);
// 		}

// 		if (thisFeature.supported) {
// 			var supportedMsg = feature + " supported.";
// 			$('#footerText').append('<p>' + supportedMsg + '</p>');
// 			console.log(supportedMsg);
// 			//need to return feature variable
// 			return thisFeature.setup;
// 		} else {
// 			var unsupportedMsg = feature + " not supported.";
// 			$('#footerText').append('<p>' + unsupportedMsg + '</p>');
// 			console.log(unsupportedMsg);
// 			return function() {
// 				console.log("Error: " + feature + " not supported. skipping...");
// 				return;
// 			};
// 		}
// 	};

// 	vibrate = initialize('vibrate');
// 	//initialize('vibrate');
// 	console.log(vibrate);
// 	vibrate(1000);

// 	geo = initialize('geolocation');
// 	console.log("Location Svcs initialized");

// 	storage = initialize('localstorage');
// };


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


function emit(tag, emitObj) {
	emitObj['tag'] = tag;
	socket.emit('clientMsg', emitObj);
	console.log('Sending ' + tag + ' to server');
}

// function initMap() {
// 	msg("Initializing map");
// 	//initializing mapbox.js / leaflet map
// 	L.mapbox.accessToken = 'pk.eyJ1IjoiZnVja3lvdXJhcGkiLCJhIjoiZEdYS2ZmbyJ9.6vnDgXe3K0iWoNtZ4pKvqA';

// 	var map = L.mapbox.map('map', 'fuckyourapi.o7ne7nmm', {
// 			zoomControl: false
// 		})
// 		.setView([40.734801, -73.998799], 16)
// 		.on('ready', function() {
// 			clientState.mapLoaded = true;
// 			console.log("Map is initialized!");
// 			//sendMapReady();
// 		});

// 	//to override relative positioning from leaflet style
// 	$('#map').css({
// 		"position": "static"
// 	});
// }

// function readyCheck() {
// 	clientState.readyCheckRunning = true;

// 	msg("Checking if ready");
// 	if (clientState.connected && clientState.mapLoaded) {
// 		clientState.ready = true;
// 		$('#app').trigger('ready');
// 		// emit('clientReady', {});
// 	} else {
// 		var readyCounter = 60;
// 		//mobileAlert("CONNECTING...");

// 		var waitForReady = setInterval(function() {

// 			console.log("Waiting for ready state...");
// 			if (clientState.connected && clientState.mapLoaded) {
// 				clientState.ready = true;
// 				$('#app').trigger('ready');
// 				//emit('clientReady', {});
// 				//closeAlert();
// 				//console.log("Close msg called");
// 				clearInterval(waitForReady);
// 			} else if (readyCounter > 0) {
// 				readyCounter--;
// 				if (!clientState.connected) {
// 					console.log("Waiting for connection.");
// 				}
// 				if (!clientState.mapLoaded) {
// 					console.log("Waiting for map.");
// 				}

// 				console.log(readyCounter * 0.5 + "seconds");
// 			} else {
// 				console.log("Not ready. Reloading");
// 				clearInterval(waitForReady);
// 				window.location.reload();
// 			}
// 		}, 500);

// 	}
// }

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