const serverUrl = 'https://f64f-106-249-0-85.ngrok-free.app';
const chatbox = document.getElementById('chatbox');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');
const clearHistoryButton = document.getElementById('clear-history');
const characterImage = document.getElementById('character-image');

let userId = localStorage.getItem('userId');
if (!userId) {
    userId = 'user_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('userId', userId);
}

function loadChatHistory() {
    const chatHistory = JSON.parse(localStorage.getItem('chatHistory') || '[]');
    chatHistory.forEach(message => addMessageToUI(message.role, message.content));
}

function saveChatHistory(role, content) {
    const chatHistory = JSON.parse(localStorage.getItem('chatHistory') || '[]');
    chatHistory.push({ role, content });
    localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
}

function addMessageToUI(role, message) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    messageElement.classList.add(role === 'user' ? 'user-message' : 'bot-message');
    messageElement.textContent = message;
    chatbox.appendChild(messageElement);
    chatbox.scrollTop = chatbox.scrollHeight;
}

function setCharacterImage(isAnimated) {
    characterImage.src = isAnimated ? 'character-image.gif' : 'character-image.png';
}

function closeKeyboard() {
    if (document.activeElement instanceof HTMLInputElement) {
        document.activeElement.blur();
    }
}

async function sendMessage() {
    const message = userInput.value.trim();
    if (message) {
        setCharacterImage(true);
        addMessageToUI('user', message);
        saveChatHistory('user', message);
        userInput.value = '';
        
        // 키보드 닫기
        closeKeyboard();
        
        try {
            const chatHistory = JSON.parse(localStorage.getItem('chatHistory') || '[]');
            const response = await fetch(`${serverUrl}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    message: message, 
                    user_id: userId,
                    chat_history: chatHistory
                }),
            });
            if (response.ok) {
                const data = await response.json();
                addMessageToUI('assistant', data.response);
                saveChatHistory('assistant', data.response);
            } else {
                const errorText = await response.text();
                addMessageToUI('assistant', `Error: ${errorText}`);
            }
        } catch (error) {
            addMessageToUI('assistant', `Error: ${error.message}`);
        } finally {
            setCharacterImage(false);
            userInput.focus();
        }
    }
}

async function clearHistory() {
    try {
        const response = await fetch(`${serverUrl}/clear_history`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ user_id: userId }),
        });
        if (response.ok) {
            chatbox.innerHTML = '';
            localStorage.removeItem('chatHistory');
            addMessageToUI('assistant', '대화 내역이 초기화되었습니다.');
        } else {
            const errorText = await response.text();
            addMessageToUI('assistant', `Error: ${errorText}`);
        }
    } catch (error) {
        addMessageToUI('assistant', `Error: ${error.message}`);
    }
}

sendButton.addEventListener('click', sendMessage);

userInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        e.preventDefault(); // 폼 제출 방지
        sendMessage();
    }
});

clearHistoryButton.addEventListener('click', clearHistory);

userInput.addEventListener('input', function() {
    setCharacterImage(this.value.trim() !== '');
});

document.addEventListener('DOMContentLoaded', loadChatHistory);
