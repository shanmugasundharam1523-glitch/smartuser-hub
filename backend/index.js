const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

// 🔐 Secret key (production la env use pannunga)
const SECRET = 'secret_key';

// ✅ MySQL Connection
const db = mysql.createConnection({
  host: 'host.docker.internal',
  port: 3307,
  user: 'root',
  password: 'root',
  database: 'userdb'
});

db.connect((err) => {
  if (err) {
    console.error('DB connection failed:', err);
  } else {
    console.log('DB Connected ✅');
  }
});

// ✅ Test API
app.get('/', (req, res) => {
  res.send('SmartUser Hub Backend Running 🚀');
});


// 🔐 REGISTER (Password Hashing)
app.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const sql = 'INSERT INTO users (name, email, password) VALUES (?, ?, ?)';

    db.query(sql, [name, email, hashedPassword], (err, result) => {
      if (err) return res.status(500).send(err);

      res.json({
        message: 'User registered securely 🔐',
        id: result.insertId
      });
    });

  } catch (error) {
    res.status(500).send(error);
  }
});


// 🔐 LOGIN (JWT)
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  db.query('SELECT * FROM users WHERE email=?', [email], async (err, result) => {
    if (err) return res.status(500).send(err);

    if (result.length === 0) {
      return res.status(401).json({ message: 'User not found ❌' });
    }

    const user = result[0];

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid password ❌' });
    }

    const token = jwt.sign({ id: user.id }, SECRET, {
      expiresIn: '1h'
    });

    res.json({
      message: 'Login successful ✅',
      token
    });
  });
});


// 🔐 Middleware (Protect APIs)
function auth(req, res, next) {
  const token = req.headers['authorization'];

  if (!token) return res.status(403).json({ message: 'Token required ❌' });

  jwt.verify(token, SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ message: 'Invalid token ❌' });

    req.user = decoded;
    next();
  });
}


// 🔒 Protected API
app.get('/users', auth, (req, res) => {
  db.query('SELECT id, name, email FROM users', (err, result) => {
    if (err) return res.status(500).send(err);

    res.json(result);
  });
});


// 🔒 Add user (Protected)
app.post('/users', auth, (req, res) => {
  const { name, email, password } = req.body;

  db.query(
    'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
    [name, email, password],
    (err, result) => {
      if (err) return res.status(500).send(err);

      res.json({
        message: 'User added ✅',
        id: result.insertId
      });
    }
  );
});


const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});