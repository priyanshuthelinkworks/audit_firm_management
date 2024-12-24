import * as express from "express";

import { dirname } from "path";
import path from "path";
import installedModules from "#wms/ModuleRegister/installedModules";
import registerModule from "#wms/ModuleRegister/registerModule";
import registerModel from "#wms/ModuleRegister/registerModel";
import registerMiddleware from "#wms/ModuleRegister/registerMiddleware";
import { fileURLToPath, pathToFileURL } from "url";
import applyRoutes from "#wms/Helper/simpleResource";

const app = express.Router();
const __filename = fileURLToPath(import.meta.url);
const url = path.resolve(__filename, "../../");
const wurl = pathToFileURL(url);
const appDir = wurl.href;
const ModuleDir = appDir + "/Module";
console.log(ModuleDir);
import db from "#wms/Config/database";

await db.authenticate()


const getMiddlewares = (middleware) => {
  const middlewares = [];
  if (middleware && Array.isArray(middleware)) {
    middleware.forEach((middleware) => {

      const module = registerMiddleware.get(middleware.name);
      if (module) {
        if (middleware.params) {
          middlewares.push(module.func(...middleware.params))
        }
        else {
          middlewares.push(module.func)
        }
      }
    });
  }
  return middlewares;
};

const l = installedModules.length;
// register core models
for (let i = 0; i < l; ++i) {
  const item = installedModules[i];
  console.log(item)
  const folderName = item.name;
  if (Array.isArray(item.include) && item.include.includes('model')) {
    const modelsExport = await import(
      path.join(ModuleDir, folderName, "Model", "index.js")
    );
    console.log("modelsExport", modelsExport)
    const models = modelsExport.default;
    models.forEach((modelData) => {
      registerModel.register(modelData);
    })
  }
}
// after schema is changed from all models, then finally install the models
registerModel.install();
registerModel.list()
// register middlewares
for (let i = 0; i < l; ++i) {
  const item = installedModules[i];
  const folderName = item.name;
  if (Array.isArray(item.include) && item.include.includes('middleware')) {
    const modelsExport = await import(
      path.join(ModuleDir, folderName, "Middleware", "index.js")
    );
  }
}
// list installed middlewares
registerMiddleware.list();
//register Routes
for (let i = 0; i < l; ++i) {
  const item = installedModules[i];
  const folderName = item.name;
  if (Array.isArray(item.include) && item.include.includes('coreRoutes')) {
    const routeItem = await import(
      path.join(ModuleDir, folderName, "Route", "index.js")
    );
    registerModule.register(folderName, true);
    const routeData = routeItem.default;
  //  console.log("routerouteData", routeData)
    for (var controllerFile in routeData) {
      
      if (Array.isArray(routeData[controllerFile])) {
        if(controllerFile!=='ResourceRoutes'){
          const controllerItem = await import(
            path.join(ModuleDir, folderName, "Controller", controllerFile + ".js")
          );
          const controller = controllerItem.default;
          console.log('controller', controller);
          const routes = routeData[controllerFile];
          if (Array.isArray(routes) && controller)
            routes.forEach((route) => {
              const middlewares = getMiddlewares(route.middleware);
              const aftercontrlmiddlewares = getMiddlewares(route.aftercontrlmiddleware);
              console.log("ch", route.method, route.action)
              app[route.method](
  
                route.route,
                ...middlewares,
                controller[route.action],
                ...aftercontrlmiddlewares
              );
            })
        }else{

          if (Array.isArray(item.appendMiddleware) && item.appendMiddleware.length > 0) {
            item.leafMiddleware = item.appendMiddleware[item.appendMiddleware.length - 1];
            item.appendMiddleware = item.appendMiddleware.map((middleFunc) => registerMiddleware.get(middleFunc))
          } else {
            console.log("comi")
            item.leafMiddleware = 'current';
            item.appendMiddleware = []
          }
  
          const contMid = routeData[controllerFile];
          contMid.map(el=>{
            console.log (el,'elllllllllllllllll++++++++++++++')
            el.middlewares = getMiddlewares(el.middlewares)
           
            
            // console.log(app,"app");
            applyRoutes(item, el, app);
          })
          
        }
        
      } else {


        // resource method
        if (Array.isArray(item.appendMiddleware) && item.appendMiddleware.length > 0) {
          item.leafMiddleware = item.appendMiddleware[item.appendMiddleware.length - 1];
          item.appendMiddleware = item.appendMiddleware.map((middleFunc) => registerMiddleware.get(middleFunc))
        } else {
          item.leafMiddleware = 'current';
          item.appendMiddleware = []
        }

        const contMid = routeData[controllerFile];
        contMid.middlewares = getMiddlewares(contMid.middlewares)
        console.log("contmid", contMid);
        // console.log(app,"app");
        applyRoutes( item,contMid, app);
        
      }
    }
  }
}
registerModule.list();


export default app;