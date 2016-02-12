var initLeafletExtensions = function() {

	var L = window.L;

	//=================================
	//PLAYER MARKER INIT
	//=================================

	var playerMarkerExt = {

		//inCaptureRange: false,

		// startCapture: function(){
			// if (this.inCaptureRange){
			// 	this['captureCircle'] = viz.addCaptureCircle(this.latestPos);
			// 	this['captureCircle'].startAnim();
			// }
		// },

		refresh: function(posObj, options) {
			this.setLatLng([posObj.lat, posObj.lng]);
			if (options !== undefined) {
			}

			console.log("Marker refreshed to: " + posObj.lat + ", " + posObj.lng);
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
		}//,

		// startCaptureEvent: function(){
		// 		//if ()
		// 	}
	};

	L.PlayerMarker = L.Marker.extend(playerMarkerExt);

	L.playerMarker = function(position, options) {
		return new L.PlayerMarker(position, options);
	};

	console.log("Custom playerMarker class created");


	//=================================
	//PING CIRCLE INIT
	//=================================

	var pingCircleExt = {

		'burstAnim': {},
		'animRunning': false,

		reCenter: function() {
			this.setLatLng(map.getCenter());
		},

		animateBurst: function() {
			var finalRad = 800;
			var startRad = 0;
			var timeInMillis = 1000;
			var divisor = 60;
			var frameRate = Math.floor(timeInMillis / divisor);
			var radInterval = finalRad / divisor;
			var counter = 0.0;
			this.setStyle({
				'radius': 0
			});

			var pC = this;

			this.burstAnim = setInterval(function() {
				counter += frameRate;
				startRad += radInterval;
				pC.setStyle({
					'radius': startRad
				});

				console.log("radius changed");

				if (!pC.animRunning) {
					pC.setStyle({
						'radius': 0
					});
					clearInterval(pC.burstAnim);
				}
			}, 16);
		},

		clearBurst: function() {
			clearInterval(this.burstAnim);
			this.setStyle({
				'radius': 0
			});
		}
	};

	L.PingCircle = L.CircleMarker.extend(pingCircleExt);

	L.pingCircle = function(position, options) {
		return new L.PingCircle(position, options);
	};

	console.log("Custom pingCircle class created");

	//=================================
	//PING CIRCLE INIT
	//=================================

	var captureCircleExt = {
		'animRunning': false,

		startAnim: function(){
			this.animRunning = true;

			var finalRad = 20;
			var startRad = 700;
			var timeInMillis = 5000;
			var divisor = 60*5;
			var frameRate = Math.floor(timeInMillis / divisor);
			var radInterval = (startRad-finalRad) / divisor;
			var counter = 0.0;
			this.setStyle({
				'radius': startRad
			});

			var cc = this;

			this.burstAnim = setInterval(function() {
				counter += frameRate;
				startRad -= radInterval;
				cc.setStyle({
					'radius': startRad
				});

				console.log("radius changed");

				if (!cc.animRunning || startRad <= 20) {
					//if (startRad >= finalRad){
					//this.setRadius(0);
					cc.setStyle({
						'radius': finalRad
					});
					clearInterval(cc.burstAnim);
				}
			}, 16);
		},
		clearAnim: function(){

		}
	};

	L.CaptureCircle = L.CircleMarker.extend(captureCircleExt);

	L.captureCircle = function(position, options) {
		return new L.CaptureCircle(position, options);
	};

	console.log("Custom captureCircle class created");
};