var networkInterfaces = require('os').networkInterfaces()

var myIp = function() {
    var ip = ['localhost']
    for (var k in networkInterfaces) {
        var inter = networkInterfaces[k]
        for (var j in inter)
            if (inter[j].family === 'IPv4')
                ip.push(inter[j].address)
    }
    return ip
}

module.exports = myIp