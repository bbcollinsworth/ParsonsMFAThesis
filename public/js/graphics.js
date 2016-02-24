var viz = {

	headerStyles: {
		'urgent': 'urgent-alert',
		'success': 'success-alert',
		'lockout': 'lockout-alert' //,
		//'normal': 'normal-alert'
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
			'marker-color': '#ff0000'
		},
		agent: {
			'marker-size': 'medium',
			'marker-symbol': 'police',
			'marker-color': '#0000ff'
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

	addPingCircle: function() {

		var pC = L.pingCircle(map.getCenter(), viz.pingSetup.options);
		pC.addTo(map);

		var thisCircle = document.getElementsByClassName('onMapPingCircle');
		pC['domElement'] = thisCircle[0];
		//thisCircle[0].id = "#pingCircle";
		return pC;
	},

	captureSetup: {
		radius: 80,
		options: {
			'radius': 80,
			'className': "captureCircle",
			'fillColor': '#ff0000',
			'fillOpacity': '0.1',
			'weight': 10,
			'color': '#ff0000',
			'opacity': '0.9',
			'dashArray': '10,30',
			'lineCap': 'square',
			'lineJoin': 'square'
		}
	},

	addCaptureCircle: function(pos) {
		var c = L.captureCircle([pos.lat, pos.lng], viz.captureSetup.options);
		// c.startRadius = +window.height*0.7;
		// console.log('start radius set to: ' + c.startRadius);
		//c.addTo(map);
		return c;
	},

	drawCaptureCircle: function(pos) {
		var p = [pos.lat, pos.lng];
		var c = L.circleMarker(p, viz.captureSetup.options);
		c.setRadius(viz.captureSetup.radius);

		var screenOffset = map.latLngToContainerPoint(p);
		// screenOffset.x += viz.captureSetup.radius;
		// screenOffset.y += viz.captureSetup.radius;
		var rad = viz.captureSetup.radius;
		var α = 0,
			π = Math.PI,
			t = 30;

		//FUNCTION FOR PIE-TIMER
		c['draw'] = function() {
			α++;
			//α %= 360;
			var r = (α * π / 180),
				x = Math.sin(r) * rad,
				y = Math.cos(r) * -1 * rad,
				mid = (α > 180) ? 1 : 0,
				anim = 'M 0 0 v -' + rad + ' A' + rad + ' ' + rad + ' 1 ' + mid + ' 1 ' + x + ' ' + y + ' z';

			var circles = document.getElementsByClassName('captureCircle');
			var newCSS = {
				'transform': 'translate(' + screenOffset.x + ',' + screenOffset.y + ')',
				'd': anim
			};
			$.each(newCSS, function(key, value) {
				//WOULD NEED TO BE CHANGED TO DEAL WITH INDEX / ARRAY ISSUE OF CLASS
				circles[0].setAttribute(key, value);
			});

			if (α < 360) {
				setTimeout(c.draw, t); // Redraw
			}
		};

		c.addTo(map);
		c.draw();
		return c;
	},

	// ====== HUB VISUALIZATION SETUP ==============//
	hubOptions: {
		area: {
			'stroke': false
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
			update: function(hubDataFromServer){
				console.log("Data from server is: ");
				console.log(hubDataFromServer);
				$.extend(true,h,hubDataFromServer);
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
				}
			},
			setFlashByAlertState: function(){
				if (h.alertState > 0){
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

		$.extend(true,h,hData);

		return h;
	},

	searchButton: function() {

		// var eyeIcon = $("<div />", {
		// 	'class': "ui-btn ui-nodisc-icon ui-corner-all ui-icon-specialeye ui-btn-icon-notext"
		// });

		var button = $("<div />", {
			'class': "ui-btn",
			'id': "searchButton"//,
			//'data-icon': "eye"
		});

		button.addClass('searchIcon');

		//button.append(eyeIcon);

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
				var g = Math.floor(Math.map(ptr.distanceReading, 75, ptr.maxDistance, 255, 120)); //Math.floor(Math.map(ptr.distanceReading, 50, ptr.maxDistance - ptr.maxDistance * 0.5, 255, 0));
				var b = 0; //Math.floor(Math.map(ptr.distanceReading, 50, ptr.maxDistance, 0, 100));

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