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
import rosnodejs, { Time } from 'rosnodejs'
import msgUtil from 'rosnodejs/dist/utils/message_utils.js'
import serialize from 'rosnodejs/dist/ros_msg_utils/lib/base_serialize.js'
import BN from 'bn.js'

// MAVLink Parser (for conversion between ROSMAV - MAV)
const MAVParser = new mavlink();

// Destination server detail
const SOCKET_IO_SERVER = 'http://192.168.1.19:3000';
const socket = io.connect(SOCKET_IO_SERVER);

// Init ROS Node
const NODENAME = "robot_communication";
const OPTIONS = { onTheFly: true }

var publisher; // Var for hoising from within initNode Routine

// Outermost ' wait for parser to be ready
MAVParser.on('ready', () => {
    rosnodejs.initNode(NODENAME, OPTIONS).then(
        (nodeHandle) => {
            createSubscriber(nodeHandle);
            checkSocketConnectivity();
            publisher = createPublisher(nodeHandle); //HOISING TO OUTER SCOPE

            // When Parser is finished 
            MAVParser.on('message', (message) => {
                //PUB
                const mavros_message = createMavlinkMessage(message);
                console.log("publish message to ROS");
                publisher.publish(mavros_message);
            });
        }
    );

    // When receiving things from server
    socket.on('from_server', (data) => {
        MAVParser.parse(data);
    });

});

// Create ROS Publisher
const createPublisher = (nodeHandle) => {
    console.log("Create Pub");
    return nodeHandle.advertise('/mavlink/from_gcs', 'mavros_msgs/Mavlink', {
        queueSize: 10,
        latching: true,
        throttleMs: 100
    });
};

// Create ROS Subscriber
const createSubscriber = (nodeHandle) => {
    nodeHandle.subscribe('/mavlink/to_gcs', 'mavros_msgs/Mavlink',
        (data) => {

            // Parse ROS Message to Buffer
            let msgBuf = new Buffer(data.len + 8);
            msgBuf.fill('\0');

            const payload64 = data.payload64.reduce(
                (last, cur) => Buffer.concat([last, cur.toBuffer('le', 8)]), new Buffer(0));

            // Create mavlink buffer
            msgBuf[0] = data.magic;
            msgBuf[1] = data.len;
            msgBuf[2] = data.seq;
            msgBuf[3] = data.sysid;
            msgBuf[4] = data.compid;
            msgBuf[5] = data.msgid;
            payload64.copy(msgBuf, 6, 0);
            msgBuf.writeUInt16LE(data.checksum, data.len + 6);

            // Socket Emit it out
            socket.emit('mavlink', msgBuf);
        }, {
            queueSize: 20,
            throttleMs: 50
        });
};

// Check SOCKET.IO on 'connect' connectivity 
const checkSocketConnectivity = () => {
    socket.on('connect', () => {
        console.log("[ROBOT]['connect'] Connected to SOCKET.IO SERVER ");
    });
};

// Create ROS Message from incoming mavlink buffer
const createMavlinkMessage = (incoming_msg) => {
    let byte_offset = 0;
    const payload_count = Math.ceil(incoming_msg.length / 8);
    var payload_64 = [];

    // Create Payload 64
    for (let i = 0; i < payload_count; i++) {
        // Read Buffer offset 8
        let remaining_count = (incoming_msg.length - byte_offset) > 8 ?
            8 : (incoming_msg.length - byte_offset);
        let temp = Buffer.alloc(8); // let temp = new Buffer(8);
        // temp.fill(0);
        incoming_msg.payload.copy(temp, 0, byte_offset, byte_offset + remaining_count);
        //console.log(temp);
        let bignum = new BN(temp, '8', 'le');
        //console.log("string : " + bignum.toString(10));
        payload_64.push(bignum);
        byte_offset += 8;
    }

    // Define ROS Message TYPE (Under Scope)
    const mavros_msgs_type = rosnodejs.require('mavros_msgs').msg;
    const Header = rosnodejs.require('std_msgs').msg.Header;
    const header = new Header({
        seq: 0,
        stamp: rosnodejs.Time.now(),
        frame_id: ''
    });

    const mav_message = new mavros_msgs_type.Mavlink({
        // // Reuse a message to be sent
        header: header,
        framing_status: 1,
        len: incoming_msg.length,
        seq: incoming_msg.sequence,
        sysid: incoming_msg.system,
        compid: incoming_msg.component,
        msgid: incoming_msg.id,
        magic: 254,
        checksum: incoming_msg.checksum,
        payload64: payload_64
    });

    return mav_message;
};