var govHash, insHash;
var teamHash, uniqueHash;
var vibrate, geo, storage;


var startup = {

	setup: function() {

		initLeafletExtensions();

		//custom map function
		Math.map = function(varToMap, varMin, varMax, mapToMin, mapToMax, clamp) {

			var mappedValue = mapToMin + (mapToMax - mapToMin) * ((varToMap - varMin) / (varMax - varMin));

			if (clamp) {
				return Math.min(Math.max(mappedValue, mapToMin), mapToMax);
			} else {
				return mappedValue;
			}
		};

		//custom first-letter capitalize function
		String.prototype.firstCap = function() {
			return this.charAt(0).toUpperCase() + this.slice(1);
		};

		String.prototype.addBreak = function() {
			return this + "<br />";
		};

		window.convertTimestamp = function(t) {
			// FROM http://stackoverflow.com/questions/847185/convert-a-unix-timestamp-to-time-in-javascript
			var date = new Date(t); //*1000);
			// hours part from the timestamp
			var hours = date.getHours();
			hours = (hours % 12 === 0) ? 12 : hours % 12;
			// minutes part from the timestamp
			var minutes = "0" + date.getMinutes();
			// seconds part from the timestamp
			var seconds = "0" + date.getSeconds();
			// will display time in 10:30:23 format
			var formattedTime = hours + ':' + minutes.substr(-2); // + ':' + seconds.substr(-2);
			return formattedTime;

		};

	},

	parseHash: function() {
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
	},

	initMap: function() {
		msg("Initializing map");
		//initializing mapbox.js / leaflet map
		L.mapbox.accessToken = 'pk.eyJ1IjoiZnVja3lvdXJhcGkiLCJhIjoiZEdYS2ZmbyJ9.6vnDgXe3K0iWoNtZ4pKvqA';

		window.map = L.mapbox.map('map', 'fuckyourapi.o7ne7nmm', {
			zoomControl: false
		})
			.setView([40.734801, -73.998799], 16)
			.on('ready', function() {

				window.featureLayer = L.geoJson().addTo(map);
				clientState.mapLoaded = true;
				console.log("Map is initialized!");
				//sendMapReady();
			});

		//to override relative positioning from leaflet style
		$('#map').css({
			"position": "static"
		});
	},

	connectToServer: function() {
		socket = io.connect();
		msg("Initializing socket");
	},

	readyCheck: function() {
		clientState.readyCheckRunning = true;

		msg("Checking if initialized");
		if (clientState.connected && clientState.mapLoaded) {
			clientState.ready = true;
			$('#app').trigger('initialized');
			// emit('clientReady', {});
		} else {
			var readyCounter = 60;
			//mobileAlert("CONNECTING...");

			var waitForReady = setInterval(function() {

				console.log("Waiting for ready state...");
				if (clientState.connected && clientState.mapLoaded) {
					clientState.ready = true;
					$('#app').trigger('initialized');

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
	},

	initServices: function() {

		window.supported = function(feature) {
			return clientState.features[feature].supported;
		};

		$('#footerText').html('');

		var initialize = function(feature) {
			var thisFeature = clientState.features[feature];
			try {
				thisFeature.supported = Modernizr[feature]; //feature in navigator;
				//console.log("Raw var for " + feature + ": " + (Modernizr[feature]));
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

		vibrate = initialize('vibrate');
		//initialize('vibrate');
		console.log(vibrate);
		vibrate(1000);

		geo = initialize('geolocation');
		console.log("Location Svcs initialized");

		storage = initialize('localstorage');
	},

	storedUserCheck: function(allIDs) {
		var userFound = false;
		//check for stored id matching existing player:
		if (localStorage.userID !== undefined) {
			for (var i in allIDs) {
				if (localStorage.userID == allIDs[i]) {
					console.log("Stored User Found!:" + allIDs[i]);
					userFound = true;
					break;
				}
			}
		}

		return userFound;
	},

	svcCheck: function() {

		//render service checklist and run any activation tests

		var list = $('<ul />', {
			'data-role': "listview", //collapsibleset",
			'id': "svcCheckList"
		});

		var alertBody = $('#alertBodyText');

		//alertBody.html('');
		alertBody.html(list);
		alertBody.trigger('create');

		var createItem = function(feature) {

			var icon = "";
			var helpText = "";

			if (!feature.supported) {
				icon = "ui-icon-delete";
				helpText = feature.noSupportText;
			} else if (!feature.ready) {
				icon = "ui-icon-alert";
				helpText = feature.helpText;
				feature.readyTest(); //test for ready state (e.g. ping location)
			} else {
				icon = "ui-icon-check";
				//$("ui-icon-check").css({"background-color": "yellow"});
			}

			var listItem = $('<li />', {
				//'data-role': "collapsible",
				'data-inset': "false",
				'data-iconpos': "right",
				'class': "feature-list ui-corner-all " + icon + " ui-btn-icon-right" //,
				//'html': itemName + itemHelpText
			});

			$('#svcCheckList').append(listItem);

			var itemName = $('<h3 />', {
				'text': feature.title, //featureName,
				'class': "feature-title"
			});
			console.log(itemName.toString());

			var itemHelpText = $('<p />', {
				'text': helpText
			});

			listItem.append(itemName, itemHelpText);
			//listItem.append(itemHelpText);

			//return listItem;
		};

		var createList = function(featuresList) {

			var allServicesReady = true;

			$.each(featuresList, function(key, featureObj) {
				if (!featureObj.supported || !featureObj.ready) {
					createItem(featureObj);
				}

				if (featureObj.supported && !featureObj.ready) {
					allServicesReady = false;
				}
			});

			if (allServicesReady) {
				//$('#svcCheckList').append("<h3>Ready!</h3>");
				msg("Ready!");

				if (clientState.features.localstorage.supported) {
					localStorage.setItem('svcCheckComplete', true);
				}

				$('#footerText').html('');

				$('#app').trigger('ready');

			}

			$('#svcCheckList').listview("refresh");
			//$('#svcCheckList').collapsibleset("refresh");
		};

		createList(clientState.features);

	}
};

console.log("StartupFunctions loaded");