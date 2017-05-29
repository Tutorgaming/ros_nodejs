/*
    HGMC ROS COMM MODULE
    Description : Communication Module for ROBOT via SOCKET.IO 
                  Provide ROS Interface though rosnodejs of reThinkRobotics
    Expectation : QT can do this function as well 
    Author : Theppasith Nisitsukcharoen 
*/
import io from 'socket.io-client'
import mavlink from 'mavlink'
import mavlinkMessage from 'mavlink'
import rosnodejs from 'rosnodejs'
import BN from 'bn.js'

// MAVLink Parser (for conversion between ROSMAV - MAV)
const MAVParser = new mavlink();
// Destination server detail
const SOCKET_IO_SERVER = 'http://192.168.1.19:3000';
const socket = io.connect(SOCKET_IO_SERVER);

// Init ROS Node
const NODENAME = "robot_communication";
const ROS_MAVLINK_MSG = "mavros_msgs/Mavlink";
const ROS_OUTGOING_TOPIC = "/mavlink/to_gcs";
const ROS_INCOMING_TOPIC = "/mavlink/from_gcs";

var rn;

MAVParser.on('ready', () => {
    console.log("MAVParser Ready");
    rosnodejs.initNode(NODENAME, {
        onTheFly: true
    }).then((rosnode_instance) => {
        console.log("[ROBOT] Communication Modules node init complete ! ");

        rn = rosnode_instance;
        // Subscribe to topic to be sent to Server
        rn.subscribe(ROS_OUTGOING_TOPIC, ROS_MAVLINK_MSG, (data) => {
            // Parse ROS Message to Buffer
            let msgBuf = new Buffer(data.len + 8);
            msgBuf.fill('\0');

            // Payload
            const payload64 = data.payload64.reduce(
                (last, cur) =>
                Buffer.concat([last, cur.toBuffer('le', 8)]), new Buffer(0)
            );

            // Create mavlink buffer
            msgBuf[0] = data.magic;
            msgBuf[1] = data.len;
            msgBuf[2] = data.seq;
            msgBuf[3] = data.sysid;
            msgBuf[4] = data.compid;
            msgBuf[5] = data.msgid;
            payload64.copy(msgBuf, 6, 0);
            msgBuf.writeUInt16LE(data.checksum, data.len + 6);

            socket.emit('mavlink', msgBuf);
        }, {
            queueSize: 10,
            throttleMs: 100
        });



        socket.on('connect', () => {
            console.log("[ROBOT]['connect'] Connected to SOCKET.IO SERVER ");
        });
    });
});

socket.on('from_server', (data) => {
    // Convert MAVLINK BUFFER TO ROSMSG
    //console.log(data);
    if (rn !== null)
        MAVParser.parse(data);
});

// On Parse Completed !
MAVParser.on('message', (message) => {
    // Create Ros message
    if (rn === null) return;
    let byte_offset = 0;
    let payload_64 = [];

    // Create Payload 64
    for (let i = 0; i < Math.ceil(message.length / 8); i++) {
        // Read Buffer offset 8
        let remaining_count = (message.length - byte_offset) > 8 ?
            8 : (message.length - byte_offset);
        let temp = new Buffer(8);
        temp.fill(0);
        message.payload.copy(temp, 0, byte_offset, byte_offset + remaining_count);
        let bignum = new BN(temp, '8', 'le');
        payload_64.push(bignum);
        byte_offset += 8;
    }

    // Define ROS Message TYPE (Under Scope)
    const mavros_msgs_type = rosnodejs.require('mavros_msgs').msg;
    const Header = rosnodejs.require('std_msgs').msg.Header;
    const header = new Header({
        seq: 100,
        stamp: { secs: 2245, nsecs: 912000000 },
        frame_id: ''
    });
    console.log("message coming");


    let pub = rn.advertise('/mavlink/from_gcs', 'mavros_msgs/Mavlink', {
        queueSize: 10,
        latching: true,
        throttleMs: 100
    });

    // const mav_message = new mavros_msgs_type.Mavlink({
    //     // // Reuse a message to be sent
    //     header: header,
    //     len: message.length,
    //     seq: message.sequence,
    //     sysid: message.system,
    //     compid: message.component,
    //     msgid: message.id,
    //     checksum: message.checksum,
    //     payload64: payload_64
    // });
    const mav_message = new mavros_msgs_type.Mavlink();

    console.log(mav_massage);
    // Publish to ROS
    pub.publish(mav_message);

});