var app = {
	settings: {
		autoCapture: false,
		debugMode: true
	},

	init: function() {
		startup.setup();
		msg('Connecting...');
		startup.initServices();
		startup.parseHash(); //check URL hash for team and playerID data
		startup.connectToServer(); //connect to socket server
	},

	initialized: function() {
		clientState.initialized = true;
		viz.hide('#footerText');

		msg("Initialized.<br /><i>Refresh window if no progress after 10 seconds.</i>");
		emit('clientInitialized', {});
	},

	ready: function() {
		//CATCH IF NOT FIRED IN GEOLOC READY-TEST
		app.trackLocation();
		app.addStyling[player.team]();
		app.loadAudio();

		emit('readyToPlay', {
			svcCheckComplete: true
		});

	},

	loadAudio: function() {
		var setToLoad = viz.audio[player.team];
		for (file in setToLoad) {
			customLog("Loading audio: " + setToLoad[file].url);
			setToLoad[file].ready = false;
			var audioDOM = $('<audio />', {
				'preload': "auto",
				'src': setToLoad[file].url,
				'id': setToLoad[file].id,
				'class': setToLoad[file].class | 'audio-element'
			});

			$('#container').append(audioDOM);

			setToLoad[file].domEl = document.getElementById(setToLoad[file].id);

			setToLoad[file].domEl.oncanplaythrough = function() {
				console.log("Audio " + setToLoad[file].id + " ready to play!");
				setToLoad[file].ready = true;
			};
		}
	},

	addStyling: {
		//why here and not in viz.headerstyles?
		gov: function() {
			$('#app').addClass('gov-app-styling');
			$('#alertBox').addClass('gov-alert-styling');
			$('#headerBackdrop').addClass('gov-backdrop');
		},
		ins: function() {
			$('#app').addClass('ins-app-styling');
			$('#alertBox').addClass('ins-alert-styling');
			$('#headerBackdrop').addClass('ins-backdrop');
		}

	},

	getHubByName: function(name) {
		for (var i in hubs) {
			if (hubs[i].name === name) {
				return hubs[i];
			}
		}
	},

	intro: {
		content: {},
		run: function() { //team) {
			var intro = this.content; //clientState.intro.content;
			var team = player.team;
			msg(intro[team].screen1);

			//popup("Alert text");
		}
	},

	btnEvents: {
		nextIntroScreen: function() {
			var intro = app.intro.content[player.team];
			msg(intro.screen2);
		},
		introComplete: function() {
			$('#app').trigger('introComplete');
		},
		closePopup: function(popupID) {
			$(popupID).addClass('popup-invisible').removeClass('popup-visible');
			setTimeout(function() {
				$(popupID).remove();
			}, 2000);
			//$('.popup-alert').addClass('popup-invisible');
		},
		showAudioMessage: function(toPlay, clicked) {

			app.btnEvents.closePopup(clicked.parent());

			var randomDelay = 500 + Math.random() * 1000;

			setTimeout(function() {
				if (toPlay in viz.audio[player.team]) {
					popup(viz.audioPopup(viz.audio[player.team][toPlay]));
				} else {
					customLog("Error: Audio file instructed by server not available for play");
				}
			}, randomDelay);

		},
		playAudio: function(audioObj, clicked) {

			var thisAudio = audioObj.domEl;
			if (audioObj.ready) {
				customLog("audio " + audioObj.id + " ready to play - playing!");
				thisAudio.play();

				app.btnEvents.closePopup(clicked.parent());
			} else {
				customLog("Play called but audio not ready");
				$(clicked).html("Loading...");

				var abortAudio = setTimeout(function() {
					$(clicked).html("Load failed.");
					setTimeout(function() {
						app.btnEvents.closePopup(clicked.parent());
					}, 2000);
				}, 20000);

				customLog("Attempting to load audio after play called");
				thisAudio.load();
				thisAudio.oncanplaythrough = function() {
					clearTimeout(abortAudio);
					customLog("now audio ready - playing");
					thisAudio.play();
					app.btnEvents.closePopup(clicked.parent());
				};


			}
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

			//should this be cleared?
			socket.off('serverMsg').on('serverMsg', app.handleSocketMsg);

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

		geoTestServerEval: function() {

			storage.setItem('lastGeoTestResult', res.finding);
			//Server tells client whether clicking test again should refresh page:
			viz.geoPrompt.shouldRefresh = res.shouldRefresh;

			try {
				viz.geoPrompt.render[res.finding]();
			} catch (err) {
				customLog("Error: no function to execute for that GeoTest server finding");
				customLog(err);
			}
		},

		returningReadyCheck: function() {
			player.team = res.team;

			if (res.introComplete || res.svcCheckComplete) {
				$('#footerText').html('');
				app.ready();
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
			app.intro.content = res.introContent;

			customLog("My lockout State is: " + res.playerLockedOut);
			if (res.playerLockedOut) {
				customLog('lockout Alert received');
				//popup("FAILURE: State Agents have locked your device!");
				ins.renderLockout();
			} else if (!res.playStarted) {
				app.intro.run('ins');
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
			app.intro.content = res.introContent;
			gov.renderHubs(res.hubs);

			if (!res.playStarted) {
				app.intro.run('gov');

				$('#app').off('introComplete').on('introComplete', function() {
					emit('introCompleted', {});
					gov.renderUI();
				});
			} else {
				gov.renderUI();
			}

		},

		suspectData: function() {
			customLog('Suspect data is: ');
			customLog(res.locData);

			gov.renderPlayers(res.locData, gov.suspectRangeCheck);
		},

		agentCloseWarning: function() {
			popup("WARNING: State agents within " + res.distance + " meters. Minimize phone use to avoid detection!");

			// popup("WARNING: State agents within " + res.distance + " meters. Minimize phone use to avoid detection!");
		},

		lockoutAlert: function() {
			customLog('lockout Alert received');
			popup("FAILURE: State Agents have locked your device!");
			ins.renderLockout();
		},

		// playMessage: function() {
		// 	if (res.toPlay in viz.audio[player.team]) {
		// 		popup(viz.audioPopup(viz.audio[player.team][res.toPlay]));
		// 	} else {
		// 		customLog("Error: Audio file instructed by server not available for play");
		// 	}
		// },

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

							var popBtn = {
								'txt': 'OK',
								onClick: 'closePopup'
							};

							if (res.lockedSuspects == 1) {
								popBtn.onClick = 'showAudioMessage';
								popBtn.args = 'file1';
							} else if (res.liveSuspects == 1) {
								popBtn.onClick = 'showAudioMessage';
								popBtn.args = 'file2';
							}

							popup({
								1: "UPDATE: <br />A suspect has been successfully neutralized.",
								'button': popBtn
							});

							gov.ui.attachPingEvents();
						}, 750);
						break;
					case "ins":
						popup("ALERT: A fellow hacker has been neutralized.");
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
			var hub = app.getHubByName(res.latestHubInfo.name); //hubs[res.latestHubInfo.index];
			hub.update(res.latestHubInfo);
			hub.setFlashByAlertState();

			switch (hub.alertState) {
				case 3:
					if (!hub.alerts.lvl3) {
						popup("WARNING: Security hub attack 50% complete.");
						hub.alerts.lvl3 = true;
					}
					break;
				case 1:
					//THIS SHOULD NOT have if test
					popup("WARNING: A security hub is under attack.");

					// popup("WARNING: A security hub is under attack.");
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
			var hub = app.getHubByName(res.latestHubInfo.name);
			hub.update(res.latestHubInfo);
			hub.stopFlash();
			// if (hubs[i].flashing){

			// }
		},

		hackComplete: function() {
			ins.ui.hackSuccess();
		},

		hubDown: function() {
			//HACKY!!!
			clientState.hubsHacked++;
			switch (player.team) {
				case "gov":
					var downHub = app.getHubByName(res.hub.name);
					downHub.update(res.hub);
					downHub.stopFlash();
					//downHub.shutDown(); //moved into stopflash
					popup("Hackers have taken down a security hub!");
					break;
				case "ins":


					console.log("Data from server");
					console.log(res);

					var popBtn = {
						'txt': 'OK',
						onClick: 'closePopup'
					};

					if (clientState.hubsHacked == 1) {
						customLog("Setting hacked popup to show first audio");
						popBtn.onClick = 'showAudioMessage';
						popBtn.args = 'file1';
					} else if ((res.hackTarget - clientState.hubsHacked) == 1) {
						popBtn.onClick = 'showAudioMessage';
						popBtn.args = 'file2';
					}
					popup({
						1: "SUCCESS: A surveillance site has been hacked!",
						'button': popBtn
					});
					break;
				default:
			}
		},

		insWon: function() {
			popup("Security network down. The hackers have won!");
		},

		govWon: function() {
			popup("All hackers neutralized. The state has won!");
		}

	};

	handle[res.tag]();
	//does this help prevent double-messages?
	//res = {};

};

customLog("Client App loaded");