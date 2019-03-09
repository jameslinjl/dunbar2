const express = require('express');
const app = express();

app.get('/status', (req, res) => {
  res.status(204).send('');
});

app.get('/', (req, res) => {
  res.send('Hello world!');
});

const port = process.env.PORT || 3000;
app.listen(port);
