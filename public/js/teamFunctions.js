var ins = {
	ui: {
		'hubPointers': [],
		'maxHubsDetected': 3,

		attachScanEvents: function() {
			msg("Press the button below to scan for active surveillance sites nearby.");

			$('#scanButton').removeClass('hackReady')
				.removeClass('uploadProgress')
				.removeClass('hackAnim')
				.removeClass('hackComplete')
				.addClass('scanIcon');

			$('#scanButton').off('click').on('click', function() {
				console.log("SCAN BUTTON CLICKED");

				centerOnPlayer();

				var scanFunction = function() {
					emit('detectHubs', {
						playerPos: player.pos,
						existingLocData: []
					});
				};

				storeAndSendLocation(scanFunction);

				if (!ins.ui.scanButton.animRunning) {
					console.log("calling scan animation");

					ins.ui.scanButton.animRunning = true;
					ins.ui.scanButton.animate();
				}
			});
		},

		attachHackEvents: function() {
			var btn = $('#scanButton');

			btn.removeClass('scanIcon').addClass('hackReady');
			btn.off('click').on('click', function() {
				msg({
					1: "Uploading virus.",
					2: " Stay in range with phone active or upload will halt."
				}, 'urgent');

				ins.ui.refreshHackProgress();

				btn.removeClass('hackReady')
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
				.removeClass('hackReady')
				.removeClass('uploadProgress')
				.removeClass('hackAnim')
				.addClass('hackComplete');

			ins.clearTargetHub();

			msg("Hack Complete", 'success');
			setTimeout(function() {
				console.log("resetting scan");
				ins.ui.attachScanEvents();
			}, 3000);
		}
	},

	//hackRange: 75,

	renderUI: function() {

		//***doing this in reverse so pointer[0] will be last appended (i.e. on top?)
		for (var i = ins.ui.maxHubsDetected - 1; i >= 0; i--) {
			var newPointer = viz.scanPointer.init('spinner' + i);
			newPointer.addTo('#container');
			this.ui.hubPointers.unshift(newPointer);
		}

		this.ui['scanButton'] = viz.scanButton();
		$('#container').append(this.ui['scanButton']);

		ins.ui.attachScanEvents();

		console.log('Hub pointers created: ');
		console.log(this.ui.hubPointers);

	},

	popPointers: function() {
		for (i in ins.ui.hubPointers) {

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
		msg({
			1: "Surveillence site in range!",
			2: "<b>Press below to begin hacking.</b>",
			3: "(NOTE: More hackers will increase hack speed.)"
		}, 'urgent');

		ins.targetHub = targetHub;

		ins.ui.attachHackEvents();
	},

	pointToHubs: function(hubArray, callback) {

		var getAngleFromMapCenter = function(screenPos) {

			var screenCenter = map.project(map.getCenter());
			console.log("Map Center is " + screenCenter);

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
			console.log("Angle to " + hubArray[i].name + " is " + hubArray[i]['angleTo'] + " degrees");

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
			window.alert("Hack interrupted!");
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
			console.log("Sending hack progress to server");
			emit('hubHackProgress', {
				hubID: ins.targetHub.id,
				hubName: ins.targetHub.name,
				hubIndex: ins.targetHub.key,
				timestamp: Date.now() //,
			});

			setTimeout(ins.hackHub, ins.targetHub.hackProgressInterval);

		} else {

		}
	},

	renderLockout: function() {
		msg("Compromised", 'lockout');
		$('#container').addClass('lockScreen');
		$('#scanButton').off('click');
		//$('#scanButton').addClass('lockClass');
	}
};


var gov = {

	ui: {
		attachPingEvents: function() {
			msg({
				1: "Press the button below for latest locations of tracked suspects and allies.",
				2: "(NOTE: Locations will only update when targets are using their mobile devices.)"
			});

			$('#searchButton').off('click').on('click', function() {
				//msg('Ping button clicked');

				var pingFunction = function() {
					emit('findSuspects', {
						existingLocData: []
					});
				};

				storeAndSendLocation(pingFunction);

				if (!gov.ui.pingCircle.animRunning) {
					console.log("calling ping animation");
					gov.ui.pingCircle.reCenter();

					gov.ui.pingCircle.animRunning = true;
					gov.ui.pingCircle.animateBurst();

					var tempPingCircle = document.getElementsByClassName('onMapPingCircle');
					tempPingCircle[0].classList.add('run');
					//console.log(tempPingCircle[0]);

					$('.onMapPingCircle').on('animationend webkitAnimationEnd', function() {

						tempPingCircle[0].classList.remove('run');
						gov.ui.pingCircle.animRunning = false;

						console.log("Animation removed");
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
		viz.addSuspectContainer();

		var pingButton = viz.searchButton();
		$('#mobileFooter').prepend(pingButton);

		gov.ui['pingCircle'] = viz.addPingCircle();

		gov.ui.attachPingEvents();
	},

	renderHubs: function(hubData) {
		//hubs = hubData;

		$.each(hubData, function(index, h) {
			var thisHub = viz.hub(h);
			hubs.push(thisHub);

		});

		$.each(hubs, function(index, h) {

			h.area.addTo(map);
			h.marker.addTo(map);

			// if (h.alertState > 0){

			// }

			if (!h.live) {
				h.shutDown();
			} else {
				h.setFlashByAlertState();
			}
		});

		console.log("Hub setup data from server: ");
		console.log(hubs);

	},

	suspectRangeCheck: function() {
		var otherPlayers = clientState.allPlayers;

		for (id in otherPlayers) {

			if (otherPlayers[id].team == 'ins' && !otherPlayers[id].lockedOut) {

				var dist = player.distanceTo(otherPlayers[id].latestPos);
				console.log("Distance to " + otherPlayers[id].localID + " is " + dist + "m");

				if (dist <= gov.captureRange) {
					otherPlayers[id].inCaptureRange = true;
					//otherPlayers[id].marker.attachCaptureEvents();
					otherPlayers[id].attachCaptureEvents();
					msg("Suspect in capture range! Click and hold on suspect marker to lock out device.", 'urgent');

				} else if (otherPlayers[id].inCaptureRange) {

					//} else if (otherPlayers[id].captureEventsAttached) {
					otherPlayers[id].inCaptureRange = false;
					//otherPlayers[id].marker.clearCaptureEvents();
					otherPlayers[id].clearCaptureEvents();
					gov.ui.attachPingEvents();
				}

				if (dist < 100) {
					console.log("Sending close warning to " + id);

					emit('agentGettingClose', {
						playerID: player.localID,
						otherPlayerID: id,
						distance: '100'
					});
				}
			}
		}
	},

	captureComplete: function(capturedPlayerRef) {
		console.log("Sending captureComplete for " + capturedPlayerRef.userID + ":");
		console.log(capturedPlayerRef);
		emit("capturedPlayer", {
			userID: capturedPlayerRef.userID,
			team: capturedPlayerRef.team,
			localID: capturedPlayerRef.localID
		});
	},

	startCaptureFn: function() {

	},

	stopCaptureFn: function() {

	},

	renderPlayers: function(pData) {

		var players = clientState.allPlayers;
		console.log("Current allPlayers before adding: ");
		console.log(players);

		$.each(pData, function(userID, playerData) {

			console.log("Player ID: " + userID);

			//ADD CHECK FOR OWN PLAYER
			//if (userID = ownplayer's id)
			// player.type = "self"

			if (!(userID in players)) {
				players[userID] = clientState.addPlayer(playerData, userID);
				players[userID].updateLocData(playerData);
			} else {
				players[userID].marker.updatePopup({
					'text': {
						ln1: "(As of " + convertTimestamp(playerData.locData[0].time) + ")"
					}
				});
				players[userID].updateLocData(playerData);
			}

		});

		var findToSelect = function() {
			var toSelect;
			// var liveSuspectFound = false;
			// var darkSuspectFound = false;
			var suspectFound = false;
			//var agentFound = false;
			reverseForIn(players, function(id) {
				//var toSelect = {};
				if (players[id].type == 'suspect' && !players[id].goneDark) {
					toSelect = players[id];
					console.log("Found live suspect to select");
					//players[id].marker.setSelected();
					return;
				} else if (players[id].type == 'suspect' && !suspectFound) {
					suspectFound = true;
					console.log("Found suspect to select");
					toSelect = players[id];
				} else if (players[id].type == 'agent' && !suspectFound) {
					toSelect = players[id];
					console.log("Found agent to select");
					//players[id].marker.setSelected();
					//return;
				}
			});
			if (toSelect !== undefined) {
				toSelect.marker.setSelected();
			}
		};

		findToSelect();

		// for (id in players) {
		// 	var latestSuspect = {};
		// 	if (players[id].type == 'suspect' && !players[id].goneDark) {
		// 		players[id].marker.setSelected();
		// 	}

		// }

		gov.suspectRangeCheck();
	}

};

console.log("Team functions loaded");