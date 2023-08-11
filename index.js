const http = require('http');
const express = require('express');

const LoginRouter = require('./routes/login');

const app = express();

const httpServer = http.createServer(app);
// const httpServer = http.createServer((req, res) => {
//   console.log('We have received a request');
// })
const WebSocketServer = require('websocket').server;
const websocket = new WebSocketServer({
  'httpServer': httpServer // handshake and messaging; share the same underlying network connection with the HTTP server
})

const connections = new Map();
websocket.on('request', request => {
  const connection = request.accept(null, request.origin) // you can decide any protocol?? to accept; switching protocol 
  connection.on('open', () => console.log('OPEN !!'))
  connection.on('close', () => { 
    console.log('CLOSED !!');
  })
  connection.on('message', message => {
    const decode = JSON.parse(message.utf8Data);
    switch(decode.type) {
      case 'init' :
        if (decode.clientId !== undefined && !connections.has(decode.clientId)) {
          connections.set(decode.clientId, connection);
        }
        break
      case 'text' :
        connections.forEach((connection, clientId) => {
          if (clientId !== decode.clientId) {
            connection.send(JSON.stringify({type: 'message', message: decode.message, time: decode.time}));
          }
        })
        break
      case 'typing' :
        if (decode.value) {
          connections.forEach((connection, clientId) => {
            if (clientId !== decode.clientId) {
              connection.send(JSON.stringify({type: 'isTyping', value: true}));
            }
          })
        } else {
          connections.forEach((connection, clientId) => {
            if (clientId !== decode.clientId) {
              connection.send(JSON.stringify({type: 'isTyping', value: false}));
            }
          })
        }
        break
      case 'close' :
        connections.delete(decode.clientId)
        break
      default:
        console.log('not valid message')
        break
    }
  })
})

app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://127.0.0.1:5173'); // Replace with your client's origin
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});
app.use('/', LoginRouter);
httpServer.listen(8080, () => console.log('My server is listening to port 8080'));

function send5sec() {
  if (connection) connection.send(`Message ${Math.random()}`);
  setTimeout(send5sec, 5000);
}