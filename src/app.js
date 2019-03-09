const bodyParser = require('body-parser');
const express = require('express');

const app = express();

app.use(bodyParser.json());

app.get('/status', (req, res) => {
  res.status(204).send('');
});

app.post('/send-welcome', (req, res) => {
  console.log(req.body);
  res.status(204).send('');
});

app.get('/', (req, res) => {
  res.send('Hello world!');
});

const port = process.env.PORT || 3000;
app.listen(port);
