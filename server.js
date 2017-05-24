/*
    ROBOT SERVER 
    Description : - Receive All packets from ALL ROBOTS
                  - Enqueue to AMQP 
    Expectation : QT can do this function as well 
    Author : Theppasith Nisitsukcharoen 
*/
// MAVLink Parser 
import mavlink from 'mavlink';

// Server 
const app = require('express')();
const http = require('http').Server(app);

// AMQP 
import amqp from 'amqplib/callback_api'

// Socket io
const io = require('socket.io')(http);

// Create Server instance 
const PORT = 3000;

// Utility function
const display_ip = (sock) => {
    let socketId = sock.request.connection.remotePort;
    let clientIp = sock.request.connection.remoteAddress;
    let ip = clientIp.substring(clientIp.indexOf(":", 3) + 1);
    return `${ip}:${socketId}`;
};

// HTTP get page Request through ip:port 
app.get('/', (req, res) => {
    res.send('<h1>Landing Page</h1>');
});

// HTTP listening
http.listen(PORT, () => {
    console.log(`listening on *:${PORT}`);
});

// AMQP Init
amqp.connect("amqp://localhost", (err,conn) => {
    if(err){
        console.log(err);
    }

    // AMQP Exit flag
    process.once('SIGINT', ()=>{
        conn.close();
    });
    // AMQP channel creation 
    conn.createChannel( (err,ch) => {
        ch.assertQueue('myQueue',{
            durable : false
        });
        // When there's connection from clients
        io.on('connection', socket => {
            // Prompt
            console.log(`${display_ip(socket)} connected`);
            // On Receive new messages
            socket.on('mavlink', data => {
                // Enqueue to AMQP 
                ch.sendToQueue('myQueue', data);
            });
            // On client disconnect
            socket.on('disconnect', () => {
                console.log(`${display_ip(socket)} disconnected`);
            });
        });

    });

});