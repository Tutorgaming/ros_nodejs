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
import rosnodejs from './rosnodejs/index.js'

// MAVLink Parser (for conversion between ROSMAV - MAV)
const MAVParser = new mavlink(1,190);

// Destination server detail
const SOCKET_IO_SERVER = 'http://192.168.1.19:3000';
const socket           = io.connect(SOCKET_IO_SERVER);
let i = 0;
let COMPID;
let SYSID;

/*
def convert_to_bytes(msg):
    """
    Re-builds the MAVLink byte stream from mavros_msgs/Mavlink messages.

    Support both v1.0 and v2.0.
    """
    payload_octets = len(msg.payload64)
    if payload_octets < msg.len / 8:
        raise ValueError("Specified payload length is bigger than actual payload64")

    if msg.magic == Mavlink.MAVLINK_V10:
        msg_len = 6 + msg.len  # header + payload length
        msgdata = bytearray(
            struct.pack(
                '<BBBBBB%dQ' % payload_octets,
                msg.magic, msg.len, msg.seq, msg.sysid, msg.compid, msg.msgid,
                *msg.payload64))
    else: # MAVLINK_V20
        msg_len = 10 + msg.len  # header + payload length
        msgdata = bytearray(
            struct.pack(
                '<BBBBBBBBBB%dQ' % payload_octets,
                msg.magic, msg.len, msg.incompat_flags, msg.compat_flags, msg.seq,
                msg.sysid, msg.compid,
                msg.msgid & 0xff, (msg.msgid >> 8) & 0xff, (msg.msgid >> 16) & 0xff,
                *msg.payload64))

    if payload_octets != msg.len / 8:
        # message is shorter than payload octets
        msgdata = msgdata[:msg_len]

    # finalize
    msgdata += struct.pack('<H', msg.checksum)

    if msg.magic == Mavlink.MAVLINK_V20:
        msgdata += bytearray(msg.signature)

    return msgdata


*/

const convert_to_bytes = (msg) => {
    let payload_octets = msg.payload64
    let msg_len = 0;
    //let msgdata = new Buffer();
    if( payload_octets < msg.len / 8 ){
        return "Value Error";
    }

    if (msg.magic == 254){ //MAVLINK 1.0
        msg_len = 6 + msg.len
        //Create Byte Array and packs things
        
    }else{ //MAVLINK 2.0
        msg_len = 10 + msg.len 
    }

    if(payload_octets !== msg.len/8){
        // Message is sorter than payload octets
        // Resize to the msg_len
    }

    // Finalize 
    // pack checksum to the end msgdata 

    if(msg.magic === 253){
        // Pack signature in the ending
    }

    // Return complete mav message (Buffer)
    return msg_len
};

// Init ROS Node
const NODENAME = "robot_communication";
const rosNode = rosnodejs.initNode(NODENAME,{onTheFly: true}).then((rosnode_instance)=>{
    console.log("[ROBOT] Communication Modules node init complete ! ");
    // Subscribe to topic to be sent to Server
    rosnode_instance.subscribe('/mavlink/to_gcs','mavros_msgs/Mavlink',(data)=>{
        // Parse ROS Message to Buffer
        var payload = {
            'length': data.len,
            'sequence' : data.seq,
            'system' : data.sysid,
            'component' : data.compid,
            'id' : data.msgid,
            'payload' : data.payload64,
            'checksum' : data.checksum,
            'buffer' : ''
        };

        // console.log(data);
        console.log(data.len);
        let temp = data.payload64.reduce((last,cur) => last + "\n" + cur.length,"");
        console.log(temp)
        console.log("===============")
        // let payload64 = data.payload64.reduce(
        //     (last,cur)=>last + JSON.stringify(cur),"");
        // console.log(data.payload64[0].length);
    });
});

MAVParser.on('ready', ()=>{
    console.log("MAVParser Ready");
});


socket.on('connect', ()=>{
    console.log("[ROBOT]['connect'] Connected to SOCKET.IO SERVER " );
    
});



