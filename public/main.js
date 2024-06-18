const socket = io()

const onlineUser = document.getElementById("online-count")
const messageContainer = document.getElementById("message-container")
const nameInput = document.getElementById("name-input")
const messageForm = document.getElementById("message-form")
const messageInput = document.getElementById("message-input")

// Save name to localStorage
const saveNameToLocalStorage = (name) => {
    localStorage.setItem('name', name)
}

// Load name from localStorage
const loadNameFromLocalStorage = () => {
    const name = localStorage.getItem('name')
    if (name) {
        nameInput.value = name
    }
}

// Save message to localStorage
const saveMessageToLocalStorage = (data) => {
    let messages = JSON.parse(localStorage.getItem('messages')) || []
    messages.push(data)
    localStorage.setItem('messages', JSON.stringify(messages))
}

// Load messages from localStorage
const loadMessagesFromLocalStorage = () => {
    let messages = JSON.parse(localStorage.getItem('messages')) || []
    messages.forEach(data => {
        addMessageToUI(data.name === nameInput.value, data, false)
    })
}

const sendMessage = () => {
    const name = nameInput.value
    const message = messageInput.value

    if (name && message) {
        saveNameToLocalStorage(name)

        const data = {
            name: name,
            message: message,
            dateTime: new Date(),
        }
        socket.emit('message', data)
        addMessageToUI(true, data, true)
        messageInput.value = ''
    }
}

// Broadcasting message to all clients
socket.on('chat-message', (data) => {
    addMessageToUI(false, data, true)
})

messageForm.addEventListener('submit', (e) => {
    e.preventDefault()
    sendMessage()
    scrollToDown()
})

socket.on('active-users', (data) => {
    onlineUser.innerText = `Users Online: ${data}`
})

const addMessageToUI = (isOwnMessage, data, shouldSave) => {
    clearMessageTyping()
    let formattedDate = 'Invalid Date'
    
    // Attempt to create a Date object from data.dateTime
    const dateTime = new Date(data.dateTime)
    if (!isNaN(dateTime)) {
        const options = { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
        }
        formattedDate = new Intl.DateTimeFormat('en-US', options).format(dateTime)
    }

    const element = `
        <li class="${isOwnMessage ? 'message-right' : 'message-left'}">
            <span class="message-name">${data.name}</span>
            <p class="message">${data.message}</p>
            <span class="message-time">${formattedDate}</span>
        </li>
    `
    messageContainer.innerHTML += element
    if (shouldSave) {
        saveMessageToLocalStorage(data)
    }
    scrollToDown()
}

function scrollToDown() {
    messageContainer.scrollTo(0, messageContainer.scrollHeight)
}

messageInput.addEventListener('focus', (e) => {
    socket.emit('who-is-typing', {
        feedback: `${nameInput.value} is typing`,
    })
})

messageInput.addEventListener('keypress', (e) => {
    socket.emit('who-is-typing', {
        feedback: `${nameInput.value} is typing...`
    })
})

messageInput.addEventListener('blur', (e) => {
    socket.emit('who-is-typing', {
        feedback: ''
    })
})

messageInput.addEventListener('keyup', (e) => {
    socket.emit('who-is-typing', {
        feedback: ''
    })
})

socket.on('message-typing-user', (data) => {
    clearMessageTyping()
    const element = `
    <li class="message-typing px-5 flex justify-center">
        <p class="typing"> ${data.feedback} </p>
    </li>
    `
    messageContainer.innerHTML += element
})

function clearMessageTyping() {
    document.querySelectorAll('li.message-typing').forEach(element => {
        element.parentNode.removeChild(element)
    })
}

// Load name and messages when the page loads
document.addEventListener('DOMContentLoaded', () => {
    loadNameFromLocalStorage()
    loadMessagesFromLocalStorage()
})
