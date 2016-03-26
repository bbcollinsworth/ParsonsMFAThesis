var app = {

	init: function() {
		startup.setup();
		msg('Connecting...');
		startup.initServices();
		startup.parseHash(); //check URL hash for team and playerID data
		startup.connectToServer(); //connect to socket server
	},

	initialized: function() {
		clientState.initialized = true;
		//clientState.readyCheckRunning = false;
		msg("Server and map initialized.");
		emit('clientInitialized', {});
	},

	ready: function() {
		$('#footerText').css({
			'display': 'none'
		});
		//CATCH IF NOT FIRED IN GEOLOC READY-TEST
		app.trackLocation();
		app.addStyling[player.team]();

		emit('readyToPlay', {
			svcCheckComplete: true
		});
	},

	addStyling: {
		gov: function() {

		},
		ins: function() {
			$('#app').addClass('ins-app-styling');
			$('#alertBox').addClass('ins-alert-styling');
		}

	},

	trackLocation: function() {

		if (!clientState.tracking) {

			clientState.tracking = true;
			customLog('WATCH POSITION STARTED');

			var posUpdateHandler = function(position) {
				customLog('Latest Watched Position: <br />' + position.coords.latitude + ', ' + position.coords.longitude + '<br />Heading: ' + player.pos.heading + '<br />' + convertTimestamp(Date.now(), true));
				//footerMsg('Latest Watched Position: <br />' + position.coords.latitude + ', ' + position.coords.longitude + '<br />Heading: ' + player.pos.heading + '<br />' + convertTimestamp(Date.now(), true));
				if (!clientState.posStored) {
					clientState.posStored = true;
				}

				var newPos = {
					lat: position.coords.latitude,
					lng: position.coords.longitude,
					time: position.timestamp //Date.now()
				};

				player.pos.update(newPos);
				console.log("Playerpos updated: ");
				console.log(player);

				//center map on player if team is ins or if it's first pos update
				if (player.team == 'ins' || !clientState.centeredOnPlayer) {
					centerOnPlayer();
				}

			};

			var watchPosError = function(error) {
				customLog("Watch position error: ");
				customLog(error);
			};

			clientState['trackID'] = geo.watchPosition(
				posUpdateHandler,
				watchPosError, {
					//timeout: 0,
					enableHighAccuracy: true //,
					// maximumAge: Infinity
				}
			);
		}
	},

	attachSocketEvents: function() { //callback) {

		//DEBOUNCE IN CASE OF SERVER RESTART
		if (!clientState.socketEventsAttached) {
			clientState.socketEventsAttached = true;

			//INCOMING SOCKET FUNCTIONS ==> defined in main.js
			//app.socketEvents();
			socket.on('serverMsg', app.handleSocketMsg);

			//ONCE EVENTS ATTACHED, TELL SERVER WE'RE LISTENING
			emit('clientListening', {});

		}
		//
		//if (callback) callback();
	},

};

//defining outside object for readibility...
app.handleSocketMsg = function(res, err) {

	var handle = {

		stillConnected: function() {
			clientState.connected = true;
			customLog("Still connected to server");
		},

		mapInitCheck: function() {
			startup.initCheck();
		},

		//1sec for new/returning player + teamHash, uniqueID
		playerTypeCheck: function() {
			var storedUserFound = startup.storedUserCheck(res.userIDs, res.gameStartTime);
			customLog("Stored user found is: " + storedUserFound);

			if (storedUserFound) { //send returning player
				clientState.localID = localStorage.userID;
				player.localID = localStorage.userID;
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
			storage.setItem("userID", res.newID);
			storage.setItem("idStoredTimestamp", Date.now());
			player.localID = storage.userID;
			player.team = res.team;
			customLog("UserID stored locally as: " + storage.userID);
			msg('Hello Player ' + res.newID + '!');

			startup.svcCheck();
		},

		returningReadyCheck: function() {

			player.team = res.team;
			if (res.introComplete || res.svcCheckComplete) {
				// 	$('#app').trigger('ready');
				// } else if (storage.svcCheckComplete) {
				$('#footerText').html('');
				app.ready();
				//$('#app').trigger('ready');
			} else {
				startup.svcCheck();
			}
		},

		getLocation: function() {

			clientState['lastLocReqTime'] = res.timestamp;
			//if now - res.timestamp less than tracking interval
			var timeElapsed = Date.now() - res.timestamp;
			customLog("Time in seconds since request in GetLoc: " + timeElapsed / 1000);

			if (res.firstPing) {
				clientState['trackInterval'] = res.trackingInterval;
				// if (!clientState.tracking) {
				// 	app.trackLocation();
				// }
				sendStoredLocation(res.timestamp, centerOnPlayer);
			} else {
				sendStoredLocation(res.timestamp);
			}
		},

		insStartData: function() {
			clientState.intro.content = res.introContent;

			customLog("My lockout State is: " + res.playerLockedOut);
			if (res.playerLockedOut) {
				customLog('lockout Alert received');
				//window.alert("FAILURE: State Agents have locked your device!");
				ins.renderLockout();
			} else if (!res.playStarted) {
				clientState.intro.run('ins');
				//runIntro('ins');

				$('#app').off('introComplete').on('introComplete', function() {
					emit('introCompleted', {});
					ins.renderUI();
				});
			} else {
				ins.renderUI();
			}
		},

		govStartData: function() {
			clientState.intro.content = res.introContent;
			gov.renderHubs(res.hubs);

			if (!res.playStarted) {
				clientState.intro.run('gov');

				$('#app').off('introComplete').on('introComplete', function() {
					emit('introCompleted', {});
					gov.renderUI();
					//attachEvents();
				});
			} else {
				gov.renderUI();
				//attachEvents();
			}

		},

		suspectData: function() {
			customLog('Suspect data is: ');
			customLog(res.locData);

			gov.renderPlayers(res.locData, gov.suspectRangeCheck);
		},

		agentCloseWarning: function() {
			window.alert("WARNING: State agents within " + res.distance + " meters.");
		},

		lockoutAlert: function() {
			customLog('lockout Alert received');
			window.alert("FAILURE: State Agents have locked your device!");
			ins.renderLockout();
		},

		playerLockoutsUpdate: function() {
			var lP = res.lockedPlayer;
			var players = clientState.allPlayers;
			if (lP.userID !== player.localID) {
				switch (player.team) {
					case "gov":
						players[lP.userID]['lockedOut'] = true;
						players[lP.userID].marker.darkLockedCheck();
						//players[lP.userID].marker.renderLockout();
						customLog("Locking out player: ");
						customLog(players[lP.userID]);
						setTimeout(function() {
							window.alert("UPDATE: A suspect has been successfully neutralized.");
							gov.ui.attachPingEvents();
						}, 750);
						break;
					case "ins":
						window.alert("ALERT: A fellow hacker has been neutralized.");
						break;
					default:
						break;
				}
			}
		},

		hubsByDistance: function() {
			customLog("Hubs by distance received: ");
			customLog(res.hubsByDistance);

			$('#app').off('scanComplete').on('scanComplete', function() {
				centerOnPlayer();
				ins.runHubRangeCheck(res.hubsByDistance);
				// ins.pointToHubs(res.hubsByDistance,ins.popPointers);
			});

		},

		hubHealthUpdate: function() {

			customLog("Health left: " + res.healthLeft);
			//Probably don't need
			//if (res.hubName == ins.targetHub.name){
			ins.targetHub.health = res.healthLeft;
			ins.ui.refreshHackProgress();
		},

		hubAttackUpdate: function() {
			customLog("Hub attack update received");
			customLog(res);
			var hub = clientState.getHubByName(res.latestHubInfo.name); //hubs[res.latestHubInfo.index];
			hub.update(res.latestHubInfo);
			hub.setFlashByAlertState();

			switch (hub.alertState) {
				case 3:
					if (!hub.alerts.lvl3) {
						window.alert("WARNING: Security hub attack 50% complete.");
						hub.alerts.lvl3 = true;
					}
					break;
				case 1:
					//THIS SHOULD NOT have if test
					window.alert("WARNING: A security hub is under attack.");
					hub.alerts.lvl1 = true;
					break;
				default:
					break;
			}
			//}
		},

		hubAttackStopped: function() {
			customLog("Hub attack stop received");
			//var i = res.hubIndex;
			var hub = clientState.getHubByName(res.latestHubInfo.name);
			hub.update(res.latestHubInfo);
			hub.stopFlash();
			// if (hubs[i].flashing){

			// }
		},

		hackComplete: function() {
			ins.ui.hackSuccess();
		},

		hubDown: function() {
			switch (player.team) {
				case "gov":
					hubs[res.hubIndex].stopFlash();
					hubs[res.hubIndex].shutDown();
					window.alert("Hackers have taken down a security hub!");
					break;
				case "ins":
				default:
					window.alert("SUCCESS: A surveillance site has been hacked!");
					break;
			}
		}
	};

	handle[res.tag]();

};

customLog("Client App loaded");