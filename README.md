# ChatBot Web Application

A full-stack web application with user authentication and chatbot integration. Each user has separate chat sessions with persistent history.

## Features

- **User Authentication**: Secure login/signup with JWT tokens
- **Individual Chat Sessions**: Each user can create multiple chat sessions
- **Persistent Chat History**: All conversations are saved and retrievable
- **Modern UI**: Responsive design with a clean, user-friendly interface
- **Chatbot Integration**: Ready to integrate with your chatbot API

## Tech Stack

- **Backend**: Node.js, Express.js, SQLite3
- **Frontend**: React, React Router, Axios
- **Authentication**: JWT (JSON Web Tokens)
- **Database**: SQLite with separate tables for users, sessions, and messages

## Setup Instructions

### 1. Install Backend Dependencies
```bash
npm install
```

### 2. Install Frontend Dependencies
```bash
cd client
npm install
cd ..
```

### 3. Configure Environment Variables
Edit the `.env` file and update the following:
- `JWT_SECRET`: Your JWT secret key (change from default)
- `CHATBOT_API_URL`: Your chatbot API endpoint
- `CHATBOT_API_KEY`: Your chatbot API key

### 4. Build Frontend
```bash
npm run build
```

### 5. Start the Application
```bash
npm start
```

The application will be available at `http://localhost:3001`

## Development Mode

To run in development mode with hot reload:

### Terminal 1 (Backend):
```bash
npm run dev
```

### Terminal 2 (Frontend):
```bash
cd client
npm start
```

Backend will run on port 3001, frontend on port 3000.

## API Integration

The application is ready to integrate with your chatbot API. Update the following in `.env`:

1. `CHATBOT_API_URL`: Your chatbot endpoint
2. `CHATBOT_API_KEY`: Your API key

The `sendToChatbot` function in `chatService.js` handles the API integration. Currently, it includes a fallback echo response when the API is not configured.

## Database Schema

### Users Table
- id (Primary Key)
- username (Unique)
- email (Unique)
- password (Hashed)
- created_at

### Chat Sessions Table
- id (Primary Key)
- user_id (Foreign Key)
- title
- created_at
- updated_at

### Chat Messages Table
- id (Primary Key)
- session_id (Foreign Key)
- message
- sender ('user' or 'bot')
- timestamp

## API Endpoints

### Authentication
- `POST /api/register` - Register new user
- `POST /api/login` - Login user

### Chat (Protected Routes)
- `GET /api/chat/sessions` - Get user's chat sessions
- `POST /api/chat/sessions` - Create new chat session
- `GET /api/chat/sessions/:id/messages` - Get messages for a session
- `POST /api/chat/sessions/:id/messages` - Send message to chatbot
- `DELETE /api/chat/sessions/:id` - Delete chat session

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Protected routes
- User-specific data isolation
- Input validation

## Usage

1. **Register/Login**: Create an account or login with existing credentials
2. **Create Chat**: Click "New Chat" to start a conversation
3. **Send Messages**: Type and send messages to the chatbot
4. **Manage Sessions**: View, switch between, or delete chat sessions
5. **Logout**: Securely logout when done

## Customization

- Update the UI styling in the CSS files
- Modify the chatbot integration in `chatService.js`
- Add additional user fields in the database schema
- Customize the authentication flow as needed
