const express = require('express');
const fs = require('fs');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('.')); // serve static HTML/CSS/JS files

// ====== 🔧 Helper functions ======
function readJSON(file) {
  if (!fs.existsSync(file)) fs.writeFileSync(file, '[]');
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}
function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// ====== ⚙️ Config ======
const ADMIN_USER = 'lokesh';        // change this to your name
const ADMIN_PASS = '12345';         // change this to your secret password
const ADMIN_TOKEN = 'supersecrettoken123'; // random secret string for auth

// ====== 🧍 User Registration ======
app.post('/register', (req, res) => {
  const { username, password } = req.body;
  const users = readJSON('users.json');

  if (!username || !password)
    return res.json({ success: false, message: 'Missing username or password!' });

  if (users.find(u => u.username === username))
    return res.json({ success: false, message: 'Username already exists!' });

  users.push({ username, password, role: 'user' });
  writeJSON('users.json', users);
  res.json({ success: true });
});

// ====== 🔐 User Login ======
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const users = readJSON('users.json');
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) return res.json({ success: false, message: 'Invalid credentials!' });
  res.json({ success: true, role: user.role });
});

// ====== 💡 Submit Idea ======
app.post('/submit', (req, res) => {
  const { type, content, author } = req.body;
  if (!type || !content || !author)
    return res.json({ success: false, message: 'Incomplete data!' });

  const ideas = readJSON('ideas.json');
  const idea = { id: Date.now(), type, content, author, approved: false };
  ideas.push(idea);
  writeJSON('ideas.json', ideas);
  res.json({ success: true });
});

// ====== 🧠 Fetch Approved Ideas ======
app.get('/ideas', (req, res) => {
  const ideas = readJSON('ideas.json');
  res.json(ideas.filter(i => i.approved));
});

// ====== 👑 Admin Authentication ======
app.post('/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    res.json({ success: true, token: ADMIN_TOKEN });
  } else {
    res.json({ success: false, message: 'Invalid admin credentials!' });
  }
});

// Verify token route (used by frontend auto-login)
app.get('/admin/verify', (req, res) => {
  const auth = req.headers.authorization;
  if (auth === 'Bearer ' + ADMIN_TOKEN) {
    res.json({ valid: true });
  } else {
    res.status(403).json({ valid: false });
  }
});

// ====== 🧰 Middleware: Verify Admin Token ======
function verifyAdmin(req, res, next) {
  const auth = req.headers.authorization;
  if (auth && auth === 'Bearer ' + ADMIN_TOKEN) {
    next();
  } else {
    res.status(403).json({ error: 'Forbidden' });
  }
}

// ====== 👑 Admin Routes ======

// List all ideas (approved + pending)
app.get('/admin/ideas', verifyAdmin, (req, res) => {
  res.json(readJSON('ideas.json'));
});

// Approve idea
app.post('/admin/approve', verifyAdmin, (req, res) => {
  const ideas = readJSON('ideas.json');
  const idea = ideas.find(i => i.id === req.body.id);
  if (idea) idea.approved = true;
  writeJSON('ideas.json', ideas);
  res.json({ success: true });
});

// Reject idea
app.post('/admin/reject', verifyAdmin, (req, res) => {
  let ideas = readJSON('ideas.json');
  ideas = ideas.filter(i => i.id !== req.body.id);
  writeJSON('ideas.json', ideas);
  res.json({ success: true });
});

// ====== 🚀 Start Server ======
app.listen(3000, () => console.log('✅ Server running → http://localhost:3000'));
