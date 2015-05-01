var fs = require('fs');
var http = require('http');
var express = require('express');
var app = express();
app.set('view engine', 'ejs');

app.use(express.static(__dirname + '/public'));

var server = http.createServer(app);

var BinaryServer = require('binaryjs').BinaryServer;
var bs = BinaryServer({
    server: server
});
bs.on('connection', function(client) {
    client.on('stream', function(stream, meta) {
        var file = fs.createWriteStream(__dirname + '/public/uploads/' + meta.name);
        stream.pipe(file);
        stream.on('data', function(data) {
            stream.write({
                rx: data.length / meta.size
            });
        });
    });
});
app.get('/', function(req, res) {
    fs.readdir(__dirname + '/public/uploads/', function(err, files) {
        if (err) throw err;
        res.render('index', {
            files: files
        });
    });
});

server.listen(9000);
console.log('HTTP fileshare server started on port 9000');