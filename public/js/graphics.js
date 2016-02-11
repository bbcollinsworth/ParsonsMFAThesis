var viz = {

	markerOptions: {
		'suspect': {
			zIndexOffset: 1000,
			opacity: 0.8 //,
		},
		'agent': {
			opacity: 0.5 //,
		},
		mouseDownEvent: function(e) {
			e.preventDefault();
			console.log("Starting capture!");
			//newPlayer['captureCircle'] = viz.drawCaptureCircle(newPlayer.latestPos);
		}
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

		return m;
	},

	pingSetup: {
		//radius: 0,
		options: {
			'radius': '0',
			'className': "onMapPingCircle",
			'fillColor': '#ffffff',
			'fillOpacity': '',
			'stroke': false
		}
	},

	addPingCircle: function() {
		//var p = L.unproject([window.width * 0.5, window.height * 0.5]);
		//var c = L.circleMarker(map.getCenter(), viz.pingSetup.options);

		var pC = L.circleMarker(map.getCenter(), viz.pingSetup.options);

		//pC.setRadius(viz.pingSetup.radius);

		pC['reCenter'] = function() {
			pC.setLatLng(map.getCenter());
		};
		//c['animate'] = function(){

		//}
		pC['burstAnim'] = {};

		pC['animRunning'] = false;

		pC['animateBurst'] = function() {
			var finalRad = 800;
			var startRad = 0;
			var timeInMillis = 1000;
			var divisor = 60;
			var frameRate = timeInMillis / divisor;
			var radInterval = finalRad / divisor;
			var counter = 0.0;
			pC.setStyle({
				'radius': 0 //,
				//'fillOpacity': '1.0'
			});

			// pC.burstAnim = function() {
			// 	counter += frameRate;
			// 	startRad += radInterval;
			// 	//pC.setRadius(startRad);
			// 	pC.setStyle({
			// 		'radius': startRad //,
			// 		//'fillOpacity': '0.0'}
			// 	});

			// 	if (pC.animRunning) {

			// 		setInterval(pC.burstAnim, 16);
			// 	} else {
			// 		//if (startRad >= finalRad){
			// 		pC.setRadius(0);
			// 		pC.setStyle({
			// 			'radius': 0 //,
			// 			//'fillOpacity': '0.0'
			// 		});
			// 	}
			// };

			// pC.burstAnim();


			pC.burstAnim = setInterval(function() {
				counter += frameRate;
				startRad += radInterval;
				//pC.setRadius(startRad);
				pC.setStyle({
					'radius': startRad //,
					//'fillOpacity': '0.0'}
				});

				if (!pC.animRunning) {
					//if (startRad >= finalRad){
					pC.setRadius(0);
					pC.setStyle({
						'radius': 0 //,
						//'fillOpacity': '0.0'
					});
					clearInterval(pC.burstAnim);
				}
			}, 16);

		};

		pC['clearBurst'] = function() {
			clearInterval(pC.burstAnim);
			pC.setRadius(0);
		};

		pC.addTo(map);

		var thisCircle = document.getElementsByClassName('onMapPingCircle');
		pC['domElement'] = thisCircle[0];
		//thisCircle[0].id = "#pingCircle";
		return pC;
	},

	captureSetup: {
		radius: 80,
		options: {
			'className': "captureCircle",
			'fillColor': '#ff0000',
			'fillOpacity': '0.5',
			'stroke': false
		}
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
			'class': "ui-btn ui-corner-all ui-icon-eye ui-btn-icon-notext"

		});

		var button = $("<div />", {
			'class': "ui-btn",
			'id': "searchButton",
			'data-icon': "eye"
		});

		button.append(eyeIcon);

		return button;

	}


};

console.log("Viz loaded");