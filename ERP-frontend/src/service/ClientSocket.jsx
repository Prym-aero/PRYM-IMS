import React, {useState, useEffect} from 'react';
import {io} from 'socket.io-client';

socket = io('http://localhost:3000');


socket.on('connect', () => {
    console.log('Connected to server with ID:', socket.id);
});

const onQrScan = (data) => {
    console.log('QR Code Scanned:', data);
    socket.emit('qr-scan', data);
}

socket.on('qr-recieved', (data) => {
    console.log('QR Code Data Received:', data);
    // Handle the received QR code data (e.g., update state, display notification, etc.)
})

