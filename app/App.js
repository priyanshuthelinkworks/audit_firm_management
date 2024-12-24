import * as DotEnv from "dotenv";
import express from "express";
import * as bodyParser from "body-parser";
import path from "path";
import { Sequelize, DataTypes } from "sequelize";
import client  from "#wms/Config/redis-functions";
import proxy from "express-http-proxy"

import  userRoutes from "#wms/ModuleRegister/Index";
import { fileURLToPath } from "url";
import { validateHeaderValue } from "http";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
class App {
  Express;

  constructor() {
    this.setEnvironment();
    this.Express = express();
    this.middleware();
  }

  middleware() {
    this.Express.use(bodyParser.default.json({limit: '900mb'}));
    this.Express.use(bodyParser.default.urlencoded({ extended: false }));
    //this.Express.use(timeout(900000));
    process.env.TZ = "Asia/Kolkata";

    this.Express.use(
      "/public",
      express.static(path.join(__dirname, "/public"))
    );
    this.Express.use((req, res, next) => {
      res.header("Access-Control-Allow-Origin", "*"); // dev only
      res.header("Access-Control-Allow-Methods", "OPTIONS,GET,PUT,POST,DELETE");
      res.header("Access-Control-Allow-Headers", "Content-Type, Authorization,Company,Whse,Inowner,Langid,Page,Size,Client");
      res.header("Access-Control-Expose-Headers", "x-total-count");
      if (req.method === "OPTIONS") {
        res.status(200).send();
      } else {
        next();
      }
    });

    const PROXY2 = {
      // "GateOperations": {
      //   url: process.env.BASEURL_GP,
      //   paths: ['/truckcheck/resource/', '/dock/resource/','/slot/resource/',
      //     '/maintainpo/resource/', '/updateonesti', '/PO', '/asn',
      //     '/asnlist', '/asn/resource', '/asn/discard', '/shelflifepercentage',
      //     "/truck-check-in",
      //     "/dock",
      //     "/pkconf/sku",
      //     "/skudrpdwn",
      //     "/po"
      //   ]
      // },
     
      
    }



    for (let [key, value] of Object.entries(PROXY2)) {
      value.paths.forEach((path) => {
        this.Express.use(path, proxy(value.url, {
          forwardPath: function (req, res) {
            console.log(req.originalUrl,"url")
            return req.originalUrl;
          }
        }))
      })
    }

  
    this.Express.use("", userRoutes);

  }

  setEnvironment() {
    DotEnv.config({ path: ".env" });
  }
}

export default App;
