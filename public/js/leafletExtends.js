var initLeafletExtensions = function() {

	var L = window.L;

	//=================================
	//PLAYER MARKER INIT
	//=================================

	var playerMarkerExt = {

		icons: {
			get suspect() {
				return L.mapbox.marker.icon({
					'marker-size': 'large',
					'marker-symbol': 'pitch',
					'marker-color': '#ff0000',
					'className': 'suspect-marker'
				});
			},
			get dark() {
				return L.mapbox.marker.icon({
					'marker-size': 'large',
					'marker-symbol': 'pitch',
					'marker-color': '#666666',
					'className': 'dark-marker'
				});
			},
			get lockedOut() {
				return L.mapbox.marker.icon({
					'marker-size': 'large',
					'marker-symbol': 'cross',
					'marker-color': '#000000',
					'className': 'locked-marker'
				});
			},
			get agent() {
				return L.mapbox.marker.icon({
					'marker-size': 'medium',
					'marker-symbol': 'police',
					'marker-color': '#0000ff',
					'className': 'agent-marker'

				});
			}
		},

		refresh: function(options) { //posObj, options) {
			if ('latestPos' in this.playerRef) {
				this.setLatLng([this.playerRef.latestPos.lat, this.playerRef.latestPos.lng]);
			} else {
				console.log("ERROR: LatestPos not found");
			}

			//if (this.playerRef.team == 'ins') {
			this.darkLockedCheck();
			//}
			//this.updateTag();
			//this.setLatLng([posObj.lat, posObj.lng]);
			if (options !== undefined) {
				this.setStyle(options);
			}

			if (!this.playerRef.goneDark) {
				this.bounce(1);
			}
			console.log("Marker refreshed to: " + this.playerRef.latestPos.lat + ", " + this.playerRef.latestPos.lng);
		},

		makePopupHTML: function() {
			var newHTML = "";
			if ('title' in this) {
				newHTML += this.title.firstCap().bold().addBreak();
			}
			if ('text' in this) {
				for (line in this.text) {
					newHTML += this.text[line].addBreak();
				}
			}

			return newHTML;
		},

		initPopup: function(data) {
			for (key in data) {
				this[key] = data[key];
			}
		},

		setSelected: function(_tag) {
			var thisMarker = this;
			var tag;
			if (!_tag) {
				tag = thisMarker.tag;
			} else {
				tag = _tag;
			}
			$('.player-tag').removeClass('selected-tag');
			$('.player-tag').children('.tag-pointer').removeClass('selected-pointer');
			var markerPos = thisMarker.getLatLng();
			map.panTo(markerPos);
			//NEED TO DO THIS BUT REVERT SOMEHOW
			//thisMarker.setZIndexOffset(1000);
			var tagPos = tag.offset();
			var tagHeight = tag.height();
			var mapCenterPoint = map.latLngToContainerPoint(markerPos);
			console.log("Map Center is " + mapCenterPoint);
			console.log("Tag Pos Top is: " + tagPos.top);
			var currOffset = $('#suspect-container').offset();
			// console.log("Current offset is: ");
			// console.log(currOffset);
			var pixelVOffset = currOffset.top + (mapCenterPoint.y - tagPos.top) - tagHeight * 0.5;

			$('#suspect-container').css({
				'transform': "translate(0," + pixelVOffset + "px)"
			});
			tag.addClass('selected-tag');
			tag.children('.tag-pointer').addClass('selected-pointer');
			console.log("Amt to translate is " + pixelVOffset);
		},

		//tag: 
		darkLockedCheck: function() {
			var thisMarker = this;
			var classType = '';
			var icon;
			var opacity;

			if (thisMarker.playerRef.lockedOut) {
				classType = 'locked';
				var icon = thisMarker.icons.lockedOut;
				//var zIndexOffset = -100;
				var opacity = 0.5;
				thisMarker['tag'].removeClass('ins-tag');
			} else if (thisMarker.playerRef.goneDark) {
				classType = 'dark';
				icon = thisMarker.icons.dark;
				opacity = 0.5;
				thisMarker['tag'].removeClass('ins-tag');
			} else {
				classType = thisMarker.playerRef.team;
				icon = thisMarker.icons[thisMarker.playerRef.type];
				opacity = 0.8;
				thisMarker['tag'].removeClass('dark-tag');
			}

			thisMarker['tag'].addClass(classType + '-tag');


			//var zIndexOffset = -100;
			//var opacity = 0.5; //,

			thisMarker.setIcon(icon);
			//this.setZIndexOffset(zIndexOffset);
			thisMarker.setOpacity(opacity);

		},

		addTag: function() { //team){
			var thisMarker = this;

			//thisMarker.updateTag();
			var pHTML = thisMarker.makePopupHTML();
			var team = thisMarker.playerRef.team;
			console.log('team for tag is: ' + team);

			// var tag = $("<div />",{
			thisMarker['tag'] = $("<div />", {
				'id': this.title + "-tag",
				'class': 'player-tag ' + team + '-tag',
				'html': pHTML
			}).append($("<div />", {
				'id': this.title + "-pointer",
				'class': 'tag-pointer' //,
			}));
			$('#suspect-container').append(thisMarker.tag);

			if (team == 'ins') {
				console.log('Gone dark is: ' + thisMarker.playerRef.goneDark);
				//thisMarker.updateTag();
				thisMarker.darkLockedCheck();
			}

			thisMarker.tag.on('click', function() {
				thisMarker.setSelected($(this));
			});
		},

		updateTagText: function(data) {
			//set new title and text properties
			for (key in data) {
				this[key] = data[key];
			}
			var pHTML = this.makePopupHTML();
			this.tag.html(pHTML);
			//gotta reattach arrow:
			this.tag.append($("<div />", {
				'id': this.title + "-pointer",
				'class': 'tag-pointer' //,
			}));
		},

		addCaptureCircle: function(domID) {
			var marker = this;
			customLog("Position to add capture circle is: " + marker.getLatLng());
			marker['captureCircle'] = viz.captureCircle(marker.getLatLng(), domID);
		},

		addPopup: function(shouldOpen) {

			var pHTML = this.makePopupHTML();
			//console.log("popup HTML is: " + pHTML);

			if ('popupClass' in this) {
				var pOptions = {
					className: this.popupClass
				};
				this.bindPopup(pHTML, pOptions);
			} else {
				this.bindPopup(pHTML);
			}

			if (shouldOpen) {
				this.openPopup();
			}
		},

		updatePopup: function(data) {
			for (key in data) {
				this[key] = data[key];
			}
			var pHTML = this.makePopupHTML();
			this.setPopupContent(pHTML);
		},

		renderLockout: function(data) {

			var icon = this.icons.lockedOut;
			// var icon = L.mapbox.marker.icon({
			// 	'marker-size': 'large',
			// 	'marker-symbol': 'cross',
			// 	'marker-color': '#000000'
			// });
			var zIndexOffset = -100;
			var opacity = 0.5; //,

			this.setIcon(icon);
			this.setZIndexOffset(zIndexOffset);
			this.setOpacity(opacity);
		}

		//,

		// _initInteraction: function() {

		// 	if (!this.options.clickable) {
		// 		return;
		// 	}

		// 	// TODO refactor into something shared with Map/Path/etc. to DRY it up

		// 	//IMPORTANT: ADDED MOUSEUP EVENT HERE 
		// 	var icon = this._icon,
		// 		events = ['dblclick', 'mousedown', 'mouseover', 'mouseout', 'contextmenu', 'mouseup'];

		// 	L.DomUtil.addClass(icon, 'leaflet-clickable');
		// 	L.DomEvent.on(icon, 'click', this._onMouseClick, this);
		// 	L.DomEvent.on(icon, 'keypress', this._onKeyPress, this);

		// 	for (var i = 0; i < events.length; i++) {
		// 		L.DomEvent.on(icon, events[i], this._fireMouseEvent, this);
		// 	}

		// 	if (L.Handler.MarkerDrag) {
		// 		this.dragging = new L.Handler.MarkerDrag(this);

		// 		if (this.options.draggable) {
		// 			this.dragging.enable();
		// 		}
		// 	}
		// },

		// startCaptureEvent: function(){
		// 		//if ()
		// 	}
	};

	L.PlayerMarker = L.Marker.extend(playerMarkerExt);

	//adds functionality from leaflet.smoothbounce without affecting base Marker class:
	initBounceEffects(L);

	L.playerMarker = function(position, options) {
		return new L.PlayerMarker(position, options);
	};

	console.log("Custom playerMarker class created");


	//=================================
	//TRAIL MARKER INIT
	//=================================

	var trailMarkerExt = {

		refresh: function(posObj, options) {
			this.setLatLng([posObj.lat, posObj.lng]);
			if (options !== undefined) {
				this.setStyle(options);
			}

			console.log("Marker refreshed to: " + posObj.lat + ", " + posObj.lng);
		},


		renderLockout: function(data) {

			var icon = L.mapbox.marker.icon({
				'marker-size': 'large',
				'marker-symbol': 'cross',
				'marker-color': '#000000'
			});
			var zIndexOffset = -100;
			var opacity = 0.5; //,

			this.setIcon(icon);
			this.setZIndexOffset(zIndexOffset);
			this.setOpacity(opacity);
		}

	};

	L.TrailMarker = L.Marker.extend(trailMarkerExt);

	L.trailMarker = function(position, options) {
		return new L.TrailMarker(position, options);
	};

	console.log("Custom trailMarker class created");

	// =================================
	// ANIMATEABLE MARKER INIT
	// =================================

	var AnimMarkerExt = {
		'animRunning': false,

		reCenter: function() {
			this.setLatLng(map.getCenter());

			// var mapCenter = map.latLngToLayerPoint(map.getCenter());
			console.log("Recentering " + this.itemName + " to: " + mapCenter.x + "," + mapCenter.y);

			// $(circle.domElement).attr('style', "");
			// $(this.domElement).css({
			// 	'left': mapCenter.x,
			// 	'top': mapCenter.y
			// });
		},

		refresh: function(posObj, options) {
			this.setLatLng([posObj.lat, posObj.lng]);
			if (options !== undefined) {
				this.setStyle(options);
			}

			console.log("Marker refreshed to: " + posObj.lat + ", " + posObj.lng);
		},

		animate: function() {
			var a = this;

			if (!a.animRunning) {
				a.animRunning = true;
				customLog("Run animation called on animateable " + a.itemName);
				if (a.hasOwnProperty('domElement')) {
					customLog("Animateable DOM element found! Adding class " + a.animateClass);
					$(a.domElement).addClass(a.animateClass);
				} else {
					customLog("Animateable DOM element not found!");

				}
			}
		},

		clearAnimation: function(){
			var a=this;
			a.animRunning = false;
			$(a.domElement).removeClass(a.animateClass);
		}

	};

	L.AnimMarker = L.Marker.extend(AnimMarkerExt);

	L.animMarker = function(position, options) {
		return new L.AnimMarker(position, options);
	};

	console.log("Custom PingAnim class created");

	//=================================
	//PING CIRCLE INIT
	//=================================

	// var pingCircleExt = {

	// 	'burstAnim': {},
	// 	'animRunning': false,

	// 	reCenter: function() {
	// 		this.setLatLng(map.getCenter());
	// 	},

	// 	animateBurst: function() {
	// 		var finalRad = 800;
	// 		var startRad = 0;
	// 		var timeInMillis = 1000;
	// 		var divisor = 60;
	// 		var frameRate = Math.floor(timeInMillis / divisor);
	// 		var radInterval = finalRad / divisor;
	// 		var counter = 0.0;
	// 		this.setStyle({
	// 			'radius': 0
	// 		});

	// 		var pC = this;

	// 		this.burstAnim = setInterval(function() {
	// 			counter += frameRate;
	// 			startRad += radInterval;
	// 			pC.setStyle({
	// 				'radius': startRad
	// 			});

	// 			//console.log("radius changed");

	// 			if (!pC.animRunning) {
	// 				pC.setStyle({
	// 					'radius': 0
	// 				});
	// 				clearInterval(pC.burstAnim);
	// 			}
	// 		}, 16);
	// 	},

	// 	clearBurst: function() {
	// 		clearInterval(this.burstAnim);
	// 		this.setStyle({
	// 			'radius': 0
	// 		});
	// 	}
	// };

	// L.PingCircle = L.CircleMarker.extend(pingCircleExt);

	// L.pingCircle = function(position, options) {
	// 	return new L.PingCircle(position, options);
	// };

	// console.log("Custom pingCircle class created");

	//=================================
	//CAPTURE CIRCLE INIT
	//=================================

	var captureCircleExt = {
		'animRunning': false,
		'startRadius': 500,
		'finalRadius': 20,
		'currentRadius': 0, //+this.startRadius,
		'parentPlayerRef': {},
		startAnim: function() {
			var cc = this;
			cc.animRunning = true;
			cc.currentRadius = cc.startRadius;
			console.log("Current radius: " + cc.currentRadius);
			//var finalRad = 20;
			//var startRad = 700;
			var timeInMillis = 5000;
			var divisor = 60 * 5;
			var frameRate = Math.floor(timeInMillis / divisor);
			var radInterval = (cc.startRadius - cc.finalRadius) / divisor;
			var counter = 0.0;
			cc.setStyle({
				'radius': cc.currentRadius
			});

			// var cc = this;

			cc['captureAnim'] = setInterval(function() {
				counter += frameRate;
				cc.currentRadius -= radInterval;
				//console.log("Current radius: " + cc.currentRadius);
				cc.setStyle({
					'radius': cc.currentRadius
				});
				//console.log("radius changed");

				if (!cc.animRunning) { // || startRad <= 20) {
					//if (startRad >= finalRad){
					//this.setRadius(0);
					clearInterval(cc.captureAnim);
				} else if (cc.currentRadius <= cc.finalRadius) {
					gov.captureComplete(cc.parentPlayerRef);
					cc.setStyle({
						'radius': cc.finalRadius
					});
					cc.animRunning = false;
					//gov.sendLockout();
					clearInterval(cc.captureAnim);
				}
				//}
			}, 16);
		},
		clearAnim: function() {

		}
	};

	L.CaptureCircle = L.CircleMarker.extend(captureCircleExt);

	L.captureCircle = function(position, options) {
		return new L.CaptureCircle(position, options);
	};

	console.log("Custom captureCircle class created");

	//=================================
	//PING CIRCLE INIT
	//=================================

	var scanCircleExt = {
		'animRunning': false,
		'startRadius': 30,
		'maxPulseRadius': 50,
		'currentRadius': 0, //+this.startRadius,
		'fillColor': '#000000',
		'fillOpacity': '0.8',
		scanEvent: function() {

		},
		makeDraggable: function() {
			var scanCircle = this;
			scanCircle.on({
				mousedown: function() {
					map.on('mousemove', function(e) {
						scanCircle.setLatLng(e.latlng);
					});
				}
			});
			map.on('mouseup', function(e) {
				map.removeEventListener('mousemove');
			});
		}
	};

	L.ScanCircle = L.CircleMarker.extend(scanCircleExt);

	L.scanCircle = function(position, options) {
		return new L.ScanCircle(position, options);
	};

	console.log("Custom captureCircle class created");
};