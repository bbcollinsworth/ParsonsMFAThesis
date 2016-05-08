var app = {
    start: {}
};
var socket; // = io('/admin');
var serverMsg = 'Connecting...';

var namespaceName = "setup";

//Google Maps variables
var map;
//var popups = [];

var nameMap = {
    hubDownTarget: '#HubHackGoal',
    hackTimeM: '#HubHackTime',
    gameStart: '#GameStartTime'
};

var defaults = {
    //'StartDate': Date.now(),
    'gameStart': Date.now(),
    // '#HubHackGoal': 3,
    // '#HubHackTime': 3,
    'startZones': {
        'gov': {
            lat: 40.735275026168516,
            lng: -73.99410009384155
        },
        'ins': {
            lat: 40.73714480561841,
            lng: -73.99032354354858
        }
    }
};

var noOverwrite = {
    'gameStart': true
};

app.init = function() {

    initMap();

    // for (var id in defaults) {
    //     $(id).val(defaults[id]);
    // }

    $('#app').css({
        'margin': 'auto',
        'padding': '20px',
        'text-shadow': 'none',
        'font-family': "'Inconsolata','Courier New','sans-serif'"
    });
    var namespaceAddr = "";

    if (location.hostname == "localhost") {
        namespaceAddr = location.hostname + ":" + location.port + '/' + namespaceName;
        console.log("Location: " + namespaceAddr);
    } else {
        namespaceAddr = "http://rproto-dev.elasticbeanstalk.com/" + namespaceName;
    }
    socket = io.connect(namespaceAddr); //'http://localhost:9000/admin'
    attachSocketEvents();

    $('#getUsers').on('click', function() {
        socket.emit('adminWantsUsers', {});
    });

    $('#submit').on('click', function() {

        var reformat = function(oldData) {
            var newData = {};
            for (var i in formData) {
                newData[formData[i].name] = formData[i].value;
            }
            return newData;
        };

        var addStartZones = function(dataObj) {
            dataObj.startZones = {};
            for (var team in app.start) {
                dataObj.startZones[team] = app.start[team].getLatLng();
            }
        };

        var formData = $('#setupForm').serializeArray();
        console.log(formData);

        var toSend = reformat(formData);
        console.log("To Send is: ");
        console.log(toSend);
        addStartZones(toSend);



        console.log("Submit clicked!");
        // var toSend = {
        //     gameStart: $('#GameStartTime').val()
        // };

        console.log("sending: ");
        console.log(toSend);
        socket.emit('createGame', toSend);
    });
};

var attachSocketEvents = function() {

    socket.on('greeting', function(res, err) {
        console.log(res);
        var serverDefaults = res.defaultSettings;

        for (var n in nameMap) {
            if (n in serverDefaults) {
                $(nameMap[n]).attr({
                    'name': n//,
                    //'value': serverDefaults[setting]
                });
            }
        }

        for (var setting in serverDefaults){
            if (!(setting in noOverwrite)){
                defaults[setting] = serverDefaults[setting];
            }
        }

        console.log("Defaults updated by server to: ");
        console.log(defaults);

        for (var name in defaults) {
            $('input[name="'+name+'"]').val(defaults[name]);
        }

        for (var team in app.start){
            app.start[team].setLatLng(defaults.startZones[team]);
        }

    });
};

var initMap = function() {
    console.log("Initializing map");
    //msg("Initializing map");
    L.mapbox.accessToken = 'pk.eyJ1IjoiZnVja3lvdXJhcGkiLCJhIjoiZEdYS2ZmbyJ9.6vnDgXe3K0iWoNtZ4pKvqA';

    window.map = L.mapbox.map('map', 'fuckyourapi.o7ne7nmm', {
        zoomControl: false
    })
        .setView(defaults.startZones.gov, 16)
        .on('ready', function() {

            window.featureLayer = L.geoJson().addTo(map);
            // clientState.mapLoaded = true;
            console.log("Map is initialized!");
            //sendMapReady();
        });

    //to override relative positioning from leaflet style
    // $('#map').css({
    //     "position": "static"
    // });
    var govIcon = L.mapbox.marker.icon({
        'marker-size': 'medium',
        'marker-symbol': 'police',
        'marker-color': '#0000ff',
        'className': 'agent-marker'

    });

    var insIcon = L.mapbox.marker.icon({
        'marker-size': 'medium',
        'marker-symbol': 'pitch',
        'marker-color': '#ff0000',
        'className': 'suspect-marker'
    });

    app.start.gov = L.marker(defaults.startZones.gov, {
        draggable: true,
        icon: govIcon
    });
    app.start.gov.addTo(map);

    app.start.ins = L.marker(defaults.startZones.ins, {
        draggable: true,
        icon: insIcon
    });

    app.start.ins.addTo(map);
};

app.init();



// $('#submit').on('click',function(){
//     var toSend = {
//         gameStart: $('#GameStartTime').value()
//     };
//     console.log("sending: ");
//     console.log(toSend);
//     socket.emit(toSend);
// });