const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const db = require('./database');

// Initialize Google AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// Create a new chat session
const createChatSession = (userId, title = 'New Chat') => {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO chat_sessions (user_id, title) VALUES (?, ?)',
      [userId, title],
      function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, title, user_id: userId });
        }
      }
    );
  });
};

// Get all chat sessions for a user
const getUserChatSessions = (userId) => {
  return new Promise((resolve, reject) => {
    db.all(
      'SELECT * FROM chat_sessions WHERE user_id = ? ORDER BY updated_at DESC',
      [userId],
      (err, sessions) => {
        if (err) {
          reject(err);
        } else {
          resolve(sessions);
        }
      }
    );
  });
};

// Get messages for a specific chat session
const getChatMessages = (sessionId, userId) => {
  return new Promise((resolve, reject) => {
    // First verify the session belongs to the user
    db.get(
      'SELECT * FROM chat_sessions WHERE id = ? AND user_id = ?',
      [sessionId, userId],
      (err, session) => {
        if (err) {
          reject(err);
        } else if (!session) {
          reject(new Error('Chat session not found or access denied'));
        } else {
          // Get messages for the session
          db.all(
            'SELECT * FROM chat_messages WHERE session_id = ? ORDER BY timestamp ASC',
            [sessionId],
            (err, messages) => {
              if (err) {
                reject(err);
              } else {
                resolve(messages);
              }
            }
          );
        }
      }
    );
  });
};

// Save a message to the database
const saveMessage = (sessionId, message, sender) => {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO chat_messages (session_id, message, sender) VALUES (?, ?, ?)',
      [sessionId, message, sender],
      function(err) {
        if (err) {
          reject(err);
        } else {
          // Update session's updated_at timestamp
          db.run(
            'UPDATE chat_sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [sessionId]
          );
          resolve({ id: this.lastID, session_id: sessionId, message, sender });
        }
      }
    );
  });
};

// Send message to chatbot API and get response
const sendToChatbot = async (message) => {
  try {
    if (process.env.AI_PROVIDER === 'google' && process.env.GOOGLE_API_KEY) {
      // Use Google Gemini API with fallback models
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
      
      throw new Error('All Gemini models failed');
    } else {
      // Fallback to external API if configured
      const response = await axios.post(process.env.CHATBOT_API_URL, {
        message: message,
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.CHATBOT_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      
      return response.data.response || response.data.message || 'Sorry, I could not process your request.';
    }
  } catch (error) {
    console.error('Chatbot API error:', error.message);
    // Fallback response when API is not available
    return `I'm a helpful AI assistant! I received your message: "${message}". However, I'm currently experiencing some technical difficulties with my AI service. Please try again in a moment, or feel free to ask me anything else!`;
  }
};

// Delete a chat session
const deleteChatSession = (sessionId, userId) => {
  return new Promise((resolve, reject) => {
    // First verify the session belongs to the user
    db.get(
      'SELECT * FROM chat_sessions WHERE id = ? AND user_id = ?',
      [sessionId, userId],
      (err, session) => {
        if (err) {
          reject(err);
        } else if (!session) {
          reject(new Error('Chat session not found or access denied'));
        } else {
          // Delete messages first (foreign key constraint)
          db.run(
            'DELETE FROM chat_messages WHERE session_id = ?',
            [sessionId],
            (err) => {
              if (err) {
                reject(err);
              } else {
                // Then delete the session
                db.run(
                  'DELETE FROM chat_sessions WHERE id = ?',
                  [sessionId],
                  (err) => {
                    if (err) {
                      reject(err);
                    } else {
                      resolve({ message: 'Chat session deleted successfully' });
                    }
                  }
                );
              }
            }
          );
        }
      }
    );
  });
};

module.exports = {
  createChatSession,
  getUserChatSessions,
  getChatMessages,
  saveMessage,
  sendToChatbot,
  deleteChatSession
};
