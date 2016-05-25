var ins = {
	ui: {
		'hubPointers': [],
		'maxHubsDetected': 3,
		'text': {
			'scan': {
				'special': '<span>Press <div id="textIconIns" class="icon-in-text scan-icon button-icon-style"></div> below to scan for active surveillance sites nearby.</span>'
			},

			'canHack': {
				1: "Surveillence site in range!",
				2: "<b>Press below to begin hacking.</b>"
			},
			'hacking': {
				1: "UPLOADING VIRUS. (Note: More hackers will increase upload speed.)",
				2: " Stay in range with device active or upload will be interrupted."
			},
			'hackSuccess': "Hack Complete",
			'lockedOut': "Compromised"
		},

		attachScanEvents: function() {
			msg(ins.ui.text.scan);

			$('#scanButton').html("")
				.removeClass('hackReady')
				.removeClass('uploadProgress')
				.removeClass('hackAnim')
				.removeClass('hackComplete')
				.addClass('scan-icon');

			$('#scanButton').off('click').on('click', function() {
				customLog("SCAN BUTTON CLICKED");

				centerOnPlayer();

				var scanFunction = function() {
					emit('detectHubs', {
						playerPos: player.pos,
						existingLocData: []
					});
				};

				sendStoredLocation(scanFunction);

				//storeAndSendLocation(scanFunction);

				if (!ins.ui.scanButton.animRunning) {
					customLog("calling scan animation");

					ins.ui.scanButton.animRunning = true;
					ins.ui.scanButton.animate();
				}
			});
		},

		attachHackEvents: function() {
			var btn = $('#scanButton');

			btn.removeClass('scan-icon').addClass('hack-icon');
			btn.off('click').on('click', function() {
				msg(ins.ui.text.hacking, 'ins-urgent');

				ins.ui.refreshHackProgress();

				btn.removeClass('hack-icon')
					.addClass('uploadProgress')
					.addClass('hackAnim');

				ins.hackHub();
			});
		},

		refreshHackProgress: function() {
			var pct = Math.floor(100 - ins.targetHub.health);
			$('#scanButton').html("<span>" + pct + "%</span>");
		},

		hackSuccess: function() {
			$('#scanButton').html("")
				.off('click')
				.removeClass('hackReady')
				.removeClass('uploadProgress')
				.removeClass('hackAnim')
				.addClass('hackComplete');

			ins.clearTargetHub();

			msg(ins.ui.text.hackSuccess, 'success');
			setTimeout(function() {
				customLog("resetting scan");
				ins.ui.attachScanEvents();
			}, 3000);
		}
	},

	//hackRange: 75,

	renderUI: function() {

		customLog("Render UI Called. ClientState.uiRendered is ");
		customLog(clientState.uiRendered);

		if (!clientState.uiRendered) {
			clientState.uiRendered = true;

			//***doing this in reverse so pointer[0] will be last appended (i.e. on top?)
			for (var i = ins.ui.maxHubsDetected - 1; i >= 0; i--) {
				var newPointer = viz.scanPointer.init('spinner' + i);
				newPointer.addTo('#container');
				this.ui.hubPointers.unshift(newPointer);
			}

			app['headerToggle'] = ins.ui['headerToggle'] = viz.headerToggle.create('ins');
			//store a reference for calling "Msg, etc"
			// app['headerToggle'] = ins.ui.headerToggle;

			this.ui['scanButton'] = viz.scanButton();
			$('#container').append(this.ui['scanButton']);

			// ins.ui.attachScanEvents();
			customLog('Hub pointers created: ');
			customLog(this.ui.hubPointers);

			$('#mobileFooter').prepend(viz.threatMeter.create());

			viz.helpScreen.create();
			viz.makeFooter();

		}

		//clears in cases where client page doesn't reload but server link is broken
		ins.clearTargetHub();
		emit('playerLeftHubRange', {});

		ins.ui.attachScanEvents();
	},

	popPointers: function() {
		for (var i in ins.ui.hubPointers) {

			ins.ui.hubPointers[i].show();

		}
	},

	runHubRangeCheck: function(hubArray) {
		var hubToAttack = {};

		for (h in hubArray) {
			if (hubArray[h].distance < hubArray[h].hackRange) {
				hubToAttack = hubArray[h];
				break;
			}
		}
		//Check if object isn't empty -- if so a hub is in range:
		if ('hackRange' in hubToAttack) {
			ins.enableHack(hubToAttack);
		} else {
			ins.pointToHubs(hubArray, ins.popPointers);
		}
	},

	enableHack: function(targetHub) {
		msg(ins.ui.text.canHack, 'ins-urgent');

		ins.targetHub = targetHub;

		ins.ui.attachHackEvents();
	},

	pointToHubs: function(hubArray, callback) {

		var getAngleFromMapCenter = function(screenPos) {

			var screenCenter = map.project(map.getCenter());
			customLog("Map Center is " + screenCenter);

			var vec = {
				'x': screenPos.x - screenCenter.x,
				'y': screenPos.y - screenCenter.y
			};

			var theta = Math.atan2(vec.y, vec.x); // range (-PI, PI]
			theta *= 180 / Math.PI;

			//ADJUST FOR ROTATION FROM TOP:
			theta += 90;
			return theta;
		};

		for (var i = 0; i < ins.ui.maxHubsDetected; i++) {

			var hubScreenCoords = map.project([hubArray[i].lat, hubArray[i].lng]);
			hubArray[i]['angleTo'] = getAngleFromMapCenter(hubScreenCoords);
			customLog("Angle to " + hubArray[i].name + " is " + hubArray[i]['angleTo'] + " degrees");

			ins.ui.hubPointers[i].update(hubArray[i]);
		}

		if (callback !== undefined) {
			callback();
		}
		//}
	},

	targetHub: {},

	hubHackInterval: {},

	hackSuccess: function() {

	},

	clearTargetHub: function() {
		ins.targetHub = {};
	},

	hackHub: function() {

		//var hubHackInterval = 

		var d = player.distanceTo(ins.targetHub);

		if (d > ins.targetHub.attackRange) {
			//update this with mobile alerts
			popup("Out of range. Hack interrupted!");
			//clearInterval(ins.hubHackInterval);

			emit('playerLeftHubRange', {
				hubID: ins.targetHub.id,
				hubIndex: ins.targetHub.key,
				hubName: ins.targetHub.name //,
				//playerID: player.localID
			});

			ins.clearTargetHub();
			ins.ui.attachScanEvents();

		} else if (ins.targetHub.health > 0) {
			customLog("Sending hack progress to server");
			emit('hubHackProgress', {
				hubID: ins.targetHub.id,
				hubName: ins.targetHub.name,
				//hubIndex: ins.targetHub.key,
				timestamp: Date.now() //,
			});

			setTimeout(ins.hackHub, ins.targetHub.hackProgressInterval);

		} else {

		}
	},

	renderLockout: function() {
		msg(ins.ui.text.lockedOut, 'lockout');
		$('#container').addClass('lockScreen');
		ins.clearTargetHub();
		emit('playerLeftHubRange', {});

		$('#scanButton').off('click').css({'display': 'none'});
		//$('#scanButton').addClass('lockClass');
	}
};


var gov = {

	ui: {
		text: {
			'ping': {
				'special': '<span>Press <div id="textIconGov" class="icon-in-text search-icon"></div> below for latest locations of active suspects + allies. (Locations will only update when targets are using mobile devices.)</span><span><b>Get within 20 meters of an active suspect to lock their mobile device.</b></span>'
				//2: "<b>Get within 20 meters of an active suspect to lock their mobile device.</b>"
			},
			'capturing': "Active suspect in range!<br />Locking their device...",
			'inRange': "Active suspect in range! Click their marker to disable/lock their mobile device.",
			'inRangeButDark': "Suspect may be in range, but has gone dark. A device can only be disabled when suspect is using it.",
			'captureExpired': {
				'special': '<span>Lockout window expired. Press <div id="textIconGov" class="icon-in-text search-icon"></div> again to see if suspect is still in range.'
			}
		},
		attachPingEvents: function() {
			msg(gov.ui.text.ping);

			customLog("GovUI ping events attached");

			$('#searchButton').off('click').on('click', function() {
				//msg('Ping button clicked');
				viz.headerToggle.contract();

				var pingFunction = function() {
					emit('findSuspects', {
						existingLocData: []
					});
				};

				sendStoredLocation(pingFunction);

				if (!gov.ui.pingCircle.animRunning) {
					customLog("calling ping animation");
					//gov.ui.pingCircle.reCenter();
					gov.ui.pingCircle.animate();

					$(gov.ui.pingCircle.domElement).on('animationend webkitAnimationEnd', function() {

						//$('.onMapPingCircle').on('animationend webkitAnimationEnd', function() {

						//tempPingCircle[0].classList.remove('run');
						gov.ui.pingCircle.animRunning = false;

						customLog("Animation removed");
					});
				}
			});
		}
	},

	captureRange: 20,

	suspectMarker: {
		'marker-size': 'large',
		'marker-symbol': 'pitch',
		'marker-color': '#ff0000'
	},

	agentMarker: {
		'marker-size': 'large',
		'marker-symbol': 'police',
		'marker-color': '#0000ff',
		'fill-opacity': 0.5
	},

	renderUI: function() {

		customLog("Render UI Called. ClientState.uiRendered is ");
		customLog(clientState.uiRendered);

		if (!clientState.uiRendered) {
			clientState.uiRendered = true;

			customLog("Rendering Gov UI");
			viz.addSuspectContainer();

			//var helpButton = viz.helpButton();
			var pingButton = viz.searchButton();
			$('#mobileFooter').prepend(pingButton); //,helpButton);

			viz.helpScreen.create();
			viz.makeFooter();

			//app['ui']['headerToggle'] = viz.headerToggle.create('gov');
			gov.ui['headerToggle'] = viz.headerToggle.create('gov');
			//store a reference for calling "Msg, etc"
			app['headerToggle'] = gov.ui.headerToggle;
			//app.headerToggle.forceExpand();
			customLog('Added header toggle:');
			console.log(gov.ui.headerToggle);
			gov.ui['pingCircle'] = viz.pingCircle('pingCircleID'); //viz.addPingCircle();

			// gov.ui.attachPingEvents();
		}

		gov.ui.attachPingEvents();
	},

	renderHubs: function(hubData) {
		//hubs = hubData;

		//only add hubs if not already rendered
		if (!clientState.hubsRendered) {

			$.each(hubData, function(index, h) {
				var thisHub = viz.hub(h);
				hubs.push(thisHub);

			});
		}

		$.each(hubs, function(index, h) {

			if (!clientState.hubsRendered) {

				h.area.addTo(map);
				h.marker.addTo(map);
				//h.marker.openPopup();

				// if (h.alertState > 0){

			}

			if (!h.live) {
				h.shutDown();
			} else {
				h.setFlashByAlertState();
			}
		});

		customLog("Hub setup data from server: ");
		customLog(hubs);

		if (clientState.hubsRendered) {
			customLog("Hubs already rendered, just updating.");
		} else {
			customLog("Hubs not rendered yet, adding.");
		}

		clientState.hubsRendered = true;

	},

	//GETTING BIG... Move server-side?
	suspectRangeCheck: function() {
		var otherPlayers = clientState.allPlayers;
		var capturableFound = false;
		var playerRanges = {};

		for (id in otherPlayers) {

			//Check if other player on Ins team and not locked out already
			if (otherPlayers[id].team == 'ins' && !otherPlayers[id].lockedOut) {
				//calculate distance ot other player
				var dist = player.distanceTo(otherPlayers[id].latestPos);
				customLog("Distance to " + otherPlayers[id].localID + " is " + dist + "m");

				//check if capture criteria met. 
				//When autocapture is on, will only return true when no capturable player has been found
				//This prevents capturing multiple in-range players at once
				var captureCriteriaMet = function(autoCapture) {
						if (autoCapture) {
							if (dist <= gov.captureRange && !otherPlayers[id].goneDark && !capturableFound) {
								return true;
							} else {
								return false;
							}
						} else {
							if (dist <= gov.captureRange && !otherPlayers[id].goneDark) {
								return true;
							} else {
								return false;
							}
						}
					}
					//if (dist <= gov.captureRange && !otherPlayers[id].goneDark && !capturableFound) {

				if (captureCriteriaMet(app.settings.autoCapture)) {
					capturableFound = true;
					otherPlayers[id].inCaptureRange = true;
					otherPlayers[id].attachCaptureEvents();
					// msg(gov.ui.text.inRange, 'urgent'); //MOVED TO CAPTURE EVENTS FOR MORE CONTROL

				} else if (dist <= gov.captureRange && otherPlayers[id].goneDark) {
					//mspg("Suspect may be in range, but has gone dark. Suspect must be using device to successfully initiate lockout");
					if (otherPlayers[id].inCaptureRange) {
						otherPlayers[id].inCaptureRange = false;
						otherPlayers[id].clearCaptureEvents();
						gov.ui.attachPingEvents();
					}
					msg(gov.ui.text.inRangeButDark);
				} else {
					//TRYING WITH JUST ELSE...REATTACING EVENTS SHOULDN'T BE PROBLEM

					otherPlayers[id].inCaptureRange = false;
					otherPlayers[id].clearCaptureEvents();
					gov.ui.attachPingEvents();
				}


				var distThreshold = 2000;

				if (dist < distThreshold) {
					customLog("Sending close warning to " + id);

					playerRanges[id] = dist;
					// otherPlayerID: id,
					// distance: dist//'100'
				} //);
			}
			// if (dist < 100) {
			// 	customLog("Sending close warning to " + id);

			// 	emit('agentGettingClose', {
			// 		playerID: player.localID,
			// 		otherPlayerID: id,
			// 		distance: dist//'100'
			// 	});
			// }
			//}
		}

		emit('agentGettingClose', {
			govPlayerID: player.localID,
			ranges: playerRanges //'100'
		});
	},

	captureComplete: function(capturedPlayer) {
		capturedPlayer.marker.captureCircle.clearAnimation();
		delete capturedPlayer.marker['captureCircle'];
		capturedPlayer.clearCaptureEvents();
		customLog('Deleted capture circle and cleared capture events for ' + capturedPlayer.userID + '. Marker now: ');
		customLog(capturedPlayer.marker);

		customLog("Sending captureComplete for " + capturedPlayer.userID + ":");
		customLog(capturedPlayer);
		emit("capturedPlayer", {
			userID: capturedPlayer.userID,
			team: capturedPlayer.team,
			localID: capturedPlayer.localID
		});
	},

	startCaptureFn: function() {

	},

	stopCaptureFn: function() {

	},

	renderPlayers: function(pData) {

		var players = clientState.allPlayers;
		customLog("Current allPlayers before adding: ");
		customLog(players);

		var updateAndRender = function() {

			$.each(pData, function(userID, playerData) {

				customLog("Player ID: " + userID);

				if (!(userID in players)) {
					clientState.addPlayer(playerData, userID);
					players[userID].updateLocData(playerData);
				} else {
					players[userID].updateLocData(playerData);
					var tagText = convertTimestamp(playerData.locData[0].time);
					//if (players[userID].team == 'ins' && !players[userID].goneDark){
					if (!players[userID].goneDark) {
						tagText = "now";
					}

					var textLn = "";
					switch (players[userID].status) {
						case 'dark':
							textLn = "(Dark at " + tagText + ")";
							break;
						case 'locked':
							textLn = "[Device locked]";
							break;
						default:
							textLn = "(As of " + tagText + ")";
					}
					//OTHER TEXT TO FILL IN... SWITCH ON STATUS
					//Gone dark as of
					//locked out at
					players[userID].marker.updateTagText({
						'text': {
							ln1: textLn
						}
					});
				}

			});
		};

		var findToSelect = function() {
			var toSelect;
			var liveSuspectFound = false;
			//var darkSuspectFound = false;
			var suspectFound = false;

			for (id in players) {
				customLog("Status for " + players[id].localID + " is " + players[id].status);

				switch (players[id].status) {
					case 'active':
						liveSuspectFound = true;
						toSelect = players[id];
						customLog("Found live suspect to select");
						break;
					case 'dark':
						if (!liveSuspectFound) {
							suspectFound = true;
							customLog("Found suspect to select");
							toSelect = players[id];
						}
						break;
					case 'agent':
						if (!liveSuspectFound && !suspectFound) {
							toSelect = players[id];
							customLog("Found agent to select");
						}
						break;
					default:
				}
			}

			if (toSelect === undefined) {
				var playerKeysArr = Object.keys(players);
				if (playerKeysArr.length > 0) {
					toSelect = players[playerKeysArr[playerKeysArr.length - 1]];
					customLog("Found no one to select, just selecting last player");
				} else {
					customLog("ERROR: No selectable player found.");
				}
			}

			try {
				toSelect.marker.setSelected();
			} catch (error) {
				customLog(error);
			}
		};

		//waits to allow some animation if server responds immediately
		if (gov.ui.pingCircle.animRunning) {
			setTimeout(function() {
				gov.ui.pingCircle.clearAnimation();
				updateAndRender();
				findToSelect();
				gov.suspectRangeCheck();
			}, 1500);
		} else {
			updateAndRender();
			findToSelect();
			gov.suspectRangeCheck();
		}

	}

};

customLog("Team functions loaded");