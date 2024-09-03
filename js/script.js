console.log('Script is running');

const serverUrl = 'https://947d-106-249-0-85.ngrok-free.app';
console.log('Server URL:', serverUrl);

const chatbox = document.getElementById('chatbox');
const userInput = document.getElementById('user-input');
const emojiImage = document.getElementById('emoji-image');

userInput.addEventListener('input', function() {
    // 사용자가 입력할 때 이미지를 GIF로 변경
    emojiImage.src = 'character-image.gif';  // GIF 파일의 경로로 변경
});

userInput.addEventListener('blur', function() {
    // 사용자가 입력을 끝내고 입력 필드가 포커스를 잃었을 때 PNG로 변경
    emojiImage.src = 'character-image.png';  // PNG 파일의 경로로 변경
});
const sendButton = document.getElementById('send-button');
const clearHistoryButton = document.getElementById('clear-history');

console.log('DOM elements:', {chatbox, userInput, sendButton, clearHistoryButton});

let userId = localStorage.getItem('userId');
if (!userId) {
    userId = 'user_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('userId', userId);
}

function saveChat(message) {
    let chatHistory = JSON.parse(localStorage.getItem('chatHistory') || '[]');
    chatHistory.push(message);
    localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
}

function loadChatHistory() {
    let chatHistory = JSON.parse(localStorage.getItem('chatHistory') || '[]');
    chatHistory.forEach(message => {
        addMessageToUI(message, false);
    });
}

function addMessageToUI(message, animate = true) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    messageElement.textContent = message;
    if (!animate) {
        messageElement.style.opacity = 1;
        messageElement.style.transform = 'translateY(0)';
    }
    chatbox.appendChild(messageElement);
    chatbox.scrollTop = chatbox.scrollHeight;
}

function addMessage(message) {
    addMessageToUI(message);
    saveChat(message);
}

function addTypingIndicator() {
    const indicatorElement = document.createElement('div');
    indicatorElement.classList.add('message', 'typing-indicator');
    chatbox.appendChild(indicatorElement);
    chatbox.scrollTop = chatbox.scrollHeight;
    return indicatorElement;
}

function removeTypingIndicator(indicator) {
    if (indicator && indicator.parentNode) {
        indicator.parentNode.removeChild(indicator);
    }
}

async function sendMessage() {
    const message = userInput.value.trim();
    if (message) {
        userInput.value = '';
        const typingIndicator = addTypingIndicator();
        try {
            console.log('Sending request to:', `${serverUrl}/chat`);
            const response = await fetch(`${serverUrl}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: message, user_id: userId }),
            });
            console.log('Response received:', response);
            removeTypingIndicator(typingIndicator);
            if (response.ok) {
                const data = await response.json();
                console.log('Data received:', data);
                if (typeof data.response === 'string') {
                    addMessage(data.response);
                } else if (data.response && typeof data.response === 'object') {
                    addMessage(JSON.stringify(data.response));
                } else {
                    addMessage('서버로부터 예상치 못한 응답을 받았습니다.');
                }
            } else {
                const errorText = await response.text();
                console.error('Server error:', errorText);
                addMessage(`서버 오류: ${response.status} ${response.statusText}. ${errorText}`);
            }
        } catch (error) {
            console.error('Connection error:', error);
            removeTypingIndicator(typingIndicator);
            addMessage(`연결 오류: ${error.message}`);
        }
    }
}

function clearHistory() {
    localStorage.removeItem('chatHistory');
    chatbox.innerHTML = '';
    console.log('Chat history cleared');
}

sendButton.addEventListener('click', sendMessage);
userInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
});
clearHistoryButton.addEventListener('click', clearHistory);

function initChat() {
    console.log('Chat initialized for user:', userId);
    loadChatHistory();
}

document.addEventListener('DOMContentLoaded', initChat);
