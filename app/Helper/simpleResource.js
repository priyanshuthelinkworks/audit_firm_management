import moduleMiddleware from "#wms/ModuleRegister/moduleMiddleware";
import registerModel from "#wms/ModuleRegister/registerModel";
import helper from "#wms/Helper/function";
import axios from "axios";
import { HelperFunctionController as helperCtrl } from "#wms/Helper/function";
import { Op, Sequelize, json } from "sequelize";

import client from "#wms/Config/redis-functions";

let CodeRemark = {}

// Function to generate unique cache key
function generateCacheKey(req) {
  let cacheKey = '';
  let {
    company,
    whse,
    inowner
  } = req.headers;
  let { page, size, langid } = req.headers;
  if (company) {
    cacheKey = cacheKey + company;
  }
  if (whse) {
    cacheKey = cacheKey + whse;
  }
  if (inowner) {
    cacheKey = cacheKey + inowner;
  }
  cacheKey = cacheKey + req.url;
  if (page) {
    cacheKey = cacheKey + page;
  }
  if (size) {
    cacheKey = cacheKey + size;
  }
  if (langid) {
    cacheKey = cacheKey;
  }
  console.log("CACHE KEY ==========>", cacheKey);
  return cacheKey;
}

// Middleware to handle caching
const cacheMiddleware = async (req, res, next) => {
  const { company, whse, inowner } = req.headers;
  const auth = req.auth;
  console.log(req.auth.USERID, "from");
  let cacheKey = generateCacheKey(req);
  cacheKey = cacheKey + req.auth.USERID;
  try {
    // Check if data exists in cache
    const cachedData = await client.get(cacheKey);
    if (cachedData) {
      console.log("going if");
      // If data exists in cache, return it
      const parsedData = JSON.parse(cachedData);
      return res.status(200).json({
        statusCode: 200,
        message: "Data fetched from cache successfully",
        data: parsedData,
      });
    }
    console.log("going else");
    // If data doesn't exist in cache, proceed with the main logic
    next();
  } catch (error) {
    console.error("Error retrieving data from cache:", error);
    next(); // Proceed with the main logic even if there's an error with caching
  }
};
// middleware.js

const removeWhitespace = async (req) => {
  try {
    // Check if req.body exists and is an object

    if (req.body && typeof req.body === "object") {
      // Iterate over each key in req.body
      Object.keys(req.body).forEach((key) => {
        // Check if the value is a string
        if (typeof req.body[key] === "string") {
          // Remove whitespace from the beginning and end of the string
          req.body[key] = req.body[key].trim();
          // if (req.body[key] === '') {
          //   delete req.body[key];
          // }
        }
      });
    }
    // Return the modified req.body
    console.log("from func", req.body);
    return req.body;
  } catch (error) {
    console.log("err", error);
    // If an error occurs, return an error response
  }
};

//module.exports = removeWhitespace;

function applyRoutes(moduleData, data, app) {
  //insertAppendMiddleware
  const insertAppendMiddleware = moduleData.appendMiddleware
    .filter((item) => {
      if (Array.isArray(item.applyFor)) {
        if (item.applyFor.includes("insert")) {
          return true;
        } else {
          return false;
        }
      }
      return true;
    })
    .map((item) => item.func);
  //updateAppendMiddleware
  const updateAppendMiddleware = moduleData.appendMiddleware
    .filter((item) => {
      if (Array.isArray(item.applyFor)) {
        if (item.applyFor.includes("modify")) {
          return true;
        } else {
          return false;
        }
      }
      return true;
    })
    .map((item) => item.func);
  //deleteAppendMiddleware
  const deleteAppendMiddleware = moduleData.appendMiddleware
    .filter((item) => {
      if (Array.isArray(item.applyFor)) {
        if (item.applyFor.includes("delete")) {
          return true;
        } else {
          return false;
        }
      }
      return true;
    })
    .map((item) => item.func);
  // change all middleware to function
  const resourceModel = registerModel.getModel(data.model);

  app["post"](
    data.route + "/resource",
    moduleMiddleware(moduleData, {
      ...data,
      type: "insert",
    }),
    ...data.middlewares,

    helper.upload.single("File"),
    async (req, res, next) => {
      console.log("sku", req.body);
      req.body = await removeWhitespace(req);
      //console.log("req",req.body);
      const ModelName = data.model;
      const Model = registerModel.installedModel.get(ModelName);
      const tableAttributes = Model.tableAttributes;
      
      let columns = Object.keys(
        registerModel.installedModel.get(ModelName).tableAttributes
      );
      const uniqueColumns = Object.keys(tableAttributes).filter((col) => {
        const attributes = tableAttributes[col];
        console.log("attributes", attributes.unique, attributes.primaryKey);
        return attributes.unique || (attributes.primaryKey && col !== "id");
      });

      
      const lowercaseReqBody = {};
      Object.keys(req.body).forEach((key) => {
        const value = req.body[key];
        lowercaseReqBody[key] =
          typeof value === "string" ? value.toLowerCase() : value;
      });

      var reqData = req.body;
    
      resourceModel
        .create(reqData, { returning: true })
        .then(async (result) => {
       
          /* Refresh Cache */
       
          
          /* ************* */

          return res.status(200).json({
           // status: 200,
            statusCode: 200,
            message: "Data created successfully",
            data: result,
          });
        })
        .catch((err) => {
          console.log(err);
          return res.status(500).json({
            statusCode: 500,
            message: err.message,
            data: [],
          });
        });
    },
    ...insertAppendMiddleware
  );

  // get data with pagination & search
  app["get"](
    data.route + "/resource/:id?",
    moduleMiddleware(moduleData, {
      ...data,
      type: "get",
    }),
    ...data.middlewares,
    
    async (req, res, next) => {
      const page = req.headers.page ? parseInt(req.headers.page) : 1;
      const size = req.headers.size ? parseInt(req.headers.size) : 50;
      const ModelName = data.model;
      let { limit, offset } = helper.getPagination(page, size);
      console.log(ModelName, limit, offset, "Model name---------------------------------");
      
      let order = [];
      console.log(req.auth);
      let Attributes = [];
      let filter = {
        limit,
        offset,
      };
     

      // ManuProfile 
    if(ModelName=='TICKETS00' || (ModelName=='WEATHERHIST00')){
      filter.where={
        STATUS:10100
      }
    }


      

      if (req.query.attributes) {
        let attributes = req.query.attributes;
        Attributes = attributes.includes(",")
          ? attributes.split(",")
          : [attributes];
        filter.attributes = Attributes;
      }
      //Search Query

      if (req.query.field && req.query.order) {
        order = [req.query.field, req.query.order];
        filter.order = [order];
      }

      if (req.query.column && req.query.value) {
        let column = req.query.column;
        let values = req.query.value;

        const colArr = column.includes(",") ? column.split(",") : [column];
        const valArr = values.includes(",") ? values.split(",") : [values];
       
        if (colArr.length === valArr.length) {
         
          const resultObject = colArr.reduce((obj, key, index) => {
            obj[key] = Sequelize.where(
              Sequelize.fn(
                "LOWER",
                Sequelize.cast(Sequelize.col(`"${ModelName}"."${key}"`), "TEXT")
              ),
              "ILIKE",
              `${valArr[index].toLowerCase()}`
            );
            return obj;
          }, {});

          filter = {
            limit,
            offset,
            where: resultObject,
          };
          if (req.query.attributes) filter.attributes = Attributes;
        } else {
          return res.status(422).json({
            //status: 422,
            statusCode:200,
            message: "values and columns count dnt match",
            data: [],
          });
        }
      }
     

    
      filter.order = [["id", "DESC"]];
     
      if (req.params.id) {
        if (req.query.attributes) filter.attributes = Attributes;
        filter.where = {
          ...(filter.where || {}),
          ...(req.params.id ? { id: req.params.id } : {}),
        };
        console.log("filter 1", filter);
        let result = await resourceModel.findOne(filter);
        

       
        /* Store Cache */
       
        /* ********** */
        res.status(200).json({
          //status: 200,
          statusCode:200,
          message: "Data fetch successfully",
          data: result,
        });
      } else {
        
       
        resourceModel
          .findAndCountAll(filter)
          .then(async (data) => {
            // const response = helper.getPagingData(data, page, limit);
            const Data = [];

            data.rows.map((el) => {
              if (el.STATUS) {
                el.STATUS = CodeRemark[el.STATUS]
                  ? CodeRemark[el.STATUS]
                  : el.STATUS;
              }
             
              Data.push(el);
            });
           
          
            res.status(200).json({
             // status: 200,
              statusCode:200,
              message: "Data fetch successfully",
              data: {
                count: data.count,
                rows: Data,
              },
            });

          })
          .catch((err) => {
            res.status(500).json({
              Status: 500,
              message:
                err.message ||
                "Some error occurred while retrieving tutorials.",
              data: [],
            });
          });
      }
      //
    }
  );

  // update data
  app.put(
    data.route + "/resource/:id?",
    moduleMiddleware(moduleData, {
      ...data,
      type: "update",
    }),
    ...data.middlewares,
    helper.upload.single("File"),
    async (req, res, next) => {
      try {
        req.body = await removeWhitespace(req);
        const ModelName = data.model;
        let columns = Object.keys(
          registerModel.installedModel.get(ModelName).tableAttributes
        );
        var reqData = req.body;

        delete reqData.id;
      
        let filter = {};
        let [affectedRows, updatedData] = [];
        // let filter={}
        if (req.query.column && req.query.value) {
          let column = req.query.column;
          let values = req.query.value;
          const colArr = column.includes(",") ? column.split(",") : [column];
          const valArr = values.includes(",") ? values.split(",") : [values];

          if (colArr.length === valArr.length) {
            const resultObject = colArr.reduce((obj, key, index) => {
              obj[key] = valArr[index];
              return obj;
            }, {});

            filter = {
              where: resultObject,
              returning: true,
            };
            
            if (filter) {
              [affectedRows, updatedData] = await resourceModel.update(
                reqData,
                filter
              );
            }
            if (affectedRows > 0) {

              return res.status(200).json({
                statusCode: 200,
                message: "Data updated successfully",
                data: updatedData, // Use `updatedUser` to send the updated data
              });
            } else {
              return res.status(404).json({
                statusCode: 404,
                message: "No Records updated",
                data: updatedData, // Use `updatedData` here
              });
            }
          }
        }
        

        if (req.params.id) {
          // Define a variable to capture previousData from the hook
          if(ModelName=='TICKETS00'){
          reqData["STATUS"]=10800
          }
          const [affectedRows, updatedData] = await resourceModel.update(
            reqData,
            {
              where: { id: req.params.id },
              returning: true, // Add this to return the updated data
            }
          );

          if (affectedRows > 0) {
         
            /* Refresh Cache */
            // const cacheKeyPattern = `${data.route}*`;
            // try {
            //   console.log(
            //     cacheKeyPattern,
            //     "=========================>key pattern"
            //   );
            //   if (req.params.id) {
            //     req.url = req.url.substring(0, req.url.lastIndexOf('/'));
            //   }
            //   await clearCache(cacheKeyPattern, req);
            //   console.log("Cache keys invalidated successfully");
            // } catch (error) {
            //   console.error("Error invalidating cache keys:", error);
            // }
            // /* ************* */
            return res.status(200).json({
              statusCode: 200,
              message: "Data updated successfully",
              data: {
                updated: updatedData,
              },
            });
          } else {
            return res.status(404).json({
              statusCode: 404,
              message: "Id not found",
            });
          }
        }
      } catch (err) {
        console.error(err);
        return res.status(500).json({
          statusCode: 500,
          message: err.message,
          data: [],
        });
      }
    },
    ...updateAppendMiddleware
  );
  // delete
  app["delete"](
    data.route + "/resource/:id",
    moduleMiddleware(moduleData, { ...data, type: "delete" }),
    ...data.middlewares,
    async (req, res, next) => {
      try {
        const ModelName = data.model;
       
        // let id = req.params.id;
        // let STATUS;
       
       
     
        // const chkalreadydeleted = await resourceModel.findAll({
        //   where: {
        //     id: {
        //       [Op.in]: arr,
        //     },
        //     STATUS: STATUS,
        //   },
        // });
       
        // if (arr.length === chkalreadydeleted.length) {
        //   return res.status(500).json({
        //     status: 500,
        //     message: "Requested record(s) are already deleted.",
        //     data: [],
        //   });
        // }

        // let updatedValues = {};
        
        // ModelName === "UPLDLOG01"
        //   ? (updatedValues.STATUS = 29900)
        //   : (updatedValues.STATUS = 10900);
     
        const result = await resourceModel.destroy({
          where: {
            id: req.params.id
          },
        });

        if (result[0] === 0) {
          return res.status(404).json({
            statusCode: 404,
            message: "Id not found",
            data: [],
          });
        }

     

        return res.status(200).json({
          statusCode: 200,
          message: "Data deleted successfully",
          data: [],
        });
      } catch (error) {
        console.log(error);
        return res.status(500).json({
          statusCode: 500,
          message: "Unable to delete the record!",
          data: [],
        });
      }
    },
    ...deleteAppendMiddleware
  );

  function findKeyByValue(obj, value) {
    for (let key in obj) {
      if (obj[key] === value) {
        return key;
      }
    }
    return null; // Return null if the value is not found
  }
  async function clearCache(cacheKeyPattern, req) {
    let cacheKey = ''
    let {
      company,
      whse,
      inowner
    } = req.headers;
    if (company) {
      cacheKey = cacheKey + company;
    }
    if (whse) {
      cacheKey = cacheKey + whse;
    }
    if (inowner) {
      cacheKey = cacheKey + inowner;
    }
    cacheKey = cacheKey + req.url;
    cacheKey = cacheKey + '*';
    console.log(cacheKey, cacheKeyPattern, "=============> cachekey, cache pattern");
    await client.keys(cacheKey, (err, keys) => {
      console.log(keys, "===============================> keys");
      if (err) {
        console.error("Error fetching keys:", err);
        return;
      }

      // Use the DEL command to delete the keys
      if (keys.length > 0) {
        client.del(keys, (err, numDeleted) => {
          if (err) {
            console.error("Error deleting keys:", err);
            return;
          }
          console.log(`Deleted ${numDeleted} keys`);
        });
      } else {
        console.log("No keys found matching the cacheKeyPattern");
      }
    });
  }
}
export default applyRoutes;
