import http from 'http';
import express from 'express';
import { Server as socketIOServer } from 'socket.io';// import cors from 'cors';
import path from 'path';

const publicPath = path.join(process.cwd(), 'Server/public');
const port = process.env.PORT || 3000;
const app = express();
const server = http.createServer(app);
const io = new socketIOServer(server, {
    cors: {
      origin: '*', // You can replace the '*' with your specific client origin, e.g., 'http://localhost:8888'
      methods: ['GET', 'POST'],
      allowedHeaders: ['Content-Type'],
      credentials: true 
    }
});
app.use(express.static(publicPath));
//     ,{
//     cors: {
//       origin: '*', // You can replace the '*' with your specific client origin, e.g., 'http://localhost:8888'
//       methods: ['GET', 'POST'],
//       allowedHeaders: ['Content-Type'],
//       credentials: true 
//     }
//   });

// app.use(express.static(publicPath));
// A basic example of storing player states on the server
const players = {};
const playersPos = {};
const cameras = {};
let gameMap = []
let bombs = []

const updatePosFreq = 30;
const updateCamFreq = 30;
const updateKeyboardFreq = 5;

server.listen(port, ()=> {
    console.log(`Server is up on port ${port}.`)
});

io.on('connection', (socket) => {
    console.log('A user just connected.');
    socket.on('join', (player) => {
        console.log(socket.id)
        players[socket.id] = {}
        socket.emit("playerId", socket.id)
        io.sockets.emit("playerNum", Object.keys(players).length)
    });

    socket.on("disconnect", () => {
        console.log("disconnected")
        delete players[socket.id]
        delete cameras[socket.id]
        delete playersPos[socket.id]
        io.sockets.emit("playerNum", Object.keys(players).length)
    })

    // update movement
    socket.on("playerMovementKeyDown", (key) => {
        try {
            players[socket.id] [key.toLowerCase()] = true
        }
        catch{

        }
    })

    socket.on("playerMovementKeyUp", (key) => {
        try {
            players[socket.id] [key.toLowerCase()] = false
        }
        catch{
            
        }
    })

    socket.on("updateCamera", (camera) => {
        cameras[socket.id] = camera
    })

    socket.on("updatePlayerPos", (pos) => {
        playersPos[socket.id] = pos
    })

    socket.on("plantBomb", (bombInfo) => {
        console.log("planting bomb")
        bombInfo["id"] = socket.id;
        io.sockets.emit("plantBomb", bombInfo);
    })


    setInterval(() => {
        io.sockets.emit('playerStates', players);
      }, updateKeyboardFreq);

    setInterval(() => {
        io.sockets.emit('updatePlayerPos', playersPos);
      }, updatePosFreq);

    setInterval(() => {
        io.sockets.emit('updateCamera', cameras);
    }, updateCamFreq);

});

// io.on("disconnect", (socket) => {
//     console.log(5)
// })

// io.on("startGame", () => {
//     io.emit('start');
//     console.log("startGame");
// });


