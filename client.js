/*
    HGMC UDP RELAY
    Description : A Relay to be the UDP link from Mission planner
                  to the socket.io link ( to the logging and mailer server )
    Expectation : QT can do this function as well
    Author : Theppasith Nisitsukcharoen
*/
import io from 'socket.io-client'
import mavlink from 'mavlink'
import amqp from 'amqplib/callback_api'
import amqp2 from 'amqplib/callback_api'
import udp from 'dgram'

const RECEIVE_QUEUE_NAME = "robot_receive_queue";
const ROBOT_QUEUE_NAME = "to_robot_queue";

// // socket-io client const SOCKET_IO_SERVER  = 'http://192.168.1.19:3000'
// const socket            = io.connect(SOCKET_IO_SERVER) Create UDP Client for
// HGMC(server)
const TO_HGMC_UDP_PORT = 14550;
const TO_HGMC_UDP_IP = "192.168.1.19";

// Create UDP Client
var client = udp.createSocket('udp4');

// AMQP Instance Connect
// connects to rabbitmq
amqp.connect('amqp://localhost', function(err, conn) {
    if (err != null) bail(err); // calls `bail` function if an error occurred when connecting
    //consumer(conn); // creates a consumer
    //publisher(conn); // creates a publisher
});

amqp2.connect('amqp://localhost', function(err, conn) {
    if (err != null) bail(err); // calls `bail` function if an error occurred when connecting
    consumer(conn); // creates a consumer
    //publisher(conn); // creates a publisher
});

function bail(err) {
    console.error(err);
    process.exit(1);
}

// Publisher
function publisher(conn) {
    conn.createChannel(on_open); // creates a channel and call `on_open` when done
    function on_open(err, ch) {
        if (err != null) bail(err); // calls `bail` function if an error occurred when creating the channel
        ch.assertQueue(ROBOT_QUEUE_NAME, {
            durable: false
        });// asserts the queue exists
        client.on('message', function (msg, info) {
            console.log(msg);
           ch.sendToQueue(ROBOT_QUEUE_NAME, msg); // sends a message to the queue
        });
        // ch.sendToQueue(q, new Buffer('something to do')); // sends a message to the queue
    }
}

// Consumer
function consumer(conn) {
    var ok = conn.createChannel(on_open); // creates a channel and call `on_open` when done
    function on_open(err, ch) {

        if (err != null) bail(err); // calls `bail` function if an error occurred when creating the channel
        ch.assertQueue(RECEIVE_QUEUE_NAME, {
            durable: false
        });
        ch.consume(RECEIVE_QUEUE_NAME, function(msg) { //consumes the queue
            //console.log(msg.content);
            if (msg !== null) {
                client.send(msg.content,14550,TO_HGMC_UDP_IP,function(){
                    //console.log("PUSH TO HGMC");
                })
            }
        });

        client.on('message', function (msg, info) {
            console.log(msg);
           ch.sendToQueue(ROBOT_QUEUE_NAME, msg); // sends a message to the queue
        });
    }
}

