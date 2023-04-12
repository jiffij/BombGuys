import http from 'http';
import express from 'express';
import { Server as socketIOServer } from 'socket.io';// import cors from 'cors';
import path from 'path';
import { life_1, life_2, life_3, playerNum } from './public/js/config.js';
import { floorConfig } from './public/js/config.js';

const publicPath = path.join(process.cwd(), './Server/public');
const port = process.env.PORT || 3000;
const app = express();
const server = http.createServer(app);
const io = new socketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
      allowedHeaders: ['Content-Type'],
      credentials: true 
    }
});
app.use(express.static(publicPath));

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0,
            v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// app.use(express.static(publicPath));
// A basic example of storing player states on the server
const players = {};
const playersPos = {};
const cameras = {};
const waitingRoom = {};
const waitingRoomInGame = {};
let gameMap = []
let bombs = []


// update frequency
const updatePosFreq = 30;
const updateCamFreq = 30;
const updateKeyboardFreq = 10;
const randomBombFreq = 10000;


// color to life
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

    socket.on('disconnect_me', () => {
        console.log("disconnected")
        delete players[socket.id]
        delete cameras[socket.id]
        delete playersPos[socket.id]
        for (let uuid of Object.keys(waitingRoom)){
            const clientId = socket.id;
            const index = waitingRoom[uuid].indexOf(clientId);
            if (index !== -1){
                waitingRoom[uuid].splice(index, 1);
                // notifyPlayerNum(uuid)
                break
            }
        }
        socket.disconnect();
        console.log('User disconnected:', socket.id);
    });

    socket.on("disconnect", () => {
        console.log("disconnected")
        delete players[socket.id]
        delete cameras[socket.id]
        delete playersPos[socket.id]
        for (let uuid of Object.keys(waitingRoom)){
            const clientId = socket.id;
            const index = waitingRoom[uuid].indexOf(clientId);
            if (index !== -1){
                waitingRoom[uuid].splice(index, 1);
                // notifyPlayerNum(uuid)
                break
            }
        }
        console.log('User disconnected:', socket.id);
    })

    // create a room
    socket.on("createRoom", () => {
        const uuid = generateUUID();
        waitingRoom[uuid] = [socket.id]
        waitingRoomInGame[uuid] = false
    })

    socket.on("joinRoom", () => {
        let haveEmptyRoom = false;
        for (let uuid of Object.keys(waitingRoom)){
            if (waitingRoom[uuid].length < playerNum && waitingRoomInGame[uuid] == false){
                waitingRoom[uuid].push(socket.id)
                haveEmptyRoom = true
                if (waitingRoom[uuid].length == playerNum){
                    notifyPlayerNum(uuid)
                    waitingRoomInGame[uuid] = true
                }
                break;
            }
        }
        if (!haveEmptyRoom){
            // if no room, create one
            const uuid = generateUUID();
            waitingRoom[uuid] = [socket.id]
            waitingRoomInGame[uuid] = false
            socket.emit("playerNum", waitingRoom[uuid].length)
        }
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

    // setInterval(() => {
    //     const pos = Math.random()
    //     const bombInfo = {

    //     }
    //     io.sockets.emit('plantBomb', 1);
    // }, randomBombFreq);
});

// Send a message to a list of specific clients
function notifyPlayerNum(uuid) {
    const clientIds = waitingRoom[uuid]
    const num = waitingRoom[uuid].length
    const gameMapInfo = generateMap()
    clientIds.forEach((clientId) => {
        io.to(clientId).emit('startGame', gameMapInfo);
    });
}


function generateMap(){
    let floorPieces = []
    for (let l=0; l<floorConfig.layers;l++){
        let layer = []
        for (let i=0; i<floorConfig.mapSize; i++) {
            let row = [];
            for (let j=0; j<floorConfig.mapSize; j++){
                let num = Math.random()
                let floorPieceLife;
                if (num<0.3){
                    floorPieceLife = {
                        life: 1,
                        color: life_1
                    }
                }
                else if (num<0.7){
                    floorPieceLife = {
                        life: 2,
                        color: life_2
                    }
                }
                else {
                    floorPieceLife = {
                        life: 3,
                        color: life_3
                    }
                }
                row.push(floorPieceLife)
            }
            layer.push(row)
        }
        floorPieces.push(layer)
    }
    return floorPieces;
}

