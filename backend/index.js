const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('SmartUser Hub Backend Running 🚀');
});

app.get('/users', (req, res) => {
  res.json([
    { id: 1, name: "Sundhar" },
    { id: 2, name: "Pragalya" }
  ]);
});

app.post('/users', (req, res) => {
  const user = req.body;
  res.json({
    message: "User added successfully",
    user
  });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
