// ES6 Standard
const app = require('express')();
const http = require('http').Server(app);

// Socket io
const io = require('socket.io')(http);

// Mavlink Parser 
import mavlink from 'mavlink';

// Mavlink instance (0,0) for incoming parser only
const MAVParser = new mavlink(0,0);

app.get('/' , (req, res) => {``
    res.send('<h1>hellooo</h1>');
});

http.listen(3000, () => {
    console.log('listening on *:3000');
});

const display_ip = (sock) => {
    let socketId = sock.request.connection.remotePort;
    let clientIp = sock.request.connection.remoteAddress;
    let ip = clientIp.substring(clientIp.indexOf(":",3)+1);
    return `${ip}:${socketId}`;
};

// Server Script
MAVParser.on("ready" ,() =>{
    console.log("MAVLink Parser init XML complete");

    io.on('connection', socket => {
        console.log(`${display_ip(socket)} connected`);

        socket.on('mavlink',data => {
            MAVParser.parse(data);
        });
        socket.on('message',(message)=>{
            console.log(`Receive : ${message}`);
        });
        socket.on('disconnect', () => {
            console.log(`${display_ip(socket)} disconnected`);
        });
    });
});

MAVParser.on("message", (message)=>{
    // After Finishing data parsing 
    console.log(message);
});