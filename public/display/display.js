var app = {};
var socket; // = io('/admin');
var serverMsg = 'Connecting...';

var namespaceName = "display";

//Google Maps variables
var map;
//var popups = [];

app.init = function() {

    $('#app').css({
        'white-space': 'pre',
        'background-color': 'black',
        'text-shadow': 'none',
        'font-family': "'Special Elite','Inconsolata','Courier New','sans-serif'"
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
    //     socket.emit('adminWantsUsers', {});
    // });
    socket.on('gameStarted', function() {
        //$('#app').html()
    });

    socket.on('showCountdown', function(data) {

        var convertToCountdown = function(t, withSeconds) {
            // FROM http://stackoverflow.com/questions/847185/convert-a-unix-timestamp-to-time-in-javascript
            var formattedTime = "";
            if (t < 0) {
                formattedTime = "00:00";
                if (withSeconds) {
                    formattedTime += ":00";
                }
            } else {
                var date = new Date(t); //*1000);

                var hours = "0" + Math.floor(date / 3600000); //date.getHours(); // hours part from the timestamp
                //hours = (hours % 12 === 0) ? 12 : hours % 12;
                var minutes = "0" + date.getMinutes(); // minutes part from the timestamp
                var seconds = "0" + date.getSeconds(); // seconds part from the timestamp

                formattedTime = hours.substr(-2) + ':' + minutes.substr(-2); // + ':' + seconds.substr(-2);
                if (withSeconds) {
                    formattedTime += ":" + seconds.substr(-2);
                }
            }

            return formattedTime;
        };

        var start = data.startTime;
        console.log("Game start time is: " + convertTimestamp(+start));
        console.log("Current time is: " + convertTimestamp(Date.now()));

        var timer = function() {

            var c = start - Date.now();

            console.log("Time to start is: " + convertToCountdown(c, true));
            return convertToCountdown(c, true);
        };

        var countdownID = 'Countdown';

        var renderedT = '<div class="countdown" id="' + countdownID + '">' + timer() + '</div><p>godark.pw</p>';
            
        $('#app').html(renderedT);

        var cInterval = setInterval(function() {
                $('#'+countdownID).text(timer());
                //clear is included in timer function
            }, 1000);
    });
};

app.init();

socket.on('greeting', function(res, err) {
    console.log(res.msg);

    var logs = res.logs;

    var getRandom255 = function() {
        return Math.floor(Math.random() * 150);
    }

    for (key in logs) {

        var parsedLogs = JSON.stringify(res.logs[key], null, 4);
        console.log(parsedLogs);
        parsedLogs = parsedLogs.replace(', ', '<br />');
        parsedLogs = parsedLogs.replace(/\\n/g, '');

        var playerLog = $('<div />', {
            html: parsedLogs,
            css: {
                "background-color": "rgb(" + getRandom255() + "," + getRandom255() + "," + getRandom255() + ")",
                "color": "white"
            }

        });

        $('#app').append(playerLog);
    }
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