var viz = {
	//initHeaderUI
	geoPrompt: {
		render: function() {
			msg({
				1: "This app requires geolocation.",
				2: "Click below to test if location detection is working. If prompted by your browser, please 'allow' location detection.",
				3: '<div id="locTestButton">Detect Location</div>'
			}, 'setup');

			this.attachTestEvents();
		},
		success: function() {
			clientState.features.geolocation.ready = true;
			clientState.posStored = true;
			app.trackLocation();
			customLog('Server says Geoloc test successful');

			$('#locTestButton').text('Success!');

			setTimeout(function(){
				startup.svcCheck(); //re-run service check
			}, 500);
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
		attachTestEvents: function() {
			$('#locTestButton').off('click').on('click', function() {
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
						case 1:
							// 1 === error.PERMISSION_DENIED
							errorText = 'User does not want to share Geolocation data.';
							break;

						case 2:
							// 2 === error.POSITION_UNAVAILABLE
							errorText = 'Position of the device could not be determined.';
							break;

						case 3:
							// 3 === error.TIMEOUT
							errorText = 'Position Retrieval TIMEOUT.';
							break;

						default:
							// 0 means UNKNOWN_ERROR
							errorText = 'Unknown Error';
							break;
					}
					customLog(errorText);
					viz.geoPrompt.sendTestResult(errorText, error.code);

				});

				// viz.geoPrompt.sendTestResult(errorText);
			});
		}
	},
	renderLocPrompt: function() {
		msg({
			1: "This app requires geolocation.",
			2: "Click below to test if location detection is working. If prompted by your browser, please 'allow' location detection.",
			3: '<div id="locTestButton">Detect Location</div>'
		}, 'setup');

		$('#locTestButton').off('click').on('click', function() {
			$('#locTestButton').text("Testing...");
		});
	},

	headerStyles: {
		'current': "normal",
		update: function(style) {
			var s = this;

			var refresh = function(styleKey, removeOrAdd) {
				var classTypes = {
					'boxClass': '#alertBox',
					'controlClass': '#alertBoxControl'
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
							controlClass: 'ui-alt-icon'
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

			hT.icon.off('click').on('click', function() {

				if (hT.icon.hasClass(hT.expandIconClass)) {
					hT.expand();
				} else {
					hT.contract();
				}
			});

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
			'marker-color': '#0000ff',
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

	// captureSetup: {
	// 	radius: 80,
	// 	options: {
	// 		'radius': 80,
	// 		'className': "captureCircle",
	// 		'fillColor': '#ff0000',
	// 		'fillOpacity': '0.1',
	// 		'weight': 10,
	// 		'color': '#ff0000',
	// 		'opacity': '0.9',
	// 		'dashArray': '10,30',
	// 		'lineCap': 'square',
	// 		'lineJoin': 'square'
	// 	}
	// },

	addCaptureCircle: function(pos) {
		var c = L.captureCircle([pos.lat, pos.lng], viz.captureSetup.options);
		// c.startRadius = +window.height*0.7;
		// console.log('start radius set to: ' + c.startRadius);
		//c.addTo(map);
		return c;
	},

	// drawCaptureCircle: function(pos) {
	// 	var p = [pos.lat, pos.lng];
	// 	var c = L.circleMarker(p, viz.captureSetup.options);
	// 	c.setRadius(viz.captureSetup.radius);

	// 	var screenOffset = map.latLngToContainerPoint(p);
	// 	// screenOffset.x += viz.captureSetup.radius;
	// 	// screenOffset.y += viz.captureSetup.radius;
	// 	var rad = viz.captureSetup.radius;
	// 	var α = 0,
	// 		π = Math.PI,
	// 		t = 30;

	// 	//FUNCTION FOR PIE-TIMER
	// 	c['draw'] = function() {
	// 		α++;
	// 		//α %= 360;
	// 		var r = (α * π / 180),
	// 			x = Math.sin(r) * rad,
	// 			y = Math.cos(r) * -1 * rad,
	// 			mid = (α > 180) ? 1 : 0,
	// 			anim = 'M 0 0 v -' + rad + ' A' + rad + ' ' + rad + ' 1 ' + mid + ' 1 ' + x + ' ' + y + ' z';

	// 		var circles = document.getElementsByClassName('captureCircle');
	// 		var newCSS = {
	// 			'transform': 'translate(' + screenOffset.x + ',' + screenOffset.y + ')',
	// 			'd': anim
	// 		};
	// 		$.each(newCSS, function(key, value) {
	// 			//WOULD NEED TO BE CHANGED TO DEAL WITH INDEX / ARRAY ISSUE OF CLASS
	// 			circles[0].setAttribute(key, value);
	// 		});

	// 		if (α < 360) {
	// 			setTimeout(c.draw, t); // Redraw
	// 		}
	// 	};

	// 	c.addTo(map);
	// 	c.draw();
	// 	return c;
	// },

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
		startingFlashSpeed: 1000
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
				console.log("Data from server is: ");
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

					h.area.setStyle({
						fillColor: c
					});

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
					h.area.setStyle({
						fillColor: '#0033ff'
					});
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

		//$.extend(true, h, hData);

		return h;
	},

	searchButton: function() {

		var button = $("<div />", {
			'class': "ui-btn",
			'id': "searchButton" //,
		});

		button.addClass('searchIcon');

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
			'class': "ui-btn",
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