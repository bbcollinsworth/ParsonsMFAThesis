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

var convertToCountdown = function(t, withSeconds) {
	// FROM http://stackoverflow.com/questions/847185/convert-a-unix-timestamp-to-time-in-javascript
	var date = new Date(t); //*1000);

	var hours = "0" + Math.floor(date / 3600000);//date.getHours(); // hours part from the timestamp
	//hours = (hours % 12 === 0) ? 12 : hours % 12;
	var minutes = "0" + date.getMinutes(); // minutes part from the timestamp
	var seconds = "0" + date.getSeconds(); // seconds part from the timestamp

	var formattedTime = hours.substr(-2) + ':' + minutes.substr(-2); // + ':' + seconds.substr(-2);
	if (withSeconds) {
		formattedTime += ":" + seconds.substr(-2);
	}
	return formattedTime;
};

var customLog = function(msg, err) {

	var message = msg;
	if (typeof msg === 'object') {
		message = $.extend({}, msg);
	}
	var logSource = "";
	//Attempt to generate error for stack trace, unless that's not supported
	try {
		var stack = new Error().stack;
		var parsedStack = stack.toString().split("at ")[2].split("/");
		//logSource = logSource.split("/");
		logSource = " ( " + parsedStack[parsedStack.length - 1] + " )";

		if (typeof message === 'object') {
			console.log(message);
			console.log(logSource);
		} else {
			console.log(message + logSource);
		}
	} catch (error) {
		console.log(message);
	}

	//var isJSONstring = true;

	var safeStringify = function(obj) {
		var isJSONstring = false;
		var contentToReturn = "";
		if (typeof obj === 'string' || obj === undefined) {
			//console.log('this is a string or undefined!');
			contentToReturn = obj;
		} else if (typeof obj === 'object') {
			//console.log('this is an object!');
			isJSONstring = true;
			try {
				contentToReturn = JSON.stringify(obj); //,
				// 	JSONstring: isJSONstring
				// };
			} catch (error) {
				//isJSONstring = true;
				console.log("Stringify error:");
				console.log(error);
				var simpleObject = {};
				for (var prop in obj) {
					if (!obj.hasOwnProperty(prop)) {
						continue;
					}
					if (typeof(obj[prop]) == 'object') {
						continue;
					}
					if (typeof(obj[prop]) == 'function') {
						continue;
					}
					simpleObject[prop] = obj[prop]; //.toString();

				}
				contentToReturn = JSON.stringify(simpleObject);
				// return {
				// 	content JSON.stringify(simpleObject),
				// 	JSONstring: isJSONstring
				// };
			}
			//return JSON.stringify(simpleObject); // returns cleaned up JSON
		} else if (obj !== undefined){
			//console.log('this is not an object!');
			contentToReturn = obj.toString();
		}

		return {
			content: contentToReturn,
			JSONstring: isJSONstring
		};
	};

	var safeLog = safeStringify(message);

	if (clientState.connected && app.settings.debugMode) {
		socket.emit('clientMsg', {
			userID: player.localID,
			tag: 'clientLogMsg',
			content: safeLog.content,
			stringified: safeLog.JSONstring,
			time: convertTimestamp(Date.now(), true),
			trace: logSource,
			isError: err
		});
	}
};

var startup = {

	setup: function() {

		initLeafletExtensions();

		//
		//window.scrollTo(0,1);

		window.onerror = function(errorMsg, url, lineNumber, column, errorObj) {
			customLog('/////////***ERROR***///////: ' + errorMsg + ' Script: ' + url + ' Line: ' + lineNumber + ' StackTrace: ' + errorObj, true);
		};

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

		window.myExtend = function(originalObj, updateObj) {
			var descriptor, prop;
			for (prop in updateObj) {
				descriptor = Object.getOwnPropertyDescriptor(updateObj, prop);
				Object.defineProperty(originalObj, prop, descriptor);
				//originalObj[key] = propsToUpdateObj[key];
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

		window.msg = viz.headerMessage;
		window.popup = viz.popup;

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
		};

	},

	parseHash: function() {
		msg('Parsing hash...');
		var thisHash = location.hash;
		msg('Hash is ' + thisHash);
		var parsedHash = thisHash.split("&");
		teamHash = parsedHash[0].slice(1, 2);
		msg('Parsed hash is ' + teamHash + ', ' + parsedHash[1]);
		customLog("Hash is:");
		customLog(teamHash);
		customLog(parsedHash[1]);

		//teamHash = parsedHash[0];
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
			//may be an issue in using both of these... Right now this is checking game start rather than server start...
			if (clientState.firstConnectTime < res.serverStartTime || storage.idStoredTimestamp < res.serverStartTime) {
			//if (clientState.firstConnectTime < res.serverStartTime || storage.idStoredTimestamp < res.serverStartTime) {
				storage.clear();
				customLog("ID older than server start time found; cleared localStorage to: ");
				customLog(storage);
				//window.location.reload();
			} else {
				clientState.firstConnectTime = Date.now();
				//app.attachSocketEvents(); //(cb);
			}

			app.attachSocketEvents();
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

				if (clientState.mapLoaded) {
					app.initialized();

				} else if (readyCounter > 0) {
					readyCounter--;
					customLog(readyCounter * 0.5 + "seconds");
					setTimeout(waitFunction, 500);

				} else {
					customLog("Not ready. Reloading");
					window.location.reload();
				}
			};

			setTimeout(waitFunction, 500);
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
				//window.location.reload();
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

		storage = initialize('localstorage');
		geo = initialize('geolocation');
		heading = initialize('deviceorientation');
		//this should add the following function as a window event handler
		heading(function(event) {
			window.player.pos['heading'] = event.alpha;
		});
		customLog("Location Svcs initialized");

		// storage = initialize('localstorage');

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

			//if (featuresList.)

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