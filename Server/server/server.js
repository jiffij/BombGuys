// const path          = require('path');
const http          = require('http');
const express       = require('express');
const { Server } = require('socket.io');
const cors = require('cors');

// const publicPath    = path.join(__dirname, '/../public');
const port          = process.env.PORT || 3000;
let app             = express();
let server          = http.createServer(app);
let io = new Server(server, {
    cors: {
      origin: '*', // You can replace the '*' with your specific client origin, e.g., 'http://localhost:8888'
      methods: ['GET', 'POST'],
      allowedHeaders: ['Content-Type'],
      credentials: true
    }
  });

// app.use(express.static(publicPath));
// A basic example of storing player states on the server
const players = {};
const playersPos = {};
const cameras = {};
let gameMap = []
let bombs = []

const updatePosFreq = 10;
const updateCamFreq = 1;
const updateKeyboardFreq = 0.1;

server.listen(port, ()=> {
    console.log(`Server is up on port ${port}.`)
});

io.on('connection', (socket) => {
    console.log('A user just connected.');
    socket.on('join', (player) => {
        console.log(socket.id)
        players[socket.id] = {}
        socket.emit("playerId", socket.id)
    });

    socket.on("disconnect", () => {
        console.log("disconnected")
        delete players[socket.id]
        delete cameras[socket.id]
        delete playersPos[socket.id]
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
            if (key == "e"){
                // plant bomb
            }
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

    // update gamemap

    // update bomb
});

// io.on("disconnect", (socket) => {
//     console.log(5)
// })

// io.on("startGame", () => {
//     io.emit('start');
//     console.log("startGame");
// });


