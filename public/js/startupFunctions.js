var govHash, insHash;
var teamHash, uniqueHash;
var vibrate, geo, storage, heading;

var convertTimestamp = function(t, withSeconds) {
	// FROM http://stackoverflow.com/questions/847185/convert-a-unix-timestamp-to-time-in-javascript
	var date = new Date(t); //*1000);

	var hours = date.getHours(); // hours part from the timestamp
	hours = (hours % 12 === 0) ? 12 : hours % 12;
	var minutes = "0" + date.getMinutes(); // minutes part from the timestamp
	var seconds = "0" + date.getSeconds(); // seconds part from the timestamp

	var formattedTime = hours + ':' + minutes.substr(-2); // + ':' + seconds.substr(-2);
	if (withSeconds) {
		formattedTime += ":" + seconds.substr(-2);
	}
	return formattedTime;
};

var customLog = function(message) {
	console.log(message);

	//var isJSONstring = true;

	var safeStringify = function(object) {
		var isJSONstring = true;
		try {
			return {
				content: JSON.stringify(object),
				JSONstring: isJSONstring
			};
		} catch (error) {
			isJSONstring = true;
			console.log("Stringify error:");
			console.log(error);
			var simpleObject = {};
			for (var prop in object) {
				if (!object.hasOwnProperty(prop)) {
					continue;
				}
				if (typeof(object[prop]) == 'object') {
					continue;
				}
				if (typeof(object[prop]) == 'function') {
					continue;
				}
				simpleObject[prop] = object[prop].toString();

			}
			return {
				content: JSON.stringify(simpleObject),
				JSONstring: isJSONstring
			};
			//return JSON.stringify(simpleObject); // returns cleaned up JSON
		}
	};

	var safeLog = safeStringify(message);

	if (clientState.connected) {
		socket.emit('clientMsg', {
			userID: player.localID,
			tag: 'clientLogMsg',
			content: safeLog.content,
			stringified: safeLog.JSONstring,
			time: convertTimestamp(Date.now(), true)
		});
	}
};

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

		window.myExtend = function(originalObj, propsToUpdateObj) {
			for (key in propsToUpdateObj) {
				originalObj[key] = propsToUpdateObj[key];
			}
		};

		window.reverseForIn = function(obj, f) {
			var arr = [];
			for (key in obj) {
				arr.unshift(key);
			}

			for (i in arr) {
				f.call(obj, arr[i]);
			}
		};

		$('#mobileHeader').trigger('create');

		window.msg = function(text, styling) {

			var msgHTML = "";

			if (typeof text === 'string' || text instanceof String) {
				msgHTML = '<p>' + text + '</p>';
			} else {
				for (line in text) {
					msgHTML += '<p>' + text[line] + '</p>';
				}
			}

			$('#alertBodyText').html(msgHTML);

			viz.headerStyles.update(styling);
			// for (s in viz.headerStyles) {
			// 	$('#alertBox').removeClass(viz.headerStyles[s]);
			// }

			// //this should be turned into a viz.addHeaderStyles[styling]()
			// //function call:
			// if (styling in viz.headerStyles) {
			// 	customLog("adding header styling! " + styling);
			// 	$('#alertBox').addClass(viz.headerStyles[styling]);

			// 	//KINDA ANNOYING way to switch icon color depending on alert type
			// 	if ('headerToggle' in app) {
			// 		app.headerToggle.icon.removeClass('ui-alt-icon');
			// 	}
			// } else if (player.team == 'gov') {
			// 	if ('headerToggle' in app) {
			// 		app.headerToggle.icon.addClass('ui-alt-icon');
			// 	}
			// }

			if (('headerToggle' in app)&& styling !== viz.headerStyles.current) {
				app.headerToggle.forceExpand();
			}

			viz.headerStyles.current = styling;
		};

		window.footerMsg = function(text, styling) {
			var msgHTML = "";

			if (typeof text === 'string' || text instanceof String) {
				msgHTML = '<p>' + text + '</p>';
			} else {
				for (line in text) {
					msgHTML += '<p>' + text[line] + '</p>';
				}
			}

			$('#footerText').html(msgHTML);
		}

	},

	parseHash: function() {
		msg('Parsing hash...');
		var thisHash = location.hash;
		msg('Hash is ' + thisHash);
		var parsedHash = thisHash.split("&");
		parsedHash[0] = parsedHash[0].slice(1, 100);
		msg('Parsed hash is ' + parsedHash[0] + ', ' + parsedHash[1]);
		customLog("Hash:");
		customLog(parsedHash[0]);
		customLog(parsedHash[1]);

		teamHash = parsedHash[0];
		uniqueHash = parsedHash[1];
		//NEED TO DO LOCALSTORAGE CHECK
		if (clientState.features.localstorage.supported) {
			localStorage.setItem("teamHash", teamHash);
			localStorage.setItem("uniqueID", uniqueHash);
		}
	},

	initMap: function() {
		customLog("Initializing map");
		//msg("Initializing map");
		L.mapbox.accessToken = 'pk.eyJ1IjoiZnVja3lvdXJhcGkiLCJhIjoiZEdYS2ZmbyJ9.6vnDgXe3K0iWoNtZ4pKvqA';

		window.map = L.mapbox.map('map', 'fuckyourapi.o7ne7nmm', {
			zoomControl: false
		})
			.setView([40.734801, -73.998799], 16)
			.on('ready', function() {

				window.featureLayer = L.geoJson().addTo(map);
				clientState.mapLoaded = true;
				customLog("Map is initialized!");
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

		var seconds = 0;
		var serverWait = setInterval(function() {
			seconds++;
			customLog("Waiting for server connection... " + seconds + "s");
		}, 1000);

		socket.on('connected', function(res, err) {
			clientState.connected = true;
			clearInterval(serverWait);
			customLog("Connected to server");
			console.log("Res is " + res);
			//may be an issue in using both of these...
			if (clientState.firstConnectTime < res.gameStartTime || storage.idStoredTimestamp < res.gameStartTime) {
				storage.clear();
				customLog("ID older than server start time found; cleared localStorage to: ");
				customLog(storage);
				window.location.reload();
			} else {
				clientState.firstConnectTime = Date.now();
				app.attachSocketEvents(); //(cb);
			}
		});

	},

	initCheck: function() {

		msg("Checking if map initialized");
		customLog("Server checking if map initialized");
		if (clientState.mapLoaded) {
			app.initialized();
		} else {
			customLog("Waiting for map init...");
			var readyCounter = 60;

			var waitFunction = function() {
				//var waitForReady = setInterval(function() {
				if (clientState.mapLoaded) {
					//clearInterval(waitForReady);
					app.initialized();

				} else if (readyCounter > 0) {
					//if (!clientState.mapLoaded) {
					//customLog("Waiting for map.");
					//}
					readyCounter--;
					customLog(readyCounter * 0.5 + "seconds");
					setTimeout(waitFunction, 500);
				} else {
					customLog("Not ready. Reloading");
					//clearInterval(waitForReady);
					window.location.reload();
				}
			};

			setTimeout(waitFunction, 500);

			//var waitForReady = setInterval(function() {
			//var waitForReady = setTimeout(waitFunction
			//function() {

			// 	customLog("Waiting for ready state...");
			// 	if (clientState.mapLoaded) {
			// 		//clearInterval(waitForReady);
			// 		app.initialized();

			// 	} else if (readyCounter > 0) {
			// 		//if (!clientState.mapLoaded) {
			// 		customLog("Waiting for map.");
			// 		//}
			// 		readyCounter--;
			// 		customLog(readyCounter * 0.5 + "seconds");
			// 	} else {
			// 		customLog("Not ready. Reloading");
			// 		clearInterval(waitForReady);
			// 		window.location.reload();
			// 	}
			// }
			//	, 500);

		}
	},

	storedUserCheck: function(allIDs, gameStart) {
		customLog("Checking for stored user. IDs from server are: ");
		customLog(allIDs);
		customLog("And locally stored ID is: ");
		customLog(storage.userID);
		var userFound = false;
		//check for stored id matching existing player:
		if (storage.userID !== undefined) {

			//this may not be necessary now... on connection will always beat
			if (storage.idStoredTimestamp < gameStart) {
				storage.clear();
				customLog("ID older than server start time found; cleared localStorage to: ");
				customLog(storage);
				window.location.reload();
			} else {
				for (var i in allIDs) {
					if (storage.userID == allIDs[i]) {
						customLog("Stored User Found!:" + allIDs[i]);
						userFound = true;
						break;
					}
				}
				//if there's a local user but it wasn't matched, clear it
				if (!userFound) {
					customLog("ERROR: Locally stored user not matched to server, probably due to server restart.");
					customLog("Clearing local storage.");
					storage.clear();
				}
			}
		}

		return userFound;
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
				//customLog("Raw var for " + feature + ": " + (Modernizr[feature]));
			} catch (err) {
				thisFeature = {
					supported: false
				};
				customLog(err.message);
			}

			if (thisFeature.supported) {
				var supportedMsg = feature + " supported.";
				//$('#footerText').append('<p>' + supportedMsg + '</p>');
				customLog(supportedMsg);
				return thisFeature.setup;
			} else if ('errorReturn' in thisFeature) {
				customLog("Special error return found for " + thisFeature.title);
				customLog(thisFeature.errorReturn);
				return thisFeature.errorReturn;
			} else {
				return function() {
					customLog("Error: " + feature + " not supported. skipping...");
					//return;
				};
			}
		};

		vibrate = initialize('vibrate');
		customLog(vibrate);
		vibrate(1000);

		geo = initialize('geolocation');
		heading = initialize('deviceorientation');
		//this should add the following function as a window event handler
		heading(function(event) {
			window.player.pos['heading'] = event.alpha;
		});
		customLog("Location Svcs initialized");

		storage = initialize('localstorage');

	},

	svcCheck: function() {
		//render service checklist and run any activation tests
		var list = $('<ul />', {
			'data-role': "listview", //collapsibleset",
			'id': "svcCheckList"
		});

		var alertBody = $('#alertBodyText');
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
				'data-inset': "false",
				'data-iconpos': "right",
				'class': "feature-list ui-corner-all " + icon + " ui-btn-icon-right" //,
			});

			$('#svcCheckList').append(listItem);

			var itemName = $('<h3 />', {
				'text': feature.title, //featureName,
				'class': "feature-title"
			});
			customLog(itemName.toString());

			var itemHelpText = $('<p />', {
				'text': helpText
			});

			listItem.append(itemName, itemHelpText);
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

			$('#svcCheckList').listview("refresh");

			if (allServicesReady) {

				msg("Ready!");
				storage.setItem('svcCheckComplete', true);
				customLog("Local value of SvcCheckComplete stored as: " + storage.svcCheckComplete);

				$('#footerText').html('');

				app.ready();

				//$('#app').trigger('ready');
			}
		};

		createList(clientState.features);
	}
};

customLog("StartupFunctions loaded");