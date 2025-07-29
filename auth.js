const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./database');

// Register new user
const registerUser = (username, email, password) => {
  return new Promise((resolve, reject) => {
    const hashedPassword = bcrypt.hashSync(password, 10);
    
    db.run(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username, email, hashedPassword],
      function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, username, email });
        }
      }
    );
  });
};

// Login user
const loginUser = (email, password) => {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT * FROM users WHERE email = ?',
      [email],
      (err, user) => {
        if (err) {
          reject(err);
        } else if (!user) {
          reject(new Error('User not found'));
        } else if (!bcrypt.compareSync(password, user.password)) {
          reject(new Error('Invalid password'));
        } else {
          const token = jwt.sign(
            { userId: user.id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
          );
          resolve({ token, user: { id: user.id, username: user.username, email: user.email } });
        }
      }
    );
  });
};

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  verifyToken
};
