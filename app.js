// API Configuration
const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:8000'
    : '';

// State
let currentUser = null;
let userColor = null;
let authToken = null;
let pollingInterval = null;
let lastTimestamp = null;

// DOM Elements
const loginScreen = document.getElementById('loginScreen');
const chatScreen = document.getElementById('chatScreen');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
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
    // Auth tabs
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.addEventListener('click', handleTabSwitch);
    });
    
    // Forms
    loginForm.addEventListener('submit', handleLogin);
    registerForm.addEventListener('submit', handleRegister);
    messageForm.addEventListener('submit', handleSendMessage);
    logoutBtn.addEventListener('click', handleLogout);
    
    // Message input
    messageInput.addEventListener('input', handleMessageInput);
    messageInput.addEventListener('keydown', handleKeyDown);
}

function handleTabSwitch(e) {
    const targetTab = e.target.dataset.tab;
    
    // Update tabs
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    e.target.classList.add('active');
    
    // Update forms
    document.querySelectorAll('.auth-form').forEach(form => {
        form.classList.remove('active');
    });
    
    if (targetTab === 'login') {
        loginForm.classList.add('active');
        clearError('loginError');
    } else {
        registerForm.classList.add('active');
        clearError('registerError');
    }
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
    const savedToken = localStorage.getItem('flowchat_token');
    
    if (savedToken) {
        authToken = savedToken;
        validateToken();
    }
}

async function validateToken() {
    try {
        const response = await fetch(`${API_URL}/api/me`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            currentUser = data.username;
            userColor = data.color;
            showChatScreen();
        } else {
            // Token invalid, clear it
            localStorage.removeItem('flowchat_token');
            authToken = null;
        }
    } catch (error) {
        console.error('Token validation error:', error);
        localStorage.removeItem('flowchat_token');
        authToken = null;
    }
}

async function handleRegister(e) {
    e.preventDefault();
    clearError('registerError');
    
    const username = document.getElementById('registerUsername').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    
    if (!username || username.length < 3) {
        showError('registerError', 'Gebruikersnaam moet minimaal 3 karakters zijn');
        return;
    }
    
    if (password.length < 6) {
        showError('registerError', 'Wachtwoord moet minimaal 6 karakters zijn');
        return;
    }
    
    try {
        const payload = { username, password };
        if (email) {
            payload.email = email;
        }
        
        const response = await fetch(`${API_URL}/api/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.detail || 'Registratie mislukt');
        }
        
        currentUser = data.username;
        userColor = data.color;
        authToken = data.token;
        
        // Save token
        localStorage.setItem('flowchat_token', authToken);
        
        showChatScreen();
        
    } catch (error) {
        console.error('Register error:', error);
        showError('registerError', error.message || 'Er ging iets mis bij het registreren');
    }
}

async function handleLogin(e) {
    e.preventDefault();
    clearError('loginError');
    
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    if (!username || !password) {
        showError('loginError', 'Vul alle velden in');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/api/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.detail || 'Login mislukt');
        }
        
        currentUser = data.username;
        userColor = data.color;
        authToken = data.token;
        
        // Save token
        localStorage.setItem('flowchat_token', authToken);
        
        showChatScreen();
        
    } catch (error) {
        console.error('Login error:', error);
        showError('loginError', error.message || 'Ongeldige gebruikersnaam of wachtwoord');
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
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ content })
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                // Token expired, logout
                handleLogout();
                return;
            }
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
        sendBtn.disabled = false;
    }
}

async function loadMessages() {
    try {
        const response = await fetch(`${API_URL}/api/messages`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                handleLogout();
                return;
            }
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
            const response = await fetch(
                `${API_URL}/api/messages?since=${encodeURIComponent(lastTimestamp)}`,
                {
                    headers: {
                        'Authorization': `Bearer ${authToken}`
                    }
                }
            );
            
            if (!response.ok) {
                if (response.status === 401) {
                    handleLogout();
                }
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
        const response = await fetch(`${API_URL}/api/users`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
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

async function handleLogout() {
    try {
        await fetch(`${API_URL}/api/logout`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
    } catch (error) {
        console.error('Logout error:', error);
    }
    
    if (pollingInterval) {
        clearInterval(pollingInterval);
    }
    
    localStorage.removeItem('flowchat_token');
    
    currentUser = null;
    userColor = null;
    authToken = null;
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
    
    // Reset forms
    loginForm.reset();
    registerForm.reset();
    clearError('loginError');
    clearError('registerError');
}

function showError(elementId, message) {
    const errorEl = document.getElementById(elementId);
    errorEl.textContent = message;
}

function clearError(elementId) {
    const errorEl = document.getElementById(elementId);
    errorEl.textContent = '';
}

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        if (pollingInterval) {
            clearInterval(pollingInterval);
        }
    } else if (currentUser && authToken) {
        startPolling();
        // Reload messages when coming back to app
        loadMessages();
    }
});

// Mobile: Pull to refresh
let touchStartY = 0;
let touchEndY = 0;

messagesContainer.parentElement.addEventListener('touchstart', (e) => {
    touchStartY = e.touches[0].clientY;
}, { passive: true });

messagesContainer.parentElement.addEventListener('touchmove', (e) => {
    touchEndY = e.touches[0].clientY;
    const scrollTop = messagesContainer.parentElement.scrollTop;
    
    // Only trigger if at top and pulling down
    if (scrollTop === 0 && touchEndY > touchStartY + 50) {
        // Show refresh indicator (you can add UI for this)
    }
}, { passive: true });

messagesContainer.parentElement.addEventListener('touchend', async () => {
    const scrollTop = messagesContainer.parentElement.scrollTop;
    
    if (scrollTop === 0 && touchEndY > touchStartY + 100) {
        // Pull to refresh triggered
        await loadMessages();
        touchStartY = 0;
        touchEndY = 0;
    }
}, { passive: true });

// Prevent zoom on double-tap for message input
messageInput.addEventListener('touchend', (e) => {
    e.preventDefault();
    messageInput.focus();
}, { passive: false });

// Auto-hide keyboard on send
messageForm.addEventListener('submit', () => {
    if (window.innerWidth <= 768) {
        messageInput.blur();
        setTimeout(() => messageInput.focus(), 100);
    }
});

// Service Worker for PWA (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(() => {
            // Service worker not available, that's ok
        });
    });
}
