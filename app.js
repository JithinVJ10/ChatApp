const express = require("express")
const path = require('path')


const app = express()

const PORT = 4000

app.use(express.static(path.join(__dirname, 'public')))

const server = app.listen(PORT, ()=> console.log(`Server started on ${PORT}`))

const io = require('socket.io')(server)

// current Active users id's
let socketsConnected = new Set()

// call back function for connection
function onConnected (socket){
    console.log(socket.id)
    socketsConnected.add(socket.id)

    io.emit('active-users', socketsConnected.size)

    // receiving data from client and broadcasting to to all clients
    socket.on('message', (data)=>{
        socket.broadcast.emit('chat-message', data)
    })

    socket.on('who-is-typing',(data)=>{
        socket.broadcast.emit('message-typing-user', data)
    })

    socket.on('disconnect', ()=>{
        console.log('Disconnected :', socket.id)
        socketsConnected.delete(socket.id)
        io.emit('active-users', socketsConnected.size)
    })


}

// connecting web socket
io.on('connection', onConnected)



