import http from 'http';
import express from 'express';
import { Server as socketIOServer } from 'socket.io';// import cors from 'cors';
import path from 'path';
import { playerNum } from './public/js/config.js';

const publicPath = path.join(process.cwd(), '/public');
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

const updatePosFreq = 30;
const updateCamFreq = 30;
const updateKeyboardFreq = 10;

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
                notifyPlayerNum(uuid)
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
                notifyPlayerNum(uuid)
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
                notifyPlayerNum(uuid)
                haveEmptyRoom = true
                if (waitingRoom[uuid].length == playerNum){
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

// Send a message to a list of specific clients
function notifyPlayerNum(uuid) {
    const clientIds = waitingRoom[uuid]
    const num = waitingRoom[uuid].length
    clientIds.forEach((clientId) => {
        io.to(clientId).emit('playerNum', num);
    });
}


