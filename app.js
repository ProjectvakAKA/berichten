// FlowChat Pro - Professional Team Messaging Platform
// Enhanced with rich features: file uploads, text formatting, search, themes, etc.

// ===================================
// CONFIGURATION
// ===================================

const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:8000'
    : '';

const CONFIG = {
    POLLING_INTERVAL: 2000,
    TYPING_TIMEOUT: 3000,
    MAX_MESSAGE_LENGTH: 2000,
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    ALLOWED_FILE_TYPES: ['*/*']
};

// ===================================
// STATE MANAGEMENT
// ===================================

const state = {
    currentUser: null,
    userColor: null,
    authToken: null,
    pollingInterval: null,
    lastTimestamp: null,
    messages: [],
    users: [],
    isTyping: false,
    typingTimeout: null,
    editingMessage: null,
    pendingFile: null,
    theme: localStorage.getItem('flowchat_theme') || 'dark'
};

// ===================================
// DOM ELEMENTS
// ===================================

const elements = {
    // Screens
    loginScreen: document.getElementById('loginScreen'),
    chatScreen: document.getElementById('chatScreen'),
    
    // Forms
    loginForm: document.getElementById('loginForm'),
    registerForm: document.getElementById('registerForm'),
    messageForm: document.getElementById('messageForm'),
    
    // Auth inputs
    loginUsername: document.getElementById('loginUsername'),
    loginPassword: document.getElementById('loginPassword'),
    registerUsername: document.getElementById('registerUsername'),
    registerEmail: document.getElementById('registerEmail'),
    registerPassword: document.getElementById('registerPassword'),
    
    // Error messages
    loginError: document.getElementById('loginError'),
    registerError: document.getElementById('registerError'),
    
    // Chat elements
    messagesContainer: document.getElementById('messagesContainer'),
    messagesWrapper: document.getElementById('messagesWrapper'),
    messageInput: document.getElementById('messageInput'),
    sendBtn: document.getElementById('sendBtn'),
    charCount: document.getElementById('charCount'),
    onlineCount: document.getElementById('onlineCount'),
    usersList: document.getElementById('usersList'),
    currentUserCard: document.getElementById('currentUserCard'),
    typingIndicator: document.getElementById('typingIndicator'),
    
    // Buttons
    logoutBtn: document.getElementById('logoutBtn'),
    logoutMenuBtn: document.getElementById('logoutMenuBtn'),
    themeToggle: document.getElementById('themeToggle'),
    searchBtn: document.getElementById('searchBtn'),
    closeSearchBtn: document.getElementById('closeSearchBtn'),
    mobileMenuBtn: document.getElementById('mobileMenuBtn'),
    userMenuBtn: document.getElementById('userMenuBtn'),
    attachBtn: document.getElementById('attachBtn'),
    imageBtn: document.getElementById('imageBtn'),
    
    // File inputs
    fileInput: document.getElementById('fileInput'),
    imageInput: document.getElementById('imageInput'),
    filePreview: document.getElementById('filePreview'),
    
    // Panels & menus
    searchPanel: document.getElementById('searchPanel'),
    searchInput: document.getElementById('searchInput'),
    searchResults: document.getElementById('searchResults'),
    contextMenu: document.getElementById('contextMenu'),
    userMenu: document.getElementById('userMenu'),
    sidebar: document.getElementById('sidebar'),
    shortcutsModal: document.getElementById('shortcutsModal'),
    closeShortcutsBtn: document.getElementById('closeShortcutsBtn')
};

// ===================================
// INITIALIZATION
// ===================================

document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    setupEventListeners();
    applyTheme();
    checkExistingSession();
}

function setupEventListeners() {
    // Auth tabs
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.addEventListener('click', handleTabSwitch);
    });
    
    // Forms
    elements.loginForm.addEventListener('submit', handleLogin);
    elements.registerForm.addEventListener('submit', handleRegister);
    elements.messageForm.addEventListener('submit', handleSendMessage);
    
    // Buttons
    elements.logoutBtn.addEventListener('click', handleLogout);
    elements.logoutMenuBtn.addEventListener('click', handleLogout);
    elements.themeToggle.addEventListener('click', toggleTheme);
    elements.searchBtn.addEventListener('click', toggleSearch);
    elements.closeSearchBtn.addEventListener('click', toggleSearch);
    elements.mobileMenuBtn.addEventListener('click', toggleMobileSidebar);
    elements.userMenuBtn.addEventListener('click', toggleUserMenu);
    
    // File uploads
    elements.attachBtn.addEventListener('click', () => elements.fileInput.click());
    elements.imageBtn.addEventListener('click', () => elements.imageInput.click());
    elements.fileInput.addEventListener('change', handleFileSelect);
    elements.imageInput.addEventListener('change', handleFileSelect);
    
    // Message input
    elements.messageInput.addEventListener('input', handleMessageInput);
    elements.messageInput.addEventListener('keydown', handleMessageKeyDown);
    
    // Search
    elements.searchInput.addEventListener('input', debounce(handleSearch, 300));
    
    // Formatting buttons
    document.querySelectorAll('.format-btn[data-format]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const format = e.currentTarget.dataset.format;
            applyFormatting(format);
        });
    });
    
    // User menu items
    document.querySelectorAll('.dropdown-item[data-action]').forEach(item => {
        item.addEventListener('click', (e) => {
            const action = e.currentTarget.dataset.action;
            handleUserMenuAction(action);
        });
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleGlobalKeyboard);
    
    // Close menus on outside click
    document.addEventListener('click', handleOutsideClick);
    
    // Context menu
    document.addEventListener('contextmenu', handleContextMenu);
    
    // Shortcuts modal
    elements.closeShortcutsBtn.addEventListener('click', () => {
        elements.shortcutsModal.classList.remove('active');
    });
}

// ===================================
// AUTHENTICATION
// ===================================

async function checkExistingSession() {
    const savedToken = localStorage.getItem('flowchat_token');
    
    if (savedToken) {
        state.authToken = savedToken;
        await validateToken();
    }
}

async function validateToken() {
    try {
        const response = await fetch(`${API_URL}/api/me`, {
            headers: {
                'Authorization': `Bearer ${state.authToken}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            state.currentUser = data.username;
            state.userColor = data.color;
            showChatScreen();
        } else {
            localStorage.removeItem('flowchat_token');
            state.authToken = null;
        }
    } catch (error) {
        console.error('Token validation error:', error);
        localStorage.removeItem('flowchat_token');
        state.authToken = null;
    }
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
        elements.loginForm.classList.add('active');
        clearError('loginError');
    } else {
        elements.registerForm.classList.add('active');
        clearError('registerError');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    clearError('registerError');
    
    const username = elements.registerUsername.value.trim();
    const email = elements.registerEmail.value.trim();
    const password = elements.registerPassword.value;
    
    if (!username || username.length < 3) {
        showError('registerError', 'Username must be at least 3 characters');
        return;
    }
    
    if (!email || !email.includes('@') || !email.includes('.')) {
        showError('registerError', 'Please enter a valid email address');
        return;
    }
    
    if (password.length < 6) {
        showError('registerError', 'Password must be at least 6 characters');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/api/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, email, password })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.detail || 'Registration failed');
        }
        
        state.currentUser = data.username;
        state.userColor = data.color;
        state.authToken = data.token;
        
        localStorage.setItem('flowchat_token', state.authToken);
        showChatScreen();
        
    } catch (error) {
        console.error('Register error:', error);
        showError('registerError', error.message || 'Something went wrong during registration');
    }
}

async function handleLogin(e) {
    e.preventDefault();
    clearError('loginError');
    
    const username = elements.loginUsername.value.trim();
    const password = elements.loginPassword.value;
    
    if (!username || !password) {
        showError('loginError', 'Please fill in all fields');
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
            throw new Error(data.detail || 'Login failed');
        }
        
        state.currentUser = data.username;
        state.userColor = data.color;
        state.authToken = data.token;
        
        localStorage.setItem('flowchat_token', state.authToken);
        showChatScreen();
        
    } catch (error) {
        console.error('Login error:', error);
        showError('loginError', error.message || 'Invalid username or password');
    }
}

async function handleLogout() {
    try {
        await fetch(`${API_URL}/api/logout`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${state.authToken}`
            }
        });
    } catch (error) {
        console.error('Logout error:', error);
    }
    
    // Clear state
    localStorage.removeItem('flowchat_token');
    state.authToken = null;
    state.currentUser = null;
    state.userColor = null;
    
    if (state.pollingInterval) {
        clearInterval(state.pollingInterval);
    }
    
    // Hide menus
    elements.userMenu.classList.remove('active');
    
    // Show login screen
    elements.chatScreen.classList.remove('active');
    elements.loginScreen.classList.add('active');
}

function showChatScreen() {
    elements.loginScreen.classList.remove('active');
    elements.chatScreen.classList.add('active');
    
    // Update user badge
    updateCurrentUserBadge();
    
    // Start polling
    fetchMessages();
    fetchUsers();
    
    state.pollingInterval = setInterval(() => {
        fetchMessages();
        fetchUsers();
    }, CONFIG.POLLING_INTERVAL);
    
    // Focus input
    elements.messageInput.focus();
}

function updateCurrentUserBadge() {
    const avatarText = elements.currentUserCard.querySelector('.avatar-text');
    const userName = elements.currentUserCard.querySelector('.user-name');
    
    if (avatarText && userName) {
        avatarText.textContent = state.currentUser[0].toUpperCase();
        avatarText.parentElement.style.background = state.userColor;
        userName.textContent = state.currentUser;
    }
}

// ===================================
// MESSAGES
// ===================================

async function fetchMessages() {
    try {
        const url = state.lastTimestamp 
            ? `${API_URL}/api/messages?since=${encodeURIComponent(state.lastTimestamp)}`
            : `${API_URL}/api/messages`;
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${state.authToken}`
            }
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                handleLogout();
            }
            return;
        }
        
        const data = await response.json();
        
        if (data.messages && data.messages.length > 0) {
            const shouldScroll = isScrolledToBottom();
            
            data.messages.forEach(msg => {
                if (!state.messages.find(m => m.id === msg.id)) {
                    state.messages.push(msg);
                    renderMessage(msg);
                    state.lastTimestamp = msg.timestamp;
                }
            });
            
            if (shouldScroll) {
                scrollToBottom();
            }
        }
    } catch (error) {
        console.error('Fetch messages error:', error);
    }
}

async function handleSendMessage(e) {
    e.preventDefault();
    
    const content = elements.messageInput.value.trim();
    
    if (!content && !state.pendingFile) {
        return;
    }
    
    if (content.length > CONFIG.MAX_MESSAGE_LENGTH) {
        showError('messageError', `Message is too long (max ${CONFIG.MAX_MESSAGE_LENGTH} characters)`);
        return;
    }
    
    try {
        let messageContent = content;
        
        // Handle file upload
        if (state.pendingFile) {
            messageContent += `\n[File: ${state.pendingFile.name}]`;
            // In a real app, you would upload the file here
            clearFilePreview();
        }
        
        const response = await fetch(`${API_URL}/api/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${state.authToken}`
            },
            body: JSON.stringify({ content: messageContent })
        });
        
        if (!response.ok) {
            throw new Error('Failed to send message');
        }
        
        elements.messageInput.value = '';
        elements.charCount.textContent = '0';
        elements.sendBtn.disabled = true;
        resetTextareaHeight();
        
        // Stop typing indicator
        clearTypingIndicator();
        
        // Fetch new messages immediately
        await fetchMessages();
        
    } catch (error) {
        console.error('Send message error:', error);
        showError('messageError', 'Failed to send message');
    }
}

function renderMessage(message) {
    // Remove welcome message if it exists
    const welcomeMsg = elements.messagesContainer.querySelector('.welcome-message');
    if (welcomeMsg) {
        welcomeMsg.remove();
    }
    
    const messageGroup = document.createElement('div');
    messageGroup.className = 'message-group';
    messageGroup.dataset.messageId = message.id;
    
    // Message header
    const header = document.createElement('div');
    header.className = 'message-header';
    
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.style.background = message.color;
    avatar.textContent = message.username[0].toUpperCase();
    
    const info = document.createElement('div');
    info.className = 'message-info';
    
    const username = document.createElement('span');
    username.className = 'message-username';
    username.textContent = message.username;
    
    const timestamp = document.createElement('span');
    timestamp.className = 'message-timestamp';
    timestamp.textContent = formatTimestamp(message.timestamp);
    
    info.appendChild(username);
    info.appendChild(timestamp);
    header.appendChild(avatar);
    header.appendChild(info);
    
    // Message content
    const content = document.createElement('div');
    content.className = 'message-content';
    content.innerHTML = formatMessageContent(message.content);
    
    messageGroup.appendChild(header);
    messageGroup.appendChild(content);
    
    // Message actions (only for own messages)
    if (message.username === state.currentUser) {
        const actions = createMessageActions(message.id);
        messageGroup.appendChild(actions);
    }
    
    elements.messagesContainer.appendChild(messageGroup);
}

function formatMessageContent(content) {
    let formatted = escapeHtml(content);
    
    // Bold: **text**
    formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    
    // Italic: *text*
    formatted = formatted.replace(/\*(.+?)\*/g, '<em>$1</em>');
    
    // Code: `code`
    formatted = formatted.replace(/`(.+?)`/g, '<code>$1</code>');
    
    // Code block: ```code```
    formatted = formatted.replace(/```(.+?)```/gs, '<pre><code>$1</code></pre>');
    
    // Line breaks
    formatted = formatted.replace(/\n/g, '<br>');
    
    return formatted;
}

function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    // Less than 1 minute
    if (diff < 60000) {
        return 'Just now';
    }
    
    // Less than 1 hour
    if (diff < 3600000) {
        const mins = Math.floor(diff / 60000);
        return `${mins} ${mins === 1 ? 'min' : 'mins'} ago`;
    }
    
    // Today
    if (date.toDateString() === now.toDateString()) {
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }
    
    // This year
    if (date.getFullYear() === now.getFullYear()) {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    
    // Other
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function createMessageActions(messageId) {
    const actions = document.createElement('div');
    actions.className = 'message-actions';
    
    const editBtn = createActionButton('Edit', 'M11.3333 2L14 4.66667L5.33333 13.3333H2.66667V10.6667L11.3333 2Z');
    editBtn.addEventListener('click', () => startEditMessage(messageId));
    
    const deleteBtn = createActionButton('Delete', 'M3 4H13M12 4L11.5 12.5C11.5 13.0523 11.0523 13.5 10.5 13.5H5.5C4.94772 13.5 4.5 13.0523 4.5 12.5L4 4M6.5 2H9.5M6.5 6.5V10.5M9.5 6.5V10.5');
    deleteBtn.addEventListener('click', () => deleteMessage(messageId));
    
    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);
    
    return actions;
}

function createActionButton(title, pathD) {
    const btn = document.createElement('button');
    btn.className = 'message-action-btn';
    btn.title = title;
    btn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="${pathD}" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
    `;
    return btn;
}

async function deleteMessage(messageId) {
    if (!confirm('Are you sure you want to delete this message?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/api/messages/${messageId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${state.authToken}`
            }
        });
        
        if (response.ok) {
            const messageEl = document.querySelector(`[data-message-id="${messageId}"]`);
            if (messageEl) {
                messageEl.remove();
            }
            state.messages = state.messages.filter(m => m.id !== messageId);
        }
    } catch (error) {
        console.error('Delete message error:', error);
    }
}

function startEditMessage(messageId) {
    const message = state.messages.find(m => m.id === messageId);
    if (!message) return;
    
    state.editingMessage = messageId;
    elements.messageInput.value = message.content;
    elements.messageInput.focus();
    
    // Update message group to show editing state
    const messageEl = document.querySelector(`[data-message-id="${messageId}"]`);
    if (messageEl) {
        messageEl.classList.add('editing');
    }
}

// ===================================
// USERS
// ===================================

async function fetchUsers() {
    try {
        const response = await fetch(`${API_URL}/api/users`, {
            headers: {
                'Authorization': `Bearer ${state.authToken}`
            }
        });
        
        if (!response.ok) return;
        
        const data = await response.json();
        state.users = data.users;
        
        // Update online count
        elements.onlineCount.textContent = state.users.length;
        
        // Render users list
        renderUsersList();
    } catch (error) {
        console.error('Fetch users error:', error);
    }
}

function renderUsersList() {
    elements.usersList.innerHTML = '';
    
    state.users.forEach(user => {
        if (user.username === state.currentUser) return; // Skip current user
        
        const userItem = document.createElement('div');
        userItem.className = 'user-item';
        
        const avatar = document.createElement('div');
        avatar.className = 'user-avatar';
        avatar.style.background = user.color;
        
        const avatarText = document.createElement('span');
        avatarText.className = 'avatar-text';
        avatarText.textContent = user.username[0].toUpperCase();
        
        const statusDot = document.createElement('span');
        statusDot.className = 'status-dot';
        
        avatar.appendChild(avatarText);
        avatar.appendChild(statusDot);
        
        const userName = document.createElement('span');
        userName.className = 'user-name';
        userName.textContent = user.username;
        
        userItem.appendChild(avatar);
        userItem.appendChild(userName);
        
        elements.usersList.appendChild(userItem);
    });
}

// ===================================
// MESSAGE INPUT & FORMATTING
// ===================================

function handleMessageInput(e) {
    const length = e.target.value.length;
    elements.charCount.textContent = length;
    
    // Update send button state
    elements.sendBtn.disabled = length === 0 || length > CONFIG.MAX_MESSAGE_LENGTH;
    
    // Auto-resize textarea
    resetTextareaHeight();
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
    
    // Typing indicator
    sendTypingIndicator();
}

function handleMessageKeyDown(e) {
    // Enter to send (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (!elements.sendBtn.disabled) {
            elements.messageForm.dispatchEvent(new Event('submit'));
        }
    }
    
    // Escape to cancel editing
    if (e.key === 'Escape' && state.editingMessage) {
        cancelEditing();
    }
    
    // Ctrl+B for bold
    if (e.ctrlKey && e.key === 'b') {
        e.preventDefault();
        applyFormatting('bold');
    }
    
    // Ctrl+I for italic
    if (e.ctrlKey && e.key === 'i') {
        e.preventDefault();
        applyFormatting('italic');
    }
    
    // Ctrl+E for code
    if (e.ctrlKey && e.key === 'e') {
        e.preventDefault();
        applyFormatting('code');
    }
}

function applyFormatting(format) {
    const textarea = elements.messageInput;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    const before = textarea.value.substring(0, start);
    const after = textarea.value.substring(end);
    
    let formatted;
    let cursorOffset = 0;
    
    switch (format) {
        case 'bold':
            formatted = `**${selectedText || 'bold text'}**`;
            cursorOffset = selectedText ? formatted.length : 2;
            break;
        case 'italic':
            formatted = `*${selectedText || 'italic text'}*`;
            cursorOffset = selectedText ? formatted.length : 1;
            break;
        case 'code':
            formatted = `\`${selectedText || 'code'}\``;
            cursorOffset = selectedText ? formatted.length : 1;
            break;
        default:
            return;
    }
    
    textarea.value = before + formatted + after;
    
    // Set cursor position
    const newPosition = start + cursorOffset;
    textarea.setSelectionRange(newPosition, newPosition);
    textarea.focus();
    
    // Trigger input event to update char count
    textarea.dispatchEvent(new Event('input'));
}

function resetTextareaHeight() {
    elements.messageInput.style.height = 'auto';
}

function cancelEditing() {
    state.editingMessage = null;
    elements.messageInput.value = '';
    elements.charCount.textContent = '0';
    elements.sendBtn.disabled = true;
    resetTextareaHeight();
    
    // Remove editing state from message
    document.querySelectorAll('.message-group.editing').forEach(el => {
        el.classList.remove('editing');
    });
}

// ===================================
// FILE UPLOADS
// ===================================

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    // Check file size
    if (file.size > CONFIG.MAX_FILE_SIZE) {
        alert(`File is too large. Maximum size is ${CONFIG.MAX_FILE_SIZE / 1024 / 1024}MB`);
        e.target.value = '';
        return;
    }
    
    state.pendingFile = file;
    showFilePreview(file);
    
    // Enable send button
    elements.sendBtn.disabled = false;
}

function showFilePreview(file) {
    elements.filePreview.innerHTML = '';
    elements.filePreview.classList.add('active');
    
    const previewItem = document.createElement('div');
    previewItem.className = 'file-preview-item';
    
    // File thumbnail
    const thumb = document.createElement('div');
    thumb.className = 'file-preview-thumb';
    
    if (CONFIG.ALLOWED_IMAGE_TYPES.includes(file.type)) {
        const img = document.createElement('img');
        img.src = URL.createObjectURL(file);
        img.alt = file.name;
        thumb.appendChild(img);
    } else {
        thumb.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M13 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V9L13 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M13 2V9H20" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        `;
    }
    
    // File info
    const info = document.createElement('div');
    info.className = 'file-preview-info';
    
    const name = document.createElement('div');
    name.className = 'file-preview-name';
    name.textContent = file.name;
    
    const size = document.createElement('div');
    size.className = 'file-size';
    size.textContent = formatFileSize(file.size);
    
    info.appendChild(name);
    info.appendChild(size);
    
    // Remove button
    const removeBtn = document.createElement('button');
    removeBtn.className = 'file-preview-remove';
    removeBtn.type = 'button';
    removeBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
    `;
    removeBtn.addEventListener('click', clearFilePreview);
    
    previewItem.appendChild(thumb);
    previewItem.appendChild(info);
    previewItem.appendChild(removeBtn);
    
    elements.filePreview.appendChild(previewItem);
}

function clearFilePreview() {
    state.pendingFile = null;
    elements.filePreview.classList.remove('active');
    elements.filePreview.innerHTML = '';
    elements.fileInput.value = '';
    elements.imageInput.value = '';
    
    // Update send button state
    const hasText = elements.messageInput.value.trim().length > 0;
    elements.sendBtn.disabled = !hasText;
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// ===================================
// SEARCH
// ===================================

function toggleSearch() {
    const isActive = elements.searchPanel.classList.toggle('active');
    
    if (isActive) {
        elements.searchInput.focus();
    } else {
        elements.searchInput.value = '';
        elements.searchResults.innerHTML = '';
    }
}

function handleSearch(e) {
    const query = e.target.value.trim().toLowerCase();
    
    if (!query) {
        elements.searchResults.innerHTML = '';
        return;
    }
    
    const results = state.messages.filter(msg => 
        msg.content.toLowerCase().includes(query) ||
        msg.username.toLowerCase().includes(query)
    );
    
    renderSearchResults(results, query);
}

function renderSearchResults(results, query) {
    elements.searchResults.innerHTML = '';
    
    if (results.length === 0) {
        elements.searchResults.innerHTML = '<p style="padding: 1rem; text-align: center; color: var(--text-tertiary);">No results found</p>';
        return;
    }
    
    results.forEach(msg => {
        const item = document.createElement('div');
        item.className = 'search-result-item';
        
        const user = document.createElement('div');
        user.className = 'result-user';
        user.textContent = `${msg.username} • ${formatTimestamp(msg.timestamp)}`;
        
        const content = document.createElement('div');
        content.className = 'result-content';
        content.innerHTML = highlightText(escapeHtml(msg.content), query);
        
        item.appendChild(user);
        item.appendChild(content);
        
        item.addEventListener('click', () => {
            scrollToMessage(msg.id);
            toggleSearch();
        });
        
        elements.searchResults.appendChild(item);
    });
}

function highlightText(text, query) {
    const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
    return text.replace(regex, '<mark style="background: var(--primary-600); color: white; padding: 2px 4px; border-radius: 2px;">$1</mark>');
}

function scrollToMessage(messageId) {
    const messageEl = document.querySelector(`[data-message-id="${messageId}"]`);
    if (messageEl) {
        messageEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        messageEl.style.animation = 'none';
        setTimeout(() => {
            messageEl.style.animation = 'pulse 0.5s ease-in-out';
        }, 10);
    }
}

// ===================================
// THEME MANAGEMENT
// ===================================

function toggleTheme() {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    applyTheme();
    localStorage.setItem('flowchat_theme', state.theme);
}

function applyTheme() {
    document.documentElement.setAttribute('data-theme', state.theme);
}

// ===================================
// TYPING INDICATOR
// ===================================

function sendTypingIndicator() {
    if (state.isTyping) return;
    
    state.isTyping = true;
    
    // In a real app, send typing status to server
    // fetch(`${API_URL}/api/typing`, { ... });
    
    // Clear previous timeout
    if (state.typingTimeout) {
        clearTimeout(state.typingTimeout);
    }
    
    // Set new timeout
    state.typingTimeout = setTimeout(() => {
        clearTypingIndicator();
    }, CONFIG.TYPING_TIMEOUT);
}

function clearTypingIndicator() {
    state.isTyping = false;
    if (state.typingTimeout) {
        clearTimeout(state.typingTimeout);
        state.typingTimeout = null;
    }
}

// ===================================
// MOBILE SIDEBAR
// ===================================

function toggleMobileSidebar() {
    elements.sidebar.classList.toggle('active');
}

// ===================================
// USER MENU
// ===================================

function toggleUserMenu(e) {
    e.stopPropagation();
    elements.userMenu.classList.toggle('active');
    
    if (elements.userMenu.classList.contains('active')) {
        const rect = elements.userMenuBtn.getBoundingClientRect();
        elements.userMenu.style.top = `${rect.bottom + 8}px`;
        elements.userMenu.style.left = `${rect.left}px`;
    }
}

function handleUserMenuAction(action) {
    elements.userMenu.classList.remove('active');
    
    switch (action) {
        case 'profile':
            alert('Profile settings - Coming soon!');
            break;
        case 'preferences':
            alert('Preferences - Coming soon!');
            break;
        case 'shortcuts':
            elements.shortcutsModal.classList.add('active');
            break;
    }
}

// ===================================
// CONTEXT MENU
// ===================================

function handleContextMenu(e) {
    // Only show for messages
    const messageGroup = e.target.closest('.message-group');
    if (!messageGroup) return;
    
    const messageId = messageGroup.dataset.messageId;
    const message = state.messages.find(m => m.id === messageId);
    
    // Only for own messages
    if (!message || message.username !== state.currentUser) return;
    
    e.preventDefault();
    
    elements.contextMenu.classList.add('active');
    elements.contextMenu.style.top = `${e.clientY}px`;
    elements.contextMenu.style.left = `${e.clientX}px`;
    
    // Store message ID for context actions
    elements.contextMenu.dataset.messageId = messageId;
}

// Context menu actions
document.querySelectorAll('.context-item[data-action]').forEach(item => {
    item.addEventListener('click', (e) => {
        const action = e.currentTarget.dataset.action;
        const messageId = elements.contextMenu.dataset.messageId;
        
        elements.contextMenu.classList.remove('active');
        
        switch (action) {
            case 'edit':
                startEditMessage(messageId);
                break;
            case 'copy':
                copyMessageText(messageId);
                break;
            case 'delete':
                deleteMessage(messageId);
                break;
        }
    });
});

function copyMessageText(messageId) {
    const message = state.messages.find(m => m.id === messageId);
    if (!message) return;
    
    navigator.clipboard.writeText(message.content).then(() => {
        console.log('Message copied to clipboard');
    });
}

// ===================================
// KEYBOARD SHORTCUTS
// ===================================

function handleGlobalKeyboard(e) {
    // Ctrl+F for search
    if (e.ctrlKey && e.key === 'f') {
        e.preventDefault();
        toggleSearch();
    }
    
    // Ctrl+T for theme toggle
    if (e.ctrlKey && e.key === 't') {
        e.preventDefault();
        toggleTheme();
    }
    
    // Escape to close menus
    if (e.key === 'Escape') {
        elements.searchPanel.classList.remove('active');
        elements.contextMenu.classList.remove('active');
        elements.userMenu.classList.remove('active');
        elements.shortcutsModal.classList.remove('active');
        elements.sidebar.classList.remove('active');
    }
}

// ===================================
// OUTSIDE CLICK HANDLERS
// ===================================

function handleOutsideClick(e) {
    // Close context menu
    if (!elements.contextMenu.contains(e.target)) {
        elements.contextMenu.classList.remove('active');
    }
    
    // Close user menu
    if (!elements.userMenu.contains(e.target) && !elements.userMenuBtn.contains(e.target)) {
        elements.userMenu.classList.remove('active');
    }
    
    // Close mobile sidebar
    if (window.innerWidth <= 768) {
        if (!elements.sidebar.contains(e.target) && !elements.mobileMenuBtn.contains(e.target)) {
            elements.sidebar.classList.remove('active');
        }
    }
    
    // Close shortcuts modal
    if (e.target === elements.shortcutsModal) {
        elements.shortcutsModal.classList.remove('active');
    }
}

// ===================================
// UTILITY FUNCTIONS
// ===================================

function showError(errorId, message) {
    const errorEl = document.getElementById(errorId);
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.style.display = 'block';
    }
}

function clearError(errorId) {
    const errorEl = document.getElementById(errorId);
    if (errorEl) {
        errorEl.textContent = '';
        errorEl.style.display = 'none';
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function isScrolledToBottom() {
    const threshold = 100;
    return elements.messagesWrapper.scrollHeight - elements.messagesWrapper.scrollTop - elements.messagesWrapper.clientHeight < threshold;
}

function scrollToBottom() {
    elements.messagesWrapper.scrollTop = elements.messagesWrapper.scrollHeight;
}

// ===================================
// SERVICE WORKER REGISTRATION
// ===================================

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('ServiceWorker registered:', registration);
            })
            .catch(err => {
                console.log('ServiceWorker registration failed:', err);
            });
    });
}