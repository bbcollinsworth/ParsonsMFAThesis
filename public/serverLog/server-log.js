var app = {};
var socket; // = io('/admin');
var serverMsg = 'Connecting...';

var namespaceName = "serverLog";

//Google Maps variables
var map;
//var popups = [];

app.init = function() {

    $('#app').css({
        'white-space': 'pre',
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

    // $('#getUsers').on('click', function() {
    //     socket.emit('getServerLog', {});
    // });
};

app.init();



socket.on('greeting', function(res, err) {

    console.log(res.msg);

    var logs = res.logs;

    for (var time in logs){

    }

    var parsedLogs = JSON.stringify(res.logs, null, 4);
    console.log(parsedLogs);
    parsedLogs.replace(', ', '<br />');

    var playerLog = $('<div />', {
        html: parsedLogs//,
        // css: {
        //     "background-color": "rgb(" + getRandom255() + "," + getRandom255() + "," + getRandom255() + ")",
        //     "color": "white"
        // }

    });

    $('#app').html(playerLog);
    //$('#app').append(playerLog);

    // var getRandom255 = function() {
    //     return Math.floor(Math.random() * 150);
    // }

    // for (key in logs) {

    //     var parsedLogs = JSON.stringify(res.logs[key], null, 4);
    //     console.log(parsedLogs);
    //     parsedLogs.replace(', ', '<br />');

    //     var playerLog = $('<div />', {
    //         html: parsedLogs,
    //         css: {
    //             "background-color": "rgb(" + getRandom255() + "," + getRandom255() + "," + getRandom255() + ")",
    //             "color": "white"
    //         }

    //     });

    //     $('#app').append(playerLog);
    // }
    //JSON.stringify(res.logs, null, 4);
    //var logs = JSON.parse(res.logs);

    // var formatLogs = function(){
    // 	for (p in res.logs){

    // 		var player = res.logs[p];
    // 		for (i in player){
    // 			var logline = player.msg[i].time + ": " + player.msg[i].content;
    // 		}
    // 	}
    // }

    // $('#app').html(logs);

    //getMapData();
});