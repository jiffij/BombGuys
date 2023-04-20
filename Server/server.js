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
const playerWaitingRoom = {};
const waitingRoomInGame = {};
let gameMap = []
let bombs = []


// update frequency
const updatePosFreq = 100;
const updateKeyboardFreq = 100;
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
        playerWaitingRoom[socket.id] = uuid
    })

    socket.on("joinRoom", () => {
        let haveEmptyRoom = false;
        for (let uuid of Object.keys(waitingRoom)){
            if (waitingRoom[uuid].length < playerNum && waitingRoomInGame[uuid] == false){
                waitingRoom[uuid].push(socket.id)
                playerWaitingRoom[socket.id] = uuid
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
            playerWaitingRoom[socket.id] = uuid
            socket.emit("playerNum", waitingRoom[uuid].length)
        }
    })

    socket.on("updatePlayerPos", (pos) => {
        playersPos[socket.id] = pos
    })

    socket.on("plantBomb", (bombInfo) => {
        let uuid = playerWaitingRoom[socket.id];
        notifyPlayerBomb(uuid, bombInfo, socket.id);
    })

    socket.on("playerJump", () => {
        let uuid = playerWaitingRoom[socket.id]
        notifyPlayerJump(uuid, socket.id);
    })

    socket.on("createEquip", (equip)=>{
        let uuid = playerWaitingRoom[socket.id]
        notifyPlayerEquipGen(uuid, equip, socket.id)
    })


    setInterval(notifyPlayerPos, updatePosFreq);

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
    const gameMapInfo = generateMap()
    clientIds.forEach((clientId) => {
        io.to(clientId).emit('startGame', gameMapInfo);
    });
}

function notifyPlayerJump(uuid, id){
    const clientIds = waitingRoom[uuid]
    clientIds.forEach((clientId) => {
        if (id != clientId){
            io.to(clientId).emit("playerJump");
        }
    });
}

function notifyPlayerPos(){
    let uuids = Object.keys(waitingRoom)
    for (let uuid of uuids){
        const clientIds = waitingRoom[uuid]
        const pos = {}
        clientIds.forEach((clientId) => {
            pos[clientId] = playersPos[clientId]
        });
        clientIds.forEach((clientId) => {
            io.to(clientId).emit("updatePlayerPos", pos);
        });
    }

}

function notifyPlayerBomb(uuid, bombInfo, id){
    const clientIds = waitingRoom[uuid]
    clientIds.forEach((clientId) => {
        if (id != clientId){
            io.to(clientId).emit("plantBomb", bombInfo);
        }
    });

}

function notifyPlayerEquipGen(uuid, equip, id){
    const clientIds = waitingRoom[uuid]
    clientIds.forEach((clientId) => {
        if (id != clientId){
            io.to(clientId).emit('genEquip', equip);
        }
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

