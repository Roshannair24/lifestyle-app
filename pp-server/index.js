require('dotenv').config();
const express = require('express');
const pool = require('./db');
const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.send('Hello World!');
});

// Check the DB connection before starting the server
pool.query('SELECT 1')
  .then(() => {
    app.listen(port, () => {
      console.log(`Padosi pro app v1 listening on port ${port}`);
    });
  })
  .catch((err) => {
    console.error('Could not connect to Postgres', err);
    process.exit(1);
  });