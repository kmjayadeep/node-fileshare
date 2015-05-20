"use strict"
var fs = require('fs');
var http = require('http');
var express = require('express');
var path = require('path');
var app = express();
app.set('view engine', 'ejs');
app.set('views',__dirname+'/views/');
app.use(express.static(__dirname+'/public/'));

var PORT = process.env.PORT || 3000;

var folder;
if (process.argv[2])
    folder = path.join(process.cwd(),process.argv[2]);
else
    folder = path.join(process.env.HOME, '/Downloads/Wshare');

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
            console.log('Unknown error')
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

server.listen(PORT,function(){
    console.log('Listening to port '+PORT);
    console.log('Enter "ifconfig" or "ip addr" from terminal to find your ip address');
});
