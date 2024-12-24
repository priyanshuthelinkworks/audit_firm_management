import * as http from "http";
import https from "https";
import fs from "fs";
import * as Socket from "socket.io";
import App from "#wms/App";
import jwt from "jsonwebtoken";
import Constants from "#wms/Config/Constants";

let httpsoptions = {};
// if (process.env.NODE_ENV === "production") {
//   httpsoptions = {
//     key: fs.readFileSync("/var/www/html/server/ssl/private.key"),
//     cert: fs.readFileSync("/var/www/html/server/ssl/certificate.crt"),
//     ca: fs.readFileSync("/var/www/html/server/ssl/ca.crt"),
//   };
// }
const users = new Map(); // Map to store user IDs and their Socket IDs
const clients = new Map();

class ServerE {
  static serverInstance;
  Instance;
  server;
  port;
  io

  constructor() {
    this.Instance = new App();
    this.port = this.normalizePort(process.env.PORT || 8001);
    this.runServer();
   
    this.io= new Socket.Server(this.server,{
      cors:{
        origin:"*",
        methods: ["GET","POST"]
      }
    });
     
   
    this.initSocket(); 
  }

  getServerInstance() {
    return this.server;
  }

  static bootstrap() {
    if (!this.serverInstance) {
      this.serverInstance = new ServerE();
      return this.serverInstance;
    } else {
      return this.serverInstance;
    }
  }

  runServer() {
    this.Instance.Express.set("port", this.port);
    this.createServer();
  }

  createServer() {
    if (process.env.NODE_ENV === "production") {
      this.server = https.createServer(httpsoptions, this.Instance.Express);
    } else {
      this.server = http.createServer(this.Instance.Express);
    }
    //console.log('hi');
    // const io = new Server(this.server,{
    //   cors:{
    //     origin:"*",
    //     methods: ["GET","POST"]
    //   }
    // });

    this.server.listen(this.port);
    //this.server.setTimeout(900000);

    this.server.on("listening", () => {
      let address = this.server.address();
      let bind =
        typeof address === "string"
          ? `pipe ${address}`
          : `port ${address.port}`;
      console.log(`Listening on ${bind}`);
    });

    this.server.on("error", (error) => {
      if (error.syscall !== "listen") throw error;
      console.error(error);
      process.exit(1);
    });
  }

  normalizePort(val) {
    let port = typeof val === "string" ? parseInt(val, 10) : val;
    return port;
  }

  initSocket(){
    const io =this.io

    
    /*authorization middleware */
    io.use((Socket, next) => {
    const token = Socket.handshake.headers['authorization'];

    if (!token) {
        return next(new Error('Authentication error'));
    }

    // Remove 'Bearer ' prefix if present
    const tokenWithoutBearer = token.replace('Bearer ', '');

    jwt.verify(tokenWithoutBearer, Constants.auth.cipherKey, (err, decoded) => {
        if (err) {
            return next(new Error('Authentication error'));
        }

        // Store decoded info in Socket object if needed
        console.log("decoded",decoded)
        Socket.user = decoded;
       
        next();
    });
});


/*authorization middleware end */

    io.on('connect', (Socket) => { 
     

      const userId = Socket.user.id;
      const client = Socket.user.client;

      // If the user ID already exists, add the new Socket ID to the array
      if (users.has(userId)) {
          users.get(userId).add(Socket.id);
      } else {
          // Otherwise, create a new entry with the Socket ID
          users.set(userId, new Set([Socket.id]));
      }
 // If the user ID already exists, add the new Socket ID to the array
 if (clients.has(client)) {
  clients.get(client).add(userId);
} else {
  // Otherwise, create a new entry with the Socket ID
  clients.set(client, new Set([userId]));
}

      console.log(clients)
      
      console.log(`User connected: ${userId}, Socket ID: ${Socket.id}`);
  
      Socket.on('disconnect', () => {
          // Remove the Socket ID from the user's set
          const userSockets = users.get(userId);
          userSockets.delete(Socket.id);
  
          // If no more Socket IDs remain, remove the user entry
          if (userSockets.size === 0) {
              users.delete(userId);
          }
  
          console.log(`User disconnected: ${userId}, Socket ID: ${Socket.id}`);
      });
  
//
Socket.on("send",function (data) {
   console.log(data,'data')    
  //io.emit("receive",data)
let  recipientId = clients.get(data.client)
let message =data
if(recipientId){
  recipientId.forEach( userid =>{
    io.emit('private message',{ userid , message })
  })
}
 
  
})

      // Example: Listen for a 'private message' event
      Socket.on('private message', ({ recipientId, message }) => {
          const recipientSockets = users.get(recipientId);
          if (recipientSockets) {
              recipientSockets.forEach((SocketId) => {
                  io.to(SocketId).emit('private message', {
                      
                     ... message
                  });
              });
          }
      });
  


      
     

      Socket.on("receive",function (data) {
        console.log(data,'from Socket receive')
        io.emit("receive",data)
        
      })

     

     
      


      
      

     
    });
  

    io.on('connect_error', function(e) {
      console.log('problem with request1: ' + e.message);
    });
  }
}

export const server = ServerE.bootstrap();
