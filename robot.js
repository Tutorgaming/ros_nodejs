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
const MAVParser = new mavlink();

// Destination server detail
const SOCKET_IO_SERVER = 'http://192.168.1.117:3000';
const socket           = io.connect(SOCKET_IO_SERVER);

// Init ROS Node
const NODENAME = "robot_communication";

const rosNode = rosnodejs.initNode(NODENAME,{onTheFly: true}).then((rosnode_instance)=>{
    console.log("[ROBOT] Communication Modules node init complete ! ");
    // Subscribe to topic to be sent to Server
    rosnode_instance.subscribe('/mavlink/to_gcs','mavros_msgs/Mavlink',(data)=>{
        // Parse ROS Message to Buffer
        let msgBuf = new Buffer(data.len + 8);
        msgBuf.fill('\0');

        // Payload
        const payload64 = data.payload64.reduce(
            (last,cur)=>
                Buffer.concat([last,cur.toBuffer('le',8)])
        ,new Buffer(0)
        ); 
        
        // Create mavlink buffer
        msgBuf[0] = data.magic;
        msgBuf[1] = data.len;
        msgBuf[2] = data.seq;
        msgBuf[3] = data.sysid;
        msgBuf[4] = data.compid;
        msgBuf[5] = data.msgid;
        payload64.copy(msgBuf,6,0);
        msgBuf.writeUInt16LE(data.checksum, data.len+6);
        
        socket.emit('mavlink',msgBuf);

    },
    {
      queueSize: 1,
      throttleMs: 200
    });
});

MAVParser.on('ready', ()=>{
    console.log("MAVParser Ready");
    // // On Receive Server command
    
});

socket.on('from_server',(data)=>{
        // Convert MAVLINK BUFFER TO ROSMSG
        MAVParser.parse(data);
});

socket.on('connect', ()=>{
    console.log("[ROBOT]['connect'] Connected to SOCKET.IO SERVER " );
});

MAVParser.on('message', (message)=>{
        console.log(message);
        // PUB TO ROS WORLD
});

MAVParser.on('sequenceError', function(mismatch){
    console.log("Sequence Error : " + mismatch)
});

MAVParser.on('checksumFail', (mismatch)=>{
    console.log("Checksum Failed : " + mismatch);
});