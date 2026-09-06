import express from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();

router.post('/login', async (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password || !role) return res.status(400).json({ message: 'All fields required' });

  let validUsername, validPassword;
  if (role === 'seller') { validUsername = process.env.SELLER_USERNAME; validPassword = process.env.SELLER_PASSWORD; }
  else if (role === 'admin') { validUsername = process.env.ADMIN_USERNAME; validPassword = process.env.ADMIN_PASSWORD; }
  else return res.status(400).json({ message: 'Invalid role' });

  if (username !== validUsername || password !== validPassword)
    return res.status(401).json({ message: 'Invalid credentials' });

  const token = jwt.sign({ username, role }, process.env.JWT_SECRET, { expiresIn: '24h' });
  res.json({ token, role, username, message: `Welcome back, ${username}!` });
});

router.post('/verify', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ valid: false });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ valid: true, role: decoded.role, username: decoded.username });
  } catch { res.status(401).json({ valid: false }); }
});

export default router;
