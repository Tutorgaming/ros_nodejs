/*
    HGMC UDP RELAY
    Description : A Relay to be the UDP link from Mission planner 
                  to the socket.io link ( to the logging and mailer server )
    Expectation : QT can do this function as well 
    Author : Theppasith Nisitsukcharoen 
*/
import io from 'socket.io-client'
import mavlink from 'mavlink'
import BN from 'bn.js'

// MAVLink Parser (for conversion between ROSMAV - MAV)
const MAVParser = new mavlink(1,190);

// import rosnodejs from './rosnodejs/index.js'
// import Deserialize from './rosnodejs/ros_msg_utils/index.js'
// socket-io client
const SOCKET_IO_SERVER  = 'http://192.168.1.19:3000'
const socket            = io.connect(SOCKET_IO_SERVER)

// Create UDP Client for HGMC(server) 
const TO_HGMC_UDP_PORT  = 14550;
const TO_HGMC_UDP_IP    = "192.168.1.19";

// var client = dgram.createSocket('udp4');
let payload64 = [
    new BN("39af6ecc3", 'hex'),
    new BN("fffff934ffffec3b", 'hex'),
    new BN("ff00ff00000000", 'hex'),
    new BN("ff0300ff00ff", 'hex')
];

console.log(payload64)

let count = 0;
let payload = payload64.reduce(
    (last,cur)=>
        Buffer.concat([last,cur.toBuffer('le',8)])
    ,
    new Buffer(0)
);

console.log(payload);

MAVParser.on('ready', ()=>{
    console.log("MAVParser Ready");
    MAVParser.createMessage("GPS_STATUS",
		{
		'satellites_visible':		5,
		'satellite_prn':			[1, 2, 3, 4, 5],
		'satellite_used':			[2, 3, 4, 5, 6],
		'satellite_elevation':		[3, 4, 5, 6, 7],
		'satellite_azimuth':		[4, 5, 6, 7, 8],
		'satellite_snr':			[5, 6, 7, 8, 9]
		},
		function(message) {
			console.log(message.buffer.length);
		});
});

    

// Consume AMQP

// Receive Value back from HGMC,QGC,Mission planner 
