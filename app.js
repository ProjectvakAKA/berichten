// API Configuration
const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:8000'
    : ''; // Vercel will use relative paths

// State
let currentUser = null;
let userColor = null;
let pollingInterval = null;
let lastTimestamp = null;

// DOM Elements
const loginScreen = document.getElementById('loginScreen');
const chatScreen = document.getElementById('chatScreen');
const loginForm = document.getElementById('loginForm');
const usernameInput = document.getElementById('usernameInput');
const messageForm = document.getElementById('messageForm');
const messageInput = document.getElementById('messageInput');
const messagesContainer = document.getElementById('messagesContainer');
const sendBtn = document.getElementById('sendBtn');
const logoutBtn = document.getElementById('logoutBtn');
const charCount = document.getElementById('charCount');
const onlineCount = document.getElementById('onlineCount');
const currentUserBadge = document.getElementById('currentUser');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    checkExistingSession();
});

function setupEventListeners() {
    loginForm.addEventListener('submit', handleLogin);
    messageForm.addEventListener('submit', handleSendMessage);
    logoutBtn.addEventListener('click', handleLogout);
    messageInput.addEventListener('input', handleMessageInput);
    messageInput.addEventListener('keydown', handleKeyDown);
}

function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        messageForm.dispatchEvent(new Event('submit'));
    }
}

function handleMessageInput(e) {
    const length = e.target.value.length;
    charCount.textContent = length;
    
    // Auto-resize textarea
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
    
    // Update send button state
    sendBtn.disabled = length === 0 || length > 500;
}

function checkExistingSession() {
    const savedUser = localStorage.getItem('flowchat_user');
    const savedColor = localStorage.getItem('flowchat_color');
    
    if (savedUser && savedColor) {
        currentUser = savedUser;
        userColor = savedColor;
        showChatScreen();
    }
}

async function handleLogin(e) {
    e.preventDefault();
    
    const username = usernameInput.value.trim();
    
    if (!username) {
        showError('Voer een gebruikersnaam in');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/api/join`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username })
        });
        
        if (!response.ok) {
            throw new Error('Login mislukt');
        }
        
        const data = await response.json();
        currentUser = data.username;
        userColor = data.color;
        
        // Save to localStorage
        localStorage.setItem('flowchat_user', currentUser);
        localStorage.setItem('flowchat_color', userColor);
        
        showChatScreen();
        
    } catch (error) {
        console.error('Login error:', error);
        showError('Er ging iets mis bij het inloggen');
    }
}

function showChatScreen() {
    loginScreen.classList.remove('active');
    chatScreen.classList.add('active');
    
    // Update user badge
    const initial = currentUser.charAt(0).toUpperCase();
    currentUserBadge.querySelector('.user-initial').textContent = initial;
    currentUserBadge.querySelector('.user-initial').style.backgroundColor = userColor;
    currentUserBadge.querySelector('.user-name').textContent = currentUser;
    
    // Load existing messages
    loadMessages();
    
    // Start polling for new messages
    startPolling();
    
    // Focus message input
    messageInput.focus();
}

async function handleSendMessage(e) {
    e.preventDefault();
    
    const content = messageInput.value.trim();
    
    if (!content || content.length > 500) {
        return;
    }
    
    try {
        sendBtn.disabled = true;
        
        const response = await fetch(`${API_URL}/api/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                content,
                username: currentUser
            })
        });
        
        if (!response.ok) {
            throw new Error('Bericht versturen mislukt');
        }
        
        const message = await response.json();
        
        // Add message to UI
        addMessageToUI(message);
        
        // Clear input
        messageInput.value = '';
        charCount.textContent = '0';
        messageInput.style.height = 'auto';
        sendBtn.disabled = false;
        
        // Update last timestamp
        lastTimestamp = message.timestamp;
        
        // Focus input
        messageInput.focus();
        
    } catch (error) {
        console.error('Send message error:', error);
        showError('Kon bericht niet versturen');
        sendBtn.disabled = false;
    }
}

async function loadMessages() {
    try {
        const response = await fetch(`${API_URL}/api/messages`);
        
        if (!response.ok) {
            throw new Error('Berichten laden mislukt');
        }
        
        const data = await response.json();
        
        // Remove welcome message if exists
        const welcomeMsg = messagesContainer.querySelector('.welcome-message');
        if (welcomeMsg) {
            welcomeMsg.remove();
        }
        
        // Add all messages
        data.messages.forEach(message => {
            addMessageToUI(message, false);
        });
        
        // Update last timestamp
        if (data.messages.length > 0) {
            lastTimestamp = data.messages[data.messages.length - 1].timestamp;
        }
        
        // Load user count
        loadUserCount();
        
    } catch (error) {
        console.error('Load messages error:', error);
    }
}

function startPolling() {
    // Poll for new messages every 2 seconds
    pollingInterval = setInterval(async () => {
        if (!lastTimestamp) {
            return;
        }
        
        try {
            const response = await fetch(`${API_URL}/api/messages?since=${encodeURIComponent(lastTimestamp)}`);
            
            if (!response.ok) {
                return;
            }
            
            const data = await response.json();
            
            if (data.messages && data.messages.length > 0) {
                // Remove welcome message if exists
                const welcomeMsg = messagesContainer.querySelector('.welcome-message');
                if (welcomeMsg) {
                    welcomeMsg.remove();
                }
                
                // Add new messages
                data.messages.forEach(message => {
                    addMessageToUI(message);
                });
                
                // Update last timestamp
                lastTimestamp = data.messages[data.messages.length - 1].timestamp;
            }
            
            // Update user count periodically
            loadUserCount();
            
        } catch (error) {
            console.error('Polling error:', error);
        }
    }, 2000);
}

async function loadUserCount() {
    try {
        const response = await fetch(`${API_URL}/api/users`);
        
        if (response.ok) {
            const data = await response.json();
            onlineCount.textContent = data.users.length;
        }
    } catch (error) {
        console.error('Load users error:', error);
    }
}

function addMessageToUI(message, shouldScroll = true) {
    // Check if message already exists
    if (document.querySelector(`[data-message-id="${message.id}"]`)) {
        return;
    }
    
    const messageEl = document.createElement('div');
    messageEl.className = 'message';
    messageEl.setAttribute('data-message-id', message.id);
    
    const initial = message.username.charAt(0).toUpperCase();
    const time = formatTime(message.timestamp);
    
    messageEl.innerHTML = `
        <div class="message-avatar" style="background-color: ${message.color}">
            ${initial}
        </div>
        <div class="message-content">
            <div class="message-header">
                <span class="message-username" style="color: ${message.color}">
                    ${escapeHtml(message.username)}
                </span>
                <span class="message-time">${time}</span>
            </div>
            <div class="message-text">
                ${escapeHtml(message.content)}
            </div>
        </div>
    `;
    
    messagesContainer.appendChild(messageEl);
    
    if (shouldScroll) {
        scrollToBottom();
    }
}

function scrollToBottom() {
    messagesContainer.parentElement.scrollTo({
        top: messagesContainer.parentElement.scrollHeight,
        behavior: 'smooth'
    });
}

function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    // Less than 1 minute
    if (diff < 60000) {
        return 'Zojuist';
    }
    
    // Less than 1 hour
    if (diff < 3600000) {
        const minutes = Math.floor(diff / 60000);
        return `${minutes}m geleden`;
    }
    
    // Less than 24 hours
    if (diff < 86400000) {
        const hours = Math.floor(diff / 3600000);
        return `${hours}u geleden`;
    }
    
    // Show time
    return date.toLocaleTimeString('nl-NL', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function handleLogout() {
    if (pollingInterval) {
        clearInterval(pollingInterval);
    }
    
    localStorage.removeItem('flowchat_user');
    localStorage.removeItem('flowchat_color');
    
    currentUser = null;
    userColor = null;
    lastTimestamp = null;
    
    messagesContainer.innerHTML = `
        <div class="welcome-message">
            <div class="welcome-icon">💬</div>
            <h3>Welkom bij FlowChat!</h3>
            <p>Begin een gesprek door een bericht te sturen</p>
        </div>
    `;
    
    chatScreen.classList.remove('active');
    loginScreen.classList.add('active');
    
    usernameInput.value = '';
}

function showError(message) {
    // Simple error display - you can enhance this
    alert(message);
}

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        if (pollingInterval) {
            clearInterval(pollingInterval);
        }
    } else if (currentUser) {
        startPolling();
    }
});
