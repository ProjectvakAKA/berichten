from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional
import uuid

app = FastAPI()

# CORS configuratie voor Vercel
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage (voor productie: gebruik Vercel KV of PostgreSQL)
messages_store = []
users_store = {}

class Message(BaseModel):
    content: str
    username: str

class User(BaseModel):
    username: str
    color: Optional[str] = None

class MessageResponse(BaseModel):
    id: str
    content: str
    username: str
    color: str
    timestamp: str

@app.get("/")
async def root():
    return {"status": "Messaging API is running"}

@app.post("/api/join")
async def join(user: User):
    """Gebruiker aanmelden"""
    if not user.username or len(user.username.strip()) == 0:
        raise HTTPException(status_code=400, detail="Username is required")
    
    # Genereer random kleur als deze niet is opgegeven
    if not user.color:
        colors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8", 
                  "#F7DC6F", "#BB8FCE", "#85C1E2", "#F8B739", "#52C41A"]
        import random
        user.color = random.choice(colors)
    
    users_store[user.username] = user.color
    
    return {
        "username": user.username,
        "color": user.color,
        "message": "Successfully joined the chat"
    }

@app.post("/api/messages")
async def send_message(message: Message):
    """Nieuw bericht versturen"""
    if not message.content or len(message.content.strip()) == 0:
        raise HTTPException(status_code=400, detail="Message content is required")
    
    msg_id = str(uuid.uuid4())
    user_color = users_store.get(message.username, "#6C757D")
    
    new_message = {
        "id": msg_id,
        "content": message.content,
        "username": message.username,
        "color": user_color,
        "timestamp": datetime.now().isoformat()
    }
    
    messages_store.append(new_message)
    
    # Beperk tot laatste 100 berichten
    if len(messages_store) > 100:
        messages_store.pop(0)
    
    return new_message

@app.get("/api/messages")
async def get_messages(since: Optional[str] = None):
    """Berichten ophalen (met optionele filtering vanaf timestamp)"""
    if since:
        try:
            since_dt = datetime.fromisoformat(since)
            filtered_messages = [
                msg for msg in messages_store 
                if datetime.fromisoformat(msg["timestamp"]) > since_dt
            ]
            return {"messages": filtered_messages}
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid timestamp format")
    
    return {"messages": messages_store}

@app.delete("/api/messages")
async def clear_messages():
    """Alle berichten wissen (admin functie)"""
    messages_store.clear()
    return {"message": "All messages cleared"}

@app.get("/api/users")
async def get_users():
    """Actieve gebruikers ophalen"""
    return {"users": [{"username": k, "color": v} for k, v in users_store.items()]}

# Vercel serverless handler
handler = app
