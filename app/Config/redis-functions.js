import { Redis } from "ioredis";

// Connect to the redis server
let client;
(() => {
  client = new Redis({
    port: 6379,
    host: '127.0.0.1',
  });

  client.on('connect', () => {
    console.log('Connected to Redis');
  });

  client.on('error', (error) => {
    console.error(error);
  });
})();

export default client;