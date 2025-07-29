const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const db = require('./database');

// Initialize Google AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// Create a new chat session
const createChatSession = async (userId, title = 'New Chat') => {
  try {
    const result = await db.query(
      'INSERT INTO chat_sessions (user_id, title) VALUES ($1, $2) RETURNING id, title, user_id',
      [userId, title]
    );
    return result.rows[0];
  } catch (error) {
    throw error;
  }
};

// Get all chat sessions for a user
const getUserChatSessions = async (userId) => {
  try {
    const result = await db.query(
      'SELECT * FROM chat_sessions WHERE user_id = $1 ORDER BY updated_at DESC',
      [userId]
    );
    return result.rows;
  } catch (error) {
    throw error;
  }
};

// Get messages for a specific chat session
const getChatMessages = async (sessionId, userId) => {
  try {
    // First verify the session belongs to the user
    const sessionResult = await db.query(
      'SELECT * FROM chat_sessions WHERE id = $1 AND user_id = $2',
      [sessionId, userId]
    );
    
    if (sessionResult.rows.length === 0) {
      throw new Error('Chat session not found or access denied');
    }
    
    // Get messages for the session
    const messagesResult = await db.query(
      'SELECT * FROM chat_messages WHERE session_id = $1 ORDER BY timestamp ASC',
      [sessionId]
    );
    
    return messagesResult.rows;
  } catch (error) {
    throw error;
  }
};

// Save a message to the database
const saveMessage = async (sessionId, message, sender) => {
  try {
    const result = await db.query(
      'INSERT INTO chat_messages (session_id, message, sender) VALUES ($1, $2, $3) RETURNING id, session_id, message, sender',
      [sessionId, message, sender]
    );
    
    // Update session's updated_at timestamp
    await db.query(
      'UPDATE chat_sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [sessionId]
    );
    
    return result.rows[0];
  } catch (error) {
    throw error;
  }
};

// Send message to chatbot API and get response
const sendToChatbot = async (message) => {
  try {
    // Primary: Use external chatbot API
    try {
      const response = await axios.post('https://r-chatbot.vercel.app/chatbot', {
        message: message,
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 second timeout
      });
      
      if (response.data && response.data.success && response.data.response) {
        return response.data.response;
      }
    } catch (apiError) {
      console.log('External chatbot API failed, trying Google AI fallback...');
    }
    
    // Fallback: Use Google Gemini API if available
    if (process.env.GOOGLE_API_KEY) {
      const modelNames = [
        process.env.GOOGLE_MODEL || 'gemini-1.5-flash',
        'gemini-1.5-flash',
        'gemini-pro',
        'gemini-1.0-pro'
      ];
      
      for (const modelName of modelNames) {
        try {
          const model = genAI.getGenerativeModel({ model: modelName });
          const result = await model.generateContent(message);
          const response = await result.response;
          return response.text();
        } catch (modelError) {
          console.log(`Model ${modelName} failed, trying next...`);
          continue;
        }
      }
    }
    
    // If all else fails, return a helpful message
    throw new Error('All AI services failed');
  } catch (error) {
    console.error('Chatbot API error:', error.message);
    // Fallback response when all APIs are not available
    return `I'm a helpful AI assistant! I received your message: "${message}". However, I'm currently experiencing some technical difficulties with my AI service. Please try again in a moment, or feel free to ask me anything else!`;
  }
};

// Delete a chat session
const deleteChatSession = async (sessionId, userId) => {
  try {
    // First verify the session belongs to the user
    const sessionResult = await db.query(
      'SELECT * FROM chat_sessions WHERE id = $1 AND user_id = $2',
      [sessionId, userId]
    );
    
    if (sessionResult.rows.length === 0) {
      throw new Error('Chat session not found or access denied');
    }
    
    // Delete the session (messages will be deleted automatically due to CASCADE)
    await db.query(
      'DELETE FROM chat_sessions WHERE id = $1',
      [sessionId]
    );
    
    return { message: 'Chat session deleted successfully' };
  } catch (error) {
    throw error;
  }
};

module.exports = {
  createChatSession,
  getUserChatSessions,
  getChatMessages,
  saveMessage,
  sendToChatbot,
  deleteChatSession
};
