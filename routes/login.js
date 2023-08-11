const express = require('express')
const router = express.Router()

router.post('/api/login', (req, res) => {
  console.log('body: ', req.body);
  res.json({ message: 'Hello from API!' });
});

module.exports = router