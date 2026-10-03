const express = require('express');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'carbon-footprint-secret';
const DATA_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(DATA_DIR, 'db.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

if (!fs.existsSync(DB_PATH)) {
  fs.writeFileSync(
    DB_PATH,
    JSON.stringify({ users: [], history: [] }, null, 2),
    'utf8'
  );
}

function readDb() {
  try {
    const file = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(file);
  } catch (error) {
    const freshDb = { users: [], history: [] };
    fs.writeFileSync(DB_PATH, JSON.stringify(freshDb, null, 2), 'utf8');
    return freshDb;
  }
}

function writeDb(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
}

function createToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
}

app.use(express.json({ limit: '1mb' }));
app.use(express.static(__dirname));

app.get('/health', (req, res) => {
  res.json({ success: true, message: 'Carbon calculator backend is running.' });
});

app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body || {};

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Name, email and password are required.' });
  }

  const safeName = String(name).trim();
  const safeEmail = String(email).trim().toLowerCase();

  if (!safeName || !safeEmail || String(password).length < 6) {
    return res.status(400).json({ success: false, message: 'Please provide valid details with a password of at least 6 characters.' });
  }

  const db = readDb();
  const emailExists = db.users.some((user) => user.email === safeEmail);

  if (emailExists) {
    return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
  }

  const passwordHash = await bcrypt.hash(String(password), 10);
  const newUser = {
    id: `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name: safeName,
    email: safeEmail,
    passwordHash
  };

  db.users.push(newUser);
  writeDb(db);

  const token = createToken(newUser);

  return res.status(201).json({
    success: true,
    token,
    name: newUser.name,
    email: newUser.email
  });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }

  const db = readDb();
  const user = db.users.find((entry) => entry.email === String(email).trim().toLowerCase());

  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid email or password.' });
  }

  const passwordMatches = await bcrypt.compare(String(password), user.passwordHash);

  if (!passwordMatches) {
    return res.status(401).json({ success: false, message: 'Invalid email or password.' });
  }

  const token = createToken(user);

  return res.json({
    success: true,
    token,
    name: user.name,
    email: user.email
  });
});

app.post('/api/calculate', authenticate, (req, res) => {
  const { electricity, petrolKm, diet } = req.body || {};

  const electricityUsage = Number(electricity);
  const petrolDistance = Number(petrolKm);
  const dietFactor = Number(diet);

  if ([electricityUsage, petrolDistance, dietFactor].some((value) => Number.isNaN(value) || value < 0)) {
    return res.status(400).json({ success: false, message: 'All fields must be valid non-negative numbers.' });
  }

  const electricityEmission = Number((electricityUsage * 0.42).toFixed(2));
  const transportEmission = Number((petrolDistance * 0.16).toFixed(2));
  const dietEmission = Number(dietFactor.toFixed(2));
  const total = Number((electricityEmission + transportEmission + dietEmission).toFixed(2));

  const record = {
    id: `calc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    userId: req.user.id,
    createdAt: new Date().toISOString(),
    emissions: {
      total,
      electricityEmission,
      transportEmission,
      dietEmission
    }
  };

  const db = readDb();
  db.history.push(record);
  writeDb(db);

  return res.json({
    success: true,
    data: {
      emissions: {
        total,
        electricityEmission,
        transportEmission,
        dietEmission
      }
    }
  });
});

app.get('/api/history', authenticate, (req, res) => {
  const db = readDb();
  const userHistory = db.history
    .filter((entry) => entry.userId === req.user.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 10)
    .map((entry) => ({
      id: entry.id,
      createdAt: entry.createdAt,
      emissions: entry.emissions
    }));

  return res.json({
    success: true,
    history: userHistory
  });
});

app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ success: false, message: 'Route not found.' });
  }

  return res.sendFile(path.join(__dirname, 'index.html'));
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Carbon calculator server running at http://localhost:${PORT}`);
  });
}

module.exports = app;
