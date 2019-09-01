/**
 * Worder watches REDIS for new inidicies.
 * Pulls each new inice and calculates new value
 * then puts it back into REDIS
 */
//file with keys for connecting to redis
const keys = require('./keys');
const redis = require('redis');

//Create REDIS Client
const redisClient = redis.createClient({
    //To connect to redis server
   host: keys.redisHost,
   port: keys.redisPort,
   //if connection is lost to redis server reconnect ones every second (1000 ms)
   retry_strategy: () => 1000 
});
const sub = redisClient.duplicate();


/**
 * Function for calculating Fibonacci Folge
 */

 function fib(index) {
     if (index < 2) return 1;
     return fib(index - 1) + fib(index -2);
 }

/*long version of function

 function fib(index) {
     if (index < 2){
         return 1;
     }
     else {
        return fib(index - 1) + fib(index -2);
     }
 }*/

// Anytime we get a new value that shows up in redis we calculate new fabonacci value and insert that into a hash of values.
// message = index value
 sub.on('message', (channel, message) => {
    redisClient.hset('values', message, fib(parseInt(message)));
 });
 // calculated Fabonacci value back into the instance
 sub.subscribe('insert');