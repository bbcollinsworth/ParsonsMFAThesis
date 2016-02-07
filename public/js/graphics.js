var viz = {

	markerOptions: {
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

	marker: function(type, pos, isDraggable) {

		if (isDraggable === undefined) {
			isDraggable = false;
		}

		var m = L.marker([pos.lat, pos.lng], {
			icon: L.mapbox.marker.icon(viz.markerOptions[type]),
			draggable: isDraggable
		});

		m['refresh'] = function(posObj, options) {
			m.setLatLng([posObj.lat, posObj.lng]);
			if (options !== undefined) {
				//m.update();
			}
			console.log("Marker refreshed to: " + posObj.lat + ", " + posObj.lng);
		}

		m['addPopup'] = function(pHTML, pOptions, shouldOpen) {
			if (pOptions !== undefined) {
				m.bindPopup(pHTML, pOptions);
			} else {
				m.bindPopup(pHTML);
			}

			if (shouldOpen) {
				m.openPopup();
			}
		}

		m['updatePopup'] = function(pHTML){
			m.setPopupContent(pHTML);
		}

		return m;

	},

	popupOptions: {

	},

	// addPopup: function(){
	// 	var = L.popup()
	//    .setContent('<p>Hello world!<br />This is a nice popup.</p>');
	// },

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