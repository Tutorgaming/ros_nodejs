/*
    HGMC UDP RELAY
    Description : A Relay to be the UDP link from Mission planner 
                  to the socket.io link ( to the logging and mailer server )
    Expectation : QT can do this function as well 
    Author : Theppasith Nisitsukcharoen 
*/
import io from 'socket.io-client'
import mavlink from 'mavlink'

// socket-io client
const SOCKET_IO_SERVER  = 'http://192.168.1.19:3000'
const socket            = io.connect(SOCKET_IO_SERVER)

// Create UDP Client for HGMC(server) 
const TO_HGMC_UDP_PORT  = 14550;
const TO_HGMC_UDP_IP    = "192.168.1.19";

var client = dgram.createSocket('udp4');

// Consume AMQP

// Receive Value back from HGMC,QGC,Mission planner 
