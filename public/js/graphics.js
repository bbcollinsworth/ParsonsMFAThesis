var viz = {

	headerStyles: {
		'urgent': 'urgent-alert',
		'normal': 'normal-alert'
	},

	markerOptions: {
		'suspect': {
			zIndexOffset: 1000,
			opacity: 0.8 //,
			// startCaptureEvent: function(){
			// 	//if ()
			// }
		},
		'agent': {
			opacity: 0.5 //,
		} //,
		// mouseDownEvent: function(e) {
		// 	e.preventDefault();
		// 	console.log("Starting capture!");
		// 	//newPlayer['captureCircle'] = viz.drawCaptureCircle(newPlayer.latestPos);
		// }
	},

	markerIconOptions: {
		suspect: {
			'marker-size': 'large',
			'marker-symbol': 'pitch',
			'marker-color': '#ff0000'
		},
		agent: {
			'marker-size': 'large',
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
		}

	},

	hub: function(hData) {
		var h = {
			area: L.circle([hData.lat, hData.lng], hData.hackRange, viz.hubOptions['area']),
			marker: L.circleMarker([hData.lat, hData.lng], viz.hubOptions['marker']), //this.renderMarker(this.markerRadius),
			markerRadius: 10,
			flash: function(interval) {
				//gov.flashHub(this,interv);
				if (interval === undefined) {
					interval = 1000;
				}

				var c = '#ff0000';

				h.stopFlash();
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
				if (h.flasher) {
					clearInterval(h.flasher);
				}
			}
		};

		h.marker.setRadius(h.markerRadius);

		return h;
	},

	searchButton: function() {

		var eyeIcon = $("<div />", {
			'class': "ui-btn ui-nodisc-icon ui-corner-all ui-icon-specialeye ui-btn-icon-notext"

		});

		var button = $("<div />", {
			'class': "ui-btn",
			'id': "searchButton",
			'data-icon': "eye"
		});

		button.append(eyeIcon);

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

		fade: function() {
			var fadeTime = 7;

			$('#' + this.domID).css({
				'transition-duration': fadeTime + "s",
				'opacity': '0'
			});
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
			this['domID'] = id;
			this['htmlID'] = id + "html";

			return this;
		},

		update: function(hubInfo) {
			// console.log("Hub info is: ");
			// console.log(hubInfo);
			this.distanceReading = hubInfo.distance;
			$('#' + this.htmlID).html('<div class="scanArrow"></div><span class="scanText">' + this.distanceReading + 'm</span>');
			
			this.rotate(hubInfo.angleTo, 0);
			var mappedScale = Math.map(this.distanceReading,0,1000,2.0,1.0);
			this.scale(mappedScale);
		},

		addTo: function(IDofDomToAttach) {

			var spinnerObj = this;

			// var options = {
			// 	spinnerWidth: '20px',
			// 	spinnerHeight: '60px'
			// }

			var spinner = $("<div />", {
				'class': 'scanSpinner',
				'id': spinnerObj.domID,
				'css': {
					// 'width': viz.scanSetup.pointer.width,
					// 'height': viz.scanSetup.pointer.height
				}
			});

			var pointer = $("<div />", {
				'class': 'scanPointer',
				'id': spinnerObj.htmlID,
				'html': '<div class="scanArrow"></div><span class="scanText">' + spinnerObj.distanceReading + 'm</span>',
				'css': {
					//'width': viz.scanSetup.pointer.width
				}
			});

			spinner.append(pointer);

			this['domElement'] = spinner;

			console.log("New spinner element is: " + this.domElement);

			$(IDofDomToAttach).append(spinner);

			//return spinner;
		} //,

	},

	scanButton: function() {

		var scanIcon = $("<div />", {
			'class': "ui-btn ui-nodisc-icon ui-corner-all ui-icon-scan ui-btn-icon-notext"

		});

		var button = $("<div />", {
			'class': "ui-btn",
			'id': "scanButton",
			'data-icon': "eye"
		});

		button.append(scanIcon);

		button['animRunning'] = false;

		button['animate'] = function() {
			$('#scanButton').addClass('scanAnim');
			$('#scanButton').on('animationend oAnimationEnd webkitAnimationEnd', function() {
				button.stopAnimation();
			});
		};

		button['stopAnimation'] = function() {
			$('#scanButton').removeClass('scanAnim');
			button.animRunning = false;
			console.log("animRunning set to: " + button.animRunning);
		};

		return button;


		// var s = L.scanCircle(map.getCenter(),viz.scanSetup.options);
		// s.makeDraggable();

		// map.on('move moveend',function(){
		// 	console.log("Move fired");
		// 	s.setLatLng(map.getCenter());
		// 	s.redraw();
		// 	s.bringToFront();
		// });

		// return s;
	}


};

console.log("Viz loaded");