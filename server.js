require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { registerUser, loginUser, verifyToken } = require('./auth');
const {
  createChatSession,
  getUserChatSessions,
  getChatMessages,
  saveMessage,
  sendToChatbot,
  deleteChatSession
} = require('./chatService');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'client/build')));

// Auth routes
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    const user = await registerUser(username, email, password);
    res.status(201).json({ message: 'User registered successfully', user });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      res.status(400).json({ error: 'Username or email already exists' });
    } else {
      res.status(500).json({ error: 'Registration failed' });
    }
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    const result = await loginUser(email, password);
    res.json(result);
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

// Chat routes (protected)
app.post('/api/chat/sessions', verifyToken, async (req, res) => {
  try {
    const { title } = req.body;
    const session = await createChatSession(req.user.userId, title);
    res.status(201).json(session);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create chat session' });
  }
});

app.get('/api/chat/sessions', verifyToken, async (req, res) => {
  try {
    const sessions = await getUserChatSessions(req.user.userId);
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch chat sessions' });
  }
});

app.get('/api/chat/sessions/:sessionId/messages', verifyToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const messages = await getChatMessages(sessionId, req.user.userId);
    res.json(messages);
  } catch (error) {
    res.status(403).json({ error: error.message });
  }
});

app.post('/api/chat/sessions/:sessionId/messages', verifyToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    // Save user message
    const userMessage = await saveMessage(sessionId, message, 'user');
    
    // Get bot response
    const botResponse = await sendToChatbot(message);
    
    // Save bot message
    const botMessage = await saveMessage(sessionId, botResponse, 'bot');
    
    res.json({
      userMessage,
      botMessage
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send message' });
  }
});

app.delete('/api/chat/sessions/:sessionId', verifyToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const result = await deleteChatSession(sessionId, req.user.userId);
    res.json(result);
  } catch (error) {
    res.status(403).json({ error: error.message });
  }
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
