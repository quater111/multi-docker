const keys = require('./keys');

/** React App talks to Express Server
 *  Express App Setup
 */
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

// Object receives and response to http request to and from React app
const app = express();
// request from one domain to another domain
app.use(cors());
// turns body of post request into json value that express api can work with
app.use(bodyParser.json());

/**---------------------------------------------------------------
 * PostresSQL ist objektorientiertes Datenbankmanagementsystem
 *  Postgres Client Setup
 *  PSTGRES connected to EXPRESS Server stores all inidicies of every calculated value
 */
const { Pool } = require('pg');
// Create POSTGRES Client
const pgClient = new Pool({
    user: keys.pgUser,
    host: keys.pgHost,
    database: keys.pgDatabase,
    password: keys.pgPassword,
    port: keys.pgPort
});
 // Error listener
pgClient.on('error', () => console.log('Lost PG connection'));

// Create table called 'values' that stores all indicies of every calculated value
pgClient.query('CREATE TABLE IF NOT EXISTS values (number INT)').catch((err => console.log(err)));

/**-------------------------------------------------------------------
 * Redis ist eine In-Memory-Datenbank (cache)
 *  Redis Client Setup
 *  REDIS connected to EXPRESS Server stores current indicies of calculated values
 */
const redis = require('redis');
const redisClient = redis.createClient({
    host: keys.redisHost,
    port: keys.redisPort,
    retry_strategy: () => 1000
});
const redisPublisher = redisClient.duplicate();

/**---------------------------------------------------------------
 *  Express route handlers
 */

 app.get('/', (req, res) => {
     res.send('Hi');
 });

 // and req with /values/... to Express Server
// Nginx Webserver connects req with /api/values/.... to React Server
 app.get('/values/all', async (req, res) => {
      // select everything from table 'values' and send back the rows
     const values = await pgClient.query('SELECT * from values');
     res.send(values.rows);
 });

 app.get('/values/current', async (req, res) => {
    redisClient.hgetall('values', (err, values) => {
        res.send(values);
    });
 });

 app.post('/values', async (req, res) => {
     const index = req.body.index;

     if(parseInt(index) > 40){
         return res.status(422).send('Index too high');
     }
     // sets index into REDIS. Nothing yet as placeholder before first number comes in
     redisClient.hset('values', index, 'Nothing yet!');
     // Connects to WORKER for calculating the value of index
     redisPublisher.publish('insert', index);
     // storing the index permantent into POSTGRES database
     pgClient.query('INSERT INTO values(number) VALUES($1)', [index]);

     res.send({ working: true });
 });

 app.listen(5000, err => {
     console.log('Listening');
 });