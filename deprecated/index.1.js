// AMQP LIB
import amqp from 'amqplib/callback_api';
const RECEIVE_QUEUE_NAME = "robot_receive_queue";
const ROBOT_QUEUE_NAME = "to_robot_queue";

const app = require('express')();
const http = require('http').Server(app);

// Socket io
const io = require('socket.io')(http);

// Mavlink Parser
import mavlink from 'mavlink';

// Mavlink instance (0,0) for incoming parser only
const MAVParser = new mavlink(0, 0);

app.get('/', (req, res) => {
    ``
    res.send('<h1>hellooo</h1>');
});

http.listen(3000, () => {
    console.log('listening on *:3000');
});

const display_ip = (sock) => {
    let socketId = sock.request.connection.remotePort;
    let clientIp = sock.request.connection.remoteAddress;
    let ip = clientIp.substring(clientIp.indexOf(":", 3) + 1);
    return `${ip}:${socketId}`;
};

// Server Script
MAVParser.on("ready", () => {
    console.log("[Server] MAVLink Parser init XML complete");
    io.on('connection', socket => {
        // PROMPT MESSAGE
        console.log(`${display_ip(socket)} connected`);
        // STORE KEY : PAIR SOCKET

        // Receive data on 'mavlink' socket channel
        socket.on('mavlink', data => {
            MAVParser.parse(data);
        });

        // When socket disconnect
        socket.on('disconnect', () => {
            console.log(`${display_ip(socket)} disconnected`);
        });

        // Consume Routine (Do as fast as possible)
        getChannel(function (ch) {
            ch.consume(ROBOT_QUEUE_NAME, (message) => {
                console.log("CONSUME=============>");
                // PEEK MSG to See What inside 
                // Select SOCKET From List 
                // SOCKET.EMIT
                socket.emit('from_server', message.content);
            });
        });

        // setInterval(() => {
        //     MAVParser.createMessage('HEARTBEAT', {
        //         'type': 6,
        //         'autopilot': 8,
        //         'base_mode': 192,
        //         'custom_mode': 0,
        //         'system_status': 4,
        //         'mavlink_version': 3
        //     }, (message) => {
        //         console.log(message);
        //         socket.emit('from_server', message.buffer)
        //     });
        // }, 1000);

    });
});

// AMQP Instance Connect 
let amqp_conn;
amqp.connect('amqp://localhost', (err, conn) => {
    console.log("[Server] AMQP RECEIVE QUEUE Connected !");
    amqp_conn = conn;
});

const getChannel = (callback) => {
    amqp_conn.createChannel(function (err, ch) {
        return callback(ch);
    });
};


MAVParser.on('message', message => {
    getChannel(function (ch) {
        ch.assertQueue(RECEIVE_QUEUE_NAME, {
            durable: false
        });
        // After Finishing data parsing
        console.log("<=============ENQUEUE");
        ch.sendToQueue(RECEIVE_QUEUE_NAME, message.buffer);
    });
});

MAVParser.on("GPS_RAW_INT", function (message, fields) {
    //console.log(fields);
});

MAVParser.on('sequenceError', function (mismatch) {
    //console.log("Sequence Error " + mismatch)
});

MAVParser.on('checksumFail', function (mismatch) {
    //console.log("Checksum Error")
});

// setInterval(() => {
//     MAVParser.createMessage('HEARTBEAT', {
//         'type': 6,
//         'autopilot': 8,
//         'base_mode': 192,
//         'custom_mode': 0,
//         'system_status': 4,
//         'mavlink_version': 3
//     }, (message) => {
//         socket.emit('server', message.buffer)
//     });
// }, 100);