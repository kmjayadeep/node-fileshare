"use strict"
var fs = require('fs');
var http = require('http');
var express = require('express');
var path = require('path');
var app = express();
var program = require('commander');
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views/');
app.use(express.static(__dirname + '/public/'));

program
    .version('0.0.1')
    .option('-d, --dir <directory>', "Directory to Serve")
    .option('-p, --port <number>', "Port", parseInt)
    .parse(process.argv)

var PORT = program.port || process.env.PORT || 3000;


var folder;
if (program.dir)
    folder = program.dir
else
    folder = path.join(process.env.HOME, '/Wshare');

var server = http.createServer(app);

var BinaryServer = require('binaryjs').BinaryServer;
var bs = BinaryServer({
    server: server
});

var writable = false;

fs.readdir(folder, function(err, files) {
    if (err) {
        if (err.errno == -2) {
            console.log('directory doesn\'t exist... attempting to create');
            fs.mkdir(folder, function(err) {
                if (err) {
                    console.log('Unable to create directory in the spcecified location..Please try a different location');
                } else {
                    console.log('Success! Serving on : ' + folder);
                    writable = true;
                    app.use(express.static(folder));
                }
            });
        } else {
            console.log('Unable to access spcecified directory')
        }
    } else {
        console.log('Serving on : ' + folder);
        writable = true;
        app.use(express.static(folder));
    }
});

bs.on('connection', function(client) {
    if (!writable) {
        console.log('Error.. Unable to access folder');
        return;
    }
    client.on('stream', function(stream, meta) {
        var file = fs.createWriteStream(folder + '/' + meta.name);
        stream.pipe(file);
        var perc = 0;
        var cp = 0
        console.log('Receiving : ' + meta.name);
        stream.on('data', function(data) {
            stream.write({
                rx: data.length / meta.size
            });
            cp = data.length / meta.size * 100;
            perc += cp;
            // if(cp>1) //Display only certain percentages
            console.log(meta.name + " : " + perc.toFixed(2) + "%");
        });
        stream.on('end', function() {
            console.log('Completed : ' + meta.name);
        });
    });
});
app.get('/', function(req, res) {
    fs.readdir(folder, function(err, files) {
        if (err) {
            console.log(err);
            files = [];
        }
        res.render('index', {
            files: files
        });
    });
});

server.listen(PORT, function(err) {
    console.log('Listening to port ' + PORT);
    console.log('Enter "ifconfig" or "ip addr" from terminal to find your ip address');
});

process.on('uncaughtException', function(err) {
    if (err.syscall == 'listen') {
        console.log('Unable to start Server: Please try changing the port or run with superuser privilages')
    } else {
        console.log("Unknown Error")
    }
});
