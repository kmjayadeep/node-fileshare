"use strict"
var fs = require('fs');
var http = require('http');
var express = require('express');
var path = require('path');
var app = express();
var program = require('commander');
var findPort = require('find-port')
var chalk = require('chalk');
var ips = require('./myIp')()
var mkdirp = require('mkdirp');

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views/');
app.use(express.static(__dirname + '/public/'));

program
    .version('0.0.1')
    .option('-d, --dir <directory>', "Directory to Serve")
    .option('-p, --port <number>', "Port", parseInt)
    .parse(process.argv)

var PORT = program.port || process.env.PORT || 4444;


var folder;
if (program.dir)
    folder = program.dir
else
    folder = '.';

folder = path.normalize(folder)

var server = http.createServer(app);

var BinaryServer = require('binaryjs').BinaryServer;
var bs = BinaryServer({
    server: server
});


var writable = false;

fs.readdir(folder, function(err, files) {
    if (err) {
        if (err.errno == -2) {
            console.log(chalk.blue('directory doesn\'t exist... attempting to create'));
            mkdirp(folder, function(err) {
                if (err) {
                    console.log(chalk.red('Unable to create directory in the spcecified location..Please try a different location'));
                } else {
                    console.log(chalk.yellow('Success! Serving on : ' + folder))
                    writable = true;
                    app.use(express.static(folder));
                    startListening()
                }
            });
        } else {
            console.log(chalk.red('Unable to access spcecified directory'))
        }
    } else {
        console.log(chalk.yellow('Wshare Serving on : ' + folder));
        writable = true;
        app.use(express.static(folder));
    }
    if (writable)
        startListening()
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

function startListening() {
    findPort('127.0.0.1', PORT, PORT + 5, function(ports) {
        if (ports.length > 0) {
            PORT = ports[0]
            server.listen(PORT, function(err) {
                console.log(chalk.yellow('Wshare listening to port ' + PORT))
                console.log(chalk.green('Access Wshare from : '))
                for (var i in ips) {
                    console.log(chalk.green('  http://' + ips[i] + ':' + PORT))
                }
            });
        } else {
            console.log(chalk.red('Unable to start Server: Please try changing the port or run with superuser privilages'))
        }
    })

}




process.on('uncaughtException', function(err) {
    if (err.syscall == 'listen') {
        console.log(chalk.red('Unable to start Server: Please try changing the port or run with superuser privilages'))
    } else {
        console.log(chalk.red("Unknown Error"))
    }
});
