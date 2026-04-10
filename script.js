// Replace this with your exact Hugging Face direct URL!
const API_URL = "https://prasanta4-ordis-ai.hf.space/ask";

const chatDisplay = document.getElementById('chat-display');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');

let chatHistory = [];

// Auto-resize textarea as you type
userInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
});

// Submit on 'Enter' (but allow Shift+Enter for new lines)
userInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

sendBtn.addEventListener('click', sendMessage);

async function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    // 1. Add User Message to UI
    appendMessage('user', text);
    userInput.value = '';
    userInput.style.height = 'auto';

    // 2. Add Loading Indicator
    const loadingId = appendMessage('ai', 'Processing data cubes', true);

    // 3. Prepare Payload
    const payload = {
        user_input: text,
        chat_history: chatHistory,
        base_persona: "Cephalon Ordis, the ship's AI."
    };

    try {
        // 4. Call Hugging Face Backend
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`Server Error: ${response.status}`);
        }

        const data = await response.json();
        
        // 5. Replace loading text with actual response
        updateMessage(loadingId, data.response);

        // 6. Save to JS memory so Ordis remembers context
        chatHistory.push({ role: 'user', content: text });
        chatHistory.push({ role: 'assistant', content: data.response });

        // Keep memory limit to avoid token bloat
        if (chatHistory.length > 6) {
            chatHistory = chatHistory.slice(-6);
        }

    } catch (error) {
        console.error("Fetch error:", error);
        updateMessage(loadingId, "*Connection to Orbiter failed.* Please check the backend CORS settings or space status.");
    }
}

function appendMessage(sender, text, isLoading = false) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message');
    messageDiv.classList.add(sender);
    
    // Create unique ID for updating later (used for loading states)
    const msgId = 'msg-' + Date.now();
    messageDiv.id = msgId;

    const icon = sender === 'user' ? '<div class="avatar-operator">OP</div>' : '<i class="fas fa-robot"></i>';
    const contentClass = isLoading ? 'content typing-indicator' : 'content';

    messageDiv.innerHTML = `
        <div class="avatar">${icon}</div>
        <div class="${contentClass}">${formatText(text)}</div>
    `;

    chatDisplay.appendChild(messageDiv);
    chatDisplay.scrollTop = chatDisplay.scrollHeight;
    
    return msgId;
}

function updateMessage(id, newText) {
    const messageDiv = document.getElementById(id);
    if (messageDiv) {
        const contentDiv = messageDiv.querySelector('.content');
        contentDiv.classList.remove('typing-indicator');
        contentDiv.innerHTML = formatText(newText);
        chatDisplay.scrollTop = chatDisplay.scrollHeight;
    }
}

// Simple formatter to handle bolding and new lines
function formatText(text) {
    return text
        .replace(/\n/g, '<br>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
}
