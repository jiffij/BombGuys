import express from "express"
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from "path";
import net from 'net';


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

var app = express();

app.use(express.static(path.join(__dirname,'public')))
// app.use(express.static(path.join(__dirname,'../models')))

app.get('/',function(req, res) {
    res.sendFile(__dirname + './public/index.html');
    // res.send()
});

// app.listen(8888)

let port = 8888;

// Test if the port is in use
const testServer = net.createServer();

testServer.once('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.log(`Port ${port} is already in use. Please choose another port.`);
    testServer.listen(++port);
  } else {
    console.error('Error while testing the port:', error);
  }
});

testServer.once('listening', () => {
  console.log(`Port ${port} is available.`);
  testServer.close();

  // Start the Express server on the available port
  app.listen(port, () => {
    console.log(`Server started on port ${port}`);
  });
});

testServer.listen(port);

