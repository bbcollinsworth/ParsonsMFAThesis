var viz = {

	mainStyling: {
		'gov': {
			'#app': 'gov-app-styling',
			'#alertBox': 'gov-alert-styling',
			'#headerBackdrop': 'gov-backdrop',
			'#mobileFooter': 'gov-footer',
			'.help-body': 'help-gov'
		},
		'ins': {
			'#app': 'ins-app-styling',
			'#alertBox': 'ins-alert-styling',
			'#headerBackdrop': 'ins-backdrop',
			'.help-body': 'help-ins'
		}
	},

	audio: {
		'gov': {
			'file1': {
				'url': 'audio/GovMsg1.mp3',
				'id': '#GovMsg1',
				'played': false
			},
			'file2': {
				'url': 'audio/GovMsg2.mp3',
				'id': '#GovMsg2',
				'played': false
			}
		},
		'ins': {
			'file1': {
				'url': 'audio/InsMsg1.mp3',
				'id': '#InsMsg1',
				'played': false
			},
			'file2': {
				'url': 'audio/InsMsg2.mp3',
				'id': '#InsMsg2',
				'played': false
			}
		}
	},
	audioPopup: function(fileToPlay) {
		var msgObj = {
			1: "You have a new message.",
			2: "<i>(Put on headphones or turn up speaker.)</i>",
			'button': {
				txt: 'LISTEN',
				onClick: 'playAudio',
				args: fileToPlay
			}
		};

		return msgObj;
	},
	hide: function(elToHide) {
		$(elToHide).css({
			'display': 'none'
		});
	},
	geoPrompt: {
		shouldRefresh: false,
		button: {
			id: 'locTestButton',
			txt: 'Detect Location'
		},
		fillMsg: function(msgObj) { //, tryRefresh) {
			//msgObj['btn'] = '<div id="locTestButton">Detect Location</div>';
			msgObj['button'] = viz.geoPrompt.button;

			msg(msgObj, 'setup');

			this.attachTestEvents(); //tryRefresh);
		},
		render: {
			initial: function() {
				viz.geoPrompt.fillMsg({
					1: "This app requires geolocation.",
					2: "Click below to test if location detection is working. <b>If prompted by your browser, please 'allow' location detection.</b>"
				});
			},
			success: function() {
				clientState.features.geolocation.ready = true;
				clientState.posStored = true;
				app.trackLocation();
				customLog('Server says Geoloc test successful');

				$('#locTestButton').text('Success!');

				setTimeout(function() {
					startup.svcCheck(); //re-run service check
				}, 500);
			},
			blocked: function() {
				// storage.setItem('lastGeoTestResult', 'blocked');
				viz.geoPrompt.fillMsg({
					1: "<span class=\"setup-header\">ERROR: </span>Geolocation is currently <b>blocked</b> for this website or browser. Please go into the browser's settings and <b>allow geolocation</b>, then test again.",
					2: "<span class=\"setup-header\">If you're using an iPHONE:</span>Go to SETTINGS > PRIVACY > LOCATION SERVICES and set this browser to 'while using.'"
				}); //, true);
			}
		},
		sendTestResult: function(eMsg, eCode) {
			var rObj = {
				playerPos: player.pos
			};

			if (eMsg !== undefined) {
				rObj.errorMsg = eMsg;
				rObj.errorCode = eCode;
			}
			emit('geoTestResult', rObj);
		},
		attachTestEvents: function() { //refresh) {
			$('#locTestButton').off('click').on('click', function() {

				if (viz.geoPrompt.shouldRefresh) {
					//assumes result of last test has been stored
					window.location.reload();
				} else {

					//viz.enableFullScreen();

					emit('geoTestStart', {
						timestamp: Date.now()
					});

					$('#locTestButton').text("Testing...");

					var errorText = 'none';

					geo.getCurrentPosition(function(position) {
						console.log('ReadyTest Position is: ' + position.coords.latitude + ', ' + position.coords.longitude);
						window.player.pos.update({
							lat: position.coords.latitude,
							lng: position.coords.longitude,
							time: position.timestamp
						});

						//errorText = 'Client thinks test was successful';
						viz.geoPrompt.sendTestResult();

					}, function(error) {

						switch (error.code) {
							case 1: // 1 === error.PERMISSION_DENIED
								errorText = 'User does not want to share Geolocation data.';
								break;
							case 2: // 2 === error.POSITION_UNAVAILABLE
								errorText = 'Position of the device could not be determined.';
								break;
							case 3: // 3 === error.TIMEOUT
								errorText = 'Position Retrieval TIMEOUT.';
								break;
							default: // 0 means UNKNOWN_ERROR
								errorText = 'Unknown Error';
								break;
						}
						customLog(errorText);
						viz.geoPrompt.sendTestResult(errorText, error.code);

					});

					// viz.geoPrompt.sendTestResult(errorText);
				}
			});
		}
	},
	//thanks to MDN: https://developer.mozilla.org/en-US/docs/Web/API/Fullscreen_API
	enableFullScreen: function() {
		if (!document.fullscreenElement && // alternative standard method
			!document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement) { // current working methods
			if (document.documentElement.requestFullscreen) {
				document.documentElement.requestFullscreen();
			} else if (document.documentElement.msRequestFullscreen) {
				document.documentElement.msRequestFullscreen();
			} else if (document.documentElement.mozRequestFullScreen) {
				document.documentElement.mozRequestFullScreen();
			} else if (document.documentElement.webkitRequestFullscreen) {
				document.documentElement.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
			}
		}

	},

	makeMessage: function(text, msgType) {
		//var madeMessage = "";
		var made = {
			message: "" //,
		};

		var attr = {
			'popup': {
				'defaultButton': {
					'alwaysAttach': true,
					'class': 'popup-button',
					'id': 'popupButton' + viz.popupCount,
					'txt': 'OK',
					'onClick': 'closePopup',
					'args': '#popupID' + viz.popupCount
				}
			},
			'header': {

			}
		};

		//INTERNAL FUNCTIONS =====================
		var isString = function() {
			if (typeof text === 'string' || text instanceof String) {
				return true;
			} else {
				return false;
			}
		};

		var makeButton = function(buttonInfo) {

			var idString = "";
			var classString = "";
			var elToAttachEvent = "";

			var setClass = function(btnClass) {
				classString = 'class="' + btnClass + ' ' + btnClass + '-' + player.team + '"';
				elToAttachEvent = '.' + btnClass;
			};

			if ('class' in buttonInfo) {
				setClass(buttonInfo.class);
			} else {
				setClass(msgType + '-button'); //+ viz.popupCount);
			}

			if ('id' in buttonInfo) {
				idString = 'id="' + buttonInfo.id + '"';
				elToAttachEvent = '#' + buttonInfo.id;
			}

			made.message += '<div ' + idString + ' ' + classString + '>' + buttonInfo.txt + '</div>';

			if ('onClick' in buttonInfo) {
				made.event = {
					element: elToAttachEvent,
					fnName: buttonInfo.onClick
				};
				if ('args' in buttonInfo) {
					made.event.args = buttonInfo.args;
				}
			}

		};
		//===========================================
		//MESSAGE MAKING PROCESS:

		if (isString()) {
			made.message = '<p>' + text + '</p>';
		} else {
			for (line in text) {
				switch (line) {
					case 'button':
						//skip
						break;
					case 'special':
						made.message += text[line];
						break;
					default:
						made.message += '<p>' + text[line] + '</p>';
				}
			}
		}

		var buttonMade = false;
		if (!isString() && ('button' in text)) {
			makeButton(text.button);
			buttonMade = true;
		} else if (msgType in attr) {
			//console.log("Type " + msgType + " found!");
			if ('defaultButton' in attr[msgType]) {
				//if (attr[msgType].defaultButton.alwaysAttach || !buttonMade){
				console.log("Adding default button for " + msgType);
				makeButton(attr[msgType].defaultButton);

			}
		}

		// console.log("Message to Show is: ");
		// console.log(made);
		return made;
	},
	attachMsgEvents: function(eventInfo) {
		console.log("Button in object: attaching event!");

		$(eventInfo.element).off('click').on('click', function() {
			//will this be ok?
			app.btnEvents[eventInfo.fnName](eventInfo.args, $(this));
		});

	},
	popupCount: 0,
	popupBaseZ: 5000,
	popup: function(text, styling) {

		//this.teamStyle = {
		teamStyle = {
			'gov': 'popup-gov',
			'ins': 'popup-ins'
		};

		viz.popupCount += 1;

		var msgHTML = viz.makeMessage(text, 'popup');

		var renderedAlert = $('<div />', {
			'class': 'popup-alert popup-invisible ' + teamStyle[player.team],
			'id': 'popupID' + viz.popupCount,
			'html': '<div class="popup-icon popup-icon-' + player.team + '">!</div>' + msgHTML.message, //'<p>Alert content</p><div id="popupButton">OK</div>'
			'css': {
				'z-index': viz.popupBaseZ - viz.popupCount
			}
		});
		$('#container').append(renderedAlert);

		$(renderedAlert).removeClass('popup-invisible').addClass('popup-visible');

		if ('event' in msgHTML) {
			viz.attachMsgEvents(msgHTML.event);
		}

	},
	headerMessage: function(text, styling) {

		var msgHTML = viz.makeMessage(text, 'header');

		$('#alertBodyText').html(msgHTML.message);

		if ('event' in msgHTML) {
			viz.attachMsgEvents(msgHTML.event);
		}

		viz.headerStyles.update(styling);

		if (('headerToggle' in app) && styling !== viz.headerStyles.current) {
			app.headerToggle.forceExpand();
		}

		viz.headerStyles.current = styling;

	},
	headerStyles: {
		'current': "normal",
		update: function(style) {
			var s = this;

			var refresh = function(styleKey, removeOrAdd) {
				var classTypes = {
					'boxClass': '#alertBox',
					'controlClass': '#alertBoxControl',
					'buttonClass': '.header-button'
				};

				for (key in classTypes) {
					if (key in s.classes[styleKey]) {
						$(classTypes[key])[removeOrAdd](s.classes[styleKey][key]);
					}
				}
			};

			for (c in s.classes) {
				refresh(c, 'removeClass');
			}
			if (style === undefined) {
				style = 'normal';
			}
			if (style in s.classes) {
				customLog("adding header styling! " + style);
				refresh(style, 'addClass');
			}

		},
		classes: {
			get normal() {
				switch (player.team) {
					case 'gov':
						return {
							//boxClass: 'gov-default-alert',
							controlClass: 'ui-alt-icon',
							buttonClass: 'gov-header-button'
						};
					default:
						return {};
				}
			},
				'setup': {
					boxClass: 'setup-alert',
					controlClass: 'control-hidden'
			},
			'intro': {
				controlClass: 'control-hidden'
			},
			'urgent': {
				boxClass: 'urgent-alert'
			},
			'ins-urgent': {
				boxClass: 'ins-urgent-alert'
			},
			'success': {
				boxClass: 'success-alert',
				controlClass: 'control-hidden'
			},
			'lockout': {
				boxClass: 'lockout-alert',
				controlClass: 'control-hidden'
			} //,
			//'normal': 'normal-alert'
		}
	},

	makeFooter: function() {
		viz.helpButton.create();
		viz.scoreDisplay.create();
	},

	helpButton: {
		id: '#helpMenuHeader',
		create: function() {
			var b = $('<div />', {
				'html': "<span>Help</span>",
				'id': "helpMenuHeader",
				'class': "footer-button"
			});
			$('#mobileFooter').append(b);

			viz.helpButton.attachEvents();
		},
		attachEvents: function() {
			$(viz.helpButton.id).off('click').on('click', viz.helpScreen.show);
		}
	},

	scoreDisplay: {
		id: '#score',
		text: {
			gov: function() {
				return 'Neutralized: <span id="scoreCount">' + app.score.hackers.locked + '</span>';
			},
			ins: function() {
				return 'Sites hacked: <span id="scoreCount">' + app.score.hubs.hacked + '</span>'; //\/<span id="scoreTotal"></span>'
			}
		},
		create: function() {
			var t = viz.scoreDisplay.text[player.team]();
			var b = $('<div />', {
				'html': "<span>" + t + "</span>",
				'id': "score",
				'class': "footer-button"
			});

			$('#mobileFooter').append(b);
			app.updateScore(app.score);
		},
		update: function(newScore) {
			customLog("Updating score to: " + newScore);
			$('#scoreCount').text(newScore);
		}
	},

	helpScreen: {
		btn: "",
		elID: '#helpScreen',
		textContainerID: '#helpBody',
		get element() {
			return $(viz.helpScreen.elID);
		},
		get helpButton() {
			return $('#helpMenuHeader');
		},
		info: {
			'gov': {
				'search': {
					type: 'help-img-key',
					imgClass: 'search-icon',
					text: 'Search Button: Tap to refresh locations of all active device users'
				},
				'hub': {
					type: 'help-img-key',
					imgClass: 'hub-icon',
					text: 'Sensitive security sites that hackers may target'
				},
				'suspect': {
					type: 'help-img-key',
					imgClass: 'suspect-icon',
					text: 'Location of suspected hacker (when hacker is using a device)'
				},
				'dark': {
					type: 'help-img-key',
					imgClass: 'dark-icon',
					text: 'Last known location of suspects not currently using devices'
				},
				'agent': {
					type: 'help-img-key',
					imgClass: 'agent-icon',
					text: 'Fellow agents and allies'
				},
				'locked': {
					type: 'help-img-key',
					imgClass: 'locked-icon',
					text: 'Hackers who have already been neutralized'
				}
			},
			'ins': {
				'scan': {
					type: 'help-img-key',
					imgClass: 'scan-icon button-icon-style',
					text: 'Scan Button: Tap to detect direction and distance of the 3 surveillance sites nearest you'
				},
				'hack': {
					type: 'help-img-key',
					imgClass: 'hack-icon button-icon-style',
					text: 'Hack Button: This icon will show when you\'re close enough to hack a surveillance site'
				},
				'threat': {
					type: 'help-img-key',
					imgClass: 'threat-icon',
					text: 'Threat Meter: This will turn red when State Agents are close'
				}
			}
		},
		create: function() {
			var data = viz.helpScreen.info[player.team];
			for (d in data) {
				console.log("ADDING ITEM " + d + " to helpScreen");
				viz.helpScreen.addItem(data[d]);
			}
		},
		addItem: function(info) {
			var itemTypes = {
				'help-img-key': function() {
					var i = '<div class="help-img ' + info.imgClass + '"></div>';
					i += '<div class="help-text"><p>' + info.text + '</p></div>';

					return i;
				},
				'help-text': function() {
					return '<div class="help-text"><p>' + info.text + '</p></div>';
				}
			};
			//var itemObj = {};

			var item = $("<div />", {
				'class': info.type,
				'html': itemTypes[info.type]()
			});

			console.log("Appending help item:");
			console.log(item);

			$(viz.helpScreen.textContainerID).append(item);
		},
		show: function() {
			var e = viz.helpScreen.element;
			e.addClass('help-visible').removeClass('help-invisible');
			e.off('click').on('click', viz.helpScreen.hide);
		},
		hide: function() {
			var e = viz.helpScreen.element;
			e.addClass('help-invisible').removeClass('help-visible');
		} //,
		//toggle: function()
	},

	headerToggle: {
		minClass: 'header-minimized',
		expandIconClass: 'ui-icon-carat-d',
		contractIconClass: 'ui-icon-carat-u',
		get headerText() {
			return $('#alertBodyText');
		},
		// get icon(){
		// 	return $('#alertBoxControl');
		// },
		iconSetup: {
			'gov': $("<div />", {
				'id': "alertBoxControl",
				'class': "alert-control ui-btn ui-corner-all ui-icon-carat-u ui-btn-icon-notext ui-nodisc-icon ui-alt-icon"
			}),
			'ins': $("<div />", {
				'id': "alertBoxControl",
				'class': "alert-control ui-btn ui-corner-all ui-icon-carat-u ui-btn-icon-notext ui-nodisc-icon"
			})
		},
		expand: function() {
			var hT = this;
			hT.headerText.slideDown(400, 'easeOutCubic');
			hT.icon.removeClass(hT.expandIconClass).addClass(hT.contractIconClass);
		},
		contract: function() {
			var hT = this;
			hT.headerText.slideUp(400, 'easeOutCubic');
			hT.icon.removeClass(hT.contractIconClass).addClass(hT.expandIconClass);
		},
		create: function(team) {
			var hT = this;
			$('#alertPopoutSpace').html(hT.iconSetup[team]);

			hT['icon'] = $('#alertBoxControl');

			// hT.icon.off('click').on('click', function() {
			setTimeout(function() {
				$('#alertBox').off('click').on('click', function() {

					if (hT.icon.hasClass(hT.expandIconClass)) {
						hT.expand();
					} else {
						hT.contract();
					}
				});
			}, 500);

			return hT;
		},
		forceExpand: function() {
			if (this.icon.hasClass(this.expandIconClass)) {
				this.expand();
			}
		}
	},

	markerOptions: {
		'suspect': {
			zIndexOffset: 1000,
			opacity: 0.8 //,
		},
		'agent': {
			opacity: 0.5 //,
		} //,
	},

	markerIconOptions: {
		suspect: {
			'marker-size': 'large',
			'marker-symbol': 'pitch',
			'marker-color': '#ff0000',
			'className': 'suspect-marker'
		},
		agent: {
			'marker-size': 'medium',
			'marker-symbol': 'police',
			'marker-color': '#00003c',
			'className': 'agent-marker'
		}
	},

	//CREATE CUSTOM MARKER WITH ADD'L PROPERTIES + FUNCTIONS
	marker: function(type, pos, isDraggable) {

		if (isDraggable === undefined) {
			isDraggable = false;
		}

		var m = L.playerMarker([pos.lat, pos.lng], {
			//var m = L.marker([pos.lat, pos.lng], {
			icon: L.mapbox.marker.icon(viz.markerIconOptions[type]),
			draggable: isDraggable,
			opacity: viz.markerOptions[type].opacity,
			zIndexOffset: viz.markerOptions[type].zIndexOffset || 0
		});
		// .on('mouseDownEvent',gov.startCaptureFn)
		// .on('mouseUpEvent',gov.stopCaptureFn);

		return m;
	},

	pingSetup: {
		//radius: 0,
		options: {
			//'radius': '',
			'className': "onMapPingCircle",
			'fillColor': '#ffffff',
			'fillOpacity': '1.0',
			'stroke': false
		}
	},

	initTrail: function(player) {
		var newTrail = $.extend(true, {
			playerRef: player,
		}, viz.trail);
		return newTrail;
	},

	animDiv: {
		'animRunning': false,

		reCenter: function() {
			var mapCenter = map.latLngToLayerPoint(map.getCenter());
			console.log("Recentering " + this.itemName + " to: " + mapCenter.x + "," + mapCenter.y);

			$(this.domElement).css({
				'left': mapCenter.x,
				'top': mapCenter.y
			});
		},

		animate: function() {

			var a = this;
			a.animRunning = true;
			customLog("Run animation called on animateable " + a.itemName);
			if (a.hasOwnProperty('domElement')) {
				customLog("Animateable DOM element found! Adding class " + a.animateClass);
				$(a.domElement).addClass(a.animateClass);
			} else {
				customLog("Animateable DOM element not found!");

			}
		},

		clearAnimation: function() {
			var a = this;
			this.animRunning = false;
			$(a.domElement).removeClass(a.animateClass);
			customLog("Removing ping animation");
		}

	},

	addAnimDiv: function(className, idName) {

		customLog("Creating animDiv");

		var m = $.extend({}, viz.animDiv);

		var options = {
			'class': className,
		}
		if (idName) {
			options['id'] = idName;
		}

		m['domElement'] = $("<div />", options);

		$('#map').append(m.domElement);

		return m;
	},

	pingCircle: function(domID) {
		var circle = {};

		if (domID) {
			circle = viz.addAnimDiv('ping-circle', domID);
		} else {
			circle = viz.addAnimDiv('ping-circle');
		}

		// var mapCenter = map.latLngToLayerPoint(map.getCenter());

		// $(circle.domElement).css({
		// // 	'left': '50vw',
		// // 	'top': '50vh'
		// 'left': mapCenter.x,
		// 'top': mapCenter.y
		// });

		circle['itemName'] = 'Ping Circle';
		circle['animateClass'] = 'ping-animate';

		customLog("Ping Circle Animateable created");
		console.log(circle);

		return circle;
	},

	captureCircle: function(pos, domID) {

		var className = 'capture-circle';

		var idName = (domID !== undefined) ? domID : 'captureCircleID';
		var iconOptions = {
			className: className,
			iconSize: null
		};
		var markerOptions = {
			icon: L.divIcon(iconOptions),
			interactive: false //,
			//opacity: 0 //1.0*mappedToTime
		};

		var c = L.animMarker([pos.lat, pos.lng], markerOptions);
		c.addTo(map);

		c['animateClass'] = 'capture-animate';
		c['domElement'] = document.getElementsByClassName(className);
		$(c.domElement).attr('id', idName);

		return c;
	},

	trail: {
		settings: {
			maxSize: 15,
			maxOpacity: 0.8,
			maxBlur: 2 //1 less than actual max so there's always a minimum
		},
		markers: [],
		generateTrailMarker: function(pos, oldest) {
			var classesToAdd = 'trail-marker ' + pos.time;
			if (this.playerRef.goneDark) {
				console.log("Gone Dark is " + this.playerRef.goneDark);
				classesToAdd += ' dark-trail';
			}
			//var oldestTime = t.playerRef.oldestTime;
			var mappedToTime = Math.map(pos.time, oldest, Date.now(), 0.1, 1);
			var mappedSize = viz.trail.settings.maxSize * mappedToTime;
			var iconOptions = {
				className: classesToAdd,
				iconSize: [mappedSize, mappedSize]
			};
			var markerOptions = {
				icon: L.divIcon(iconOptions),
				interactive: false,
				opacity: 0 //1.0*mappedToTime
			};

			var thisMarker = L.trailMarker([pos.lat, pos.lng], markerOptions);
			//thisMarker['time'] = pos.time;
			var uniqueClass = "." + pos.time.toString();
			thisMarker['mappedToTime'] = mappedToTime;
			thisMarker['uniqueClass'] = uniqueClass;
			console.log("Unique class for this marker is " + uniqueClass);
			thisMarker.setCSS = function(updatesObject) {
				$(thisMarker.uniqueClass).css(updatesObject);
			};
			thisMarker.animate = function(isLastMarker) {
				setTimeout(function() {
					$(thisMarker.uniqueClass).css({
						'opacity': viz.trail.settings.maxOpacity * mappedToTime
					});
					//FOR IF YOU WANT MARKER TO REFRESH AFTER TRAIL
					// if (isLastMarker){
					// 	$('#app').trigger('trailRendered');
					// }
				}, 1.0 * (1 - mappedToTime) * 1000);
			};
			return thisMarker;
		},
		render: function(callback, args) {
			var t = this;
			var posData = t.playerRef.locData;
			var oldestTime = posData[posData.length - 1].time;
			// var oldestTime = t.playerRef.oldestTime;
			console.log("rendering trail");

			if (t.markers.length > 0) {
				for (n in t.markers) {
					map.removeLayer(t.markers[n]); //.remove();
				}
			}
			t.markers = [];
			for (var i = posData.length - 1; i >= 0; i--) {
				var tMarker = t.generateTrailMarker(posData[i], oldestTime);
				t.markers.push(tMarker);
				var tM = t.markers[(posData.length - 1) - i];
				tM.addTo(map);
				var tDelay = 2.0 * tM.mappedToTime;
				var blur = 1 + viz.trail.settings.maxBlur * tM.mappedToTime;
				tM.setCSS({
					//'transition-delay': tDelay.toString() + "s",
					'-webkit-filter': "blur(" + blur + "px)",
					'filter': "blur(" + blur + "px)"
				});
				if (i === 0) {
					tM.animate(true);
				} else {
					tM.animate();
				}
			}

			console.log("Last path marker is: ");
			console.log(t.markers[0]);

			if (callback) callback(args);

			// $('#app').trigger('trailRendered');
		}
	},

	addSuspectContainer: function() {
		var c = $('<div />', {
			'id': 'suspect-container',
			'class': 'tag-container'
		});

		$('#container').append(c);
	},

	addCaptureCircle: function(pos) {
		var c = L.captureCircle([pos.lat, pos.lng], viz.captureSetup.options);
		return c;
	},



	// ====== HUB VISUALIZATION SETUP ==============//
	hubOptions: {
		area: {
			'stroke': false,
			'className': 'hub-area'
		},
		marker: {
			'weight': 3
		},
		greyOut: '#707070',
		startingFlashSpeed: 1000,
		customPopup: function(hubName) {
			var opts = {
				'className': 'hub-popup'
			}

			var hubPop = L.popup(opts).setContent('Security Site');
			return hubPop;
		}
	},

	hub: function(hData) {
		var h = {
			area: L.circle([hData.lat, hData.lng], hData.hackRange, viz.hubOptions['area']),
			marker: L.circleMarker([hData.lat, hData.lng], viz.hubOptions['marker']), //this.renderMarker(this.markerRadius),
			markerRadius: 10,
			flashing: false,
			alerts: {
				'lvl1': false,
				'lvl2': false,
				'lvl3': false,
				'lvl4': false
			},
			update: function(hubDataFromServer) {
				console.log("UPDATING HUB. Data from server is: ");
				console.log(hubDataFromServer);
				$.extend(true, h, hubDataFromServer);
				console.log("Hub " + h.name + " updated to:");
				console.log(h);
			},
			// alertState: hData.alertState,
			// live: hData.live,
			flash: function(interval) {
				//gov.flashHub(this,interv);
				if (interval === undefined) {
					interval = 1000;
				}

				var c = '#ff0000';

				h.stopFlash();

				h.flashing = true;
				h['flasher'] = setInterval(function() {

					var opts = {
						fillColor: c
					}
					h.area.setStyle(opts);

					h.marker.setStyle(opts);

					if (c == '#ff0000') {
						c = '#0033ff';
					} else {
						c = '#ff0000';
					}
				}, interval);
			},
			stopFlash: function() {
				h.flashing = false;
				if (h.flasher) {
					clearInterval(h.flasher);
					if (h.live) {
						h.area.setStyle({
							fillColor: '#0033ff'
						});
						h.marker.setStyle({
							fillColor: '#0033ff'
						});
					} else {
						h.shutDown();
					}
				}
			},
			setFlashByAlertState: function() {
				if (h.alertState > 0) {
					var flashSpeed = viz.hubOptions.startingFlashSpeed;
					flashSpeed /= h.alertState;
					h.flash(flashSpeed);
				}
			},
			shutDown: function() {
				customLog("Shutting down hub: " + this.name);
				h.live = false;
				h.area.setStyle({
					'fillColor': viz.hubOptions.greyOut
				});
				h.marker.setStyle({
					'color': viz.hubOptions.greyOut
				});
			}
		};

		h.marker.setRadius(h.markerRadius);

		myExtend(h, hData);

		//h.marker.bindPopup(viz.hubOptions.customPopup());

		//$.extend(true, h, hData);

		return h;
	},

	// helpButtonNonFooter: function() {
	// 	var button = $("<div />", {
	// 		'class': "ui-btn basic-button help-btn help-btn-" + player.team,
	// 		'id': "helpButton",
	// 		'html': "<h3>?</h3>" //,
	// 	});
	// 	console.log("Created help button: ");
	// 	console.log(button);
	// 	return button;
	// },

	'threatMeter': {
		'id': "threatMeter",
		'class': 'threat-meter',
		create: function() {
			var meter = $("<div />", {
				'html': '<img id="dataFace" class="data-face" src="css/cssImages/BigDataFace.png"></img>',
				'class': viz.threatMeter.class,
				'id': viz.threatMeter.id //,
			});

			return meter;
		},
		update: function(scale) {

			var style = {
				'height': {
					'pre': '',
					'min': 20,
					'max': 66,
					'post': 'px'
				},
				'background-image': {
					'pre': 'linear-gradient(transparent,rgba(',
					'min': 0,
					'max': 200,
					'post': ',0,0,0.8))'
				}
			}

			var scaleStyle = function(s) {
				return s.pre + Math.floor(Math.map(scale, 0, 1, s.min, s.max)) + s.post;
			};

			var scaled = {};
			for (var attr in style) {
				scaled[attr] = scaleStyle(style[attr]);
			}

			customLog("Updating threatMeter style to: ");
			customLog(scaled);

			$('.' + viz.threatMeter.class).css(scaled);
		}
	},

	searchButton: function() {

		var button = $("<div />", {
			'class': "ui-btn basic-button searchIcon",
			'id': "searchButton" //,
		});

		//button.addClass('searchIcon');

		return button;

	},

	scanSetup: {
		'pointer': {
			'width': '40px',
			'height': '100px'
		}
	},

	scanPointer: {
		transform: {
			translate: "-50%,-50%",
			rotate: "0deg",
			scale: 1
		},
		distanceReading: 100,
		maxDistance: 600,
		updateTransform: function(transformObj) {

			for (operation in this.transform) {
				if (operation in transformObj) {
					this.transform[operation] = transformObj[operation];
				}
			}

			var transformString = "translate(" + this.transform.translate + ") rotate(" + this.transform.rotate + ") scale(" + this.transform.scale + ")";

			var cssUpdate = {
				'webkitTransform': transformString,
				'MozTransform': transformString,
				'msTransform': transformString,
				'OTransform': transformString,
				'transform': transformString
			};

			if ('domID' in this) {
				console.log("Updating css for " + this.domID);
				console.log(cssUpdate);
				//var el = document.getElementById(this.domID);
				//el.setAttribute('transform',transformString);
				$('#' + this.domID).css(cssUpdate);
			} else {
				console.log("Error: no domID to update CSS");
			}
		},

		rotate: function(degrees, time) {
			this.updateTransform({
				'rotate': degrees + "deg"
			});

			if ('domID' in this) {
				if (time !== undefined) {
					$('#' + this.domID).css({
						'transition-duration': time + "s"
					});
				}
			}
		},

		scale: function(size, time) {
			this.updateTransform({
				'scale': size
			});

			if ('domID' in this) {
				if (time !== undefined) {
					$('#' + this.domID).css({
						'transition-duration': time + "s"
					});
				}
			}
		},

		init: function(id) {
			var newPointer = $.extend(true, {
				'domID': id,
				'htmlID': id + "html"
			}, viz.scanPointer);

			return newPointer;
		},

		show: function() {
			var holdTime = 2000;
			var fadeTime = 7;

			console.log("Showing hubs");
			console.log('#' + this.domID);

			var element = '#' + this.domID;
			$(element).css({
				'opacity': '1'
			});

			setTimeout(function() {
				$(element).css({
					'transition-duration': fadeTime + "s",
					'opacity': '0'
				});
			}, 2000);
		},

		// fade: function() {
		// 	var fadeTime = 7;

		// 	console.log("Trying to fade");
		// 	console.log('#' + this.domID);
		// 	$('#' + this.domID).css({
		// 		'transition-duration': fadeTime + "s",
		// 		'opacity': '0'
		// 	});
		// },

		update: function(hubInfo) {

			var ptr = this;

			ptr.distanceReading = hubInfo.distance;

			var normalizedDist = ptr.distanceReading / ptr.maxDistance;

			var mapDistToColor = function(opacity) {
				var r = Math.floor(Math.map(ptr.distanceReading, 75, ptr.maxDistance, 255, 170));
				var g = Math.floor(Math.map(ptr.distanceReading, 75, ptr.maxDistance, 218, 120)); //Math.floor(Math.map(ptr.distanceReading, 50, ptr.maxDistance - ptr.maxDistance * 0.5, 255, 0));
				var b = 68; //Math.floor(Math.map(ptr.distanceReading, 50, ptr.maxDistance, 0, 100));

				return "rgba(" + r + "," + g + "," + b + "," + opacity + ")";
			};

			$('#' + this.htmlID).html('<div class="scanArrow"></div><span class="scanText">' + this.distanceReading + 'm</span>');

			var mappedColorStart = mapDistToColor(1.0);
			var mappedColorEnd = mapDistToColor(0.0);
			var gradient = "linear-gradient(to top, " + mappedColorStart + " 30%, " + mappedColorEnd + ")";
			console.log(gradient);

			$('#' + this.htmlID).css({
				'background': gradient
			});

			this.rotate(hubInfo.angleTo, 0);
			var mappedScale = Math.map(normalizedDist, 0, 1, 1.0, 0.5);
			this.scale(mappedScale);
		},

		addTo: function(IDofDomToAttach) {

			var spinnerObj = this;

			var spinner = $("<div />", {
				'class': 'scanSpinner',
				'id': spinnerObj.domID,
				'css': {}
			});

			var pointer = $("<div />", {
				'class': 'scanPointer',
				'id': spinnerObj.htmlID,
				'html': '<div class="scanArrow"></div><span class="scanText">' + spinnerObj.distanceReading + 'm</span>',
				'css': {}
			});

			spinner.append(pointer);

			this['domElement'] = spinner;

			console.log("New spinner element is: " + this.domElement);

			$(IDofDomToAttach).append(spinner);

		} //,

	},

	scanButton: function() {

		var button = $("<div />", {
			'class': "", //"ui-btn",
			'id': "scanButton",
			'data-icon': "eye"
		});

		button['animRunning'] = false;

		button['animate'] = function() {
			$('#scanButton').addClass('scanAnim');
			$('#scanButton').on('animationend oAnimationEnd webkitAnimationEnd', function() {
				button.stopAnimation();
				$('#app').trigger('scanComplete');
				//ins.popPointers();
			});
		};

		button['stopAnimation'] = function() {
			$('#scanButton').removeClass('scanAnim');
			button.animRunning = false;
			console.log("animRunning set to: " + button.animRunning);
		};

		return button;

	}

};

console.log("Viz loaded");