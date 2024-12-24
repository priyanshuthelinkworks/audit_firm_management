import { Sequelize, DataTypes, Op } from "sequelize";
import sequelize from "#wms/Config/database";

import axios from "axios";
import registerModel from "#wms/ModuleRegister/registerModel";
import multer from "multer";

import fs from "fs";
import XLSX from 'xlsx'
import path from "path";
import { dirname } from "path";
import { fileURLToPath } from 'url';
// Get the current module file path
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename)
import client from "#wms/Config/redis-functions";

let getSchemaDetails = (tableName,database) => {

  return new Promise(async (resolve, reject) => {
    try {
      let sequelize1 =sequelize
    database?sequelize1 = new Sequelize(`${database}`,{
      timezone:process.env.timezone||'+05:30',}):sequelize
      const tableColumns = await sequelize1.query(
        `
      SELECT column_name,column_default,is_nullable,data_type,udt_name,character_maximum_length,numeric_precision,is_updatable
      FROM information_schema.columns
      WHERE table_name = :TABLENAME
    `,
        {
          replacements: { TABLENAME: tableName },
          type: sequelize.QueryTypes.SELECT,
        }
      );

      //console.log(tableColumns);exit();
      let fieldObj = {};
      tableColumns.forEach((column) => {
        let type = DataTypes.STRING(255);
        let allowNull = false;
        let notEmpty = false;
        if (column.udt_name == "varchar") {
          type = DataTypes.STRING(column.character_maximum_length);
        } else if (column.data_type == "integer") {
          type = DataTypes.INTEGER;
        } else if (column.data_type == "jsonb") {
          type = DataTypes.JSONB;
        } else if (column.data_type == "text") {
          type = DataTypes.TEXT;
        } else if (column.data_type == "boolean") {
          type = DataTypes.BOOLEAN;
        } else if (column.data_type == "smallint") {
          type = DataTypes.SMALLINT;
        }
        if (column.is_nullable == "YES") {
          allowNull = true;
        } else {
          notEmpty = true;
        }
        if (column.column_name != "id") {
          fieldObj[column.column_name] = { type: type, allowNull: allowNull };
          if (notEmpty) {
            fieldObj[column.column_name].validate = { notEmpty: notEmpty };
          }
        }
      });

      //console.log(fieldObj);exit;

      resolve(fieldObj);
    } catch (error) {
      reject(error);
    }
  });
};
class HelperFunctionController {
  constructor() { }
  static generateSerialControllNumber = async (req, url) => {
    return new Promise(async (resolve, reject) => {
      try {
        const config = {
          headers: {
            authorization: `${req.headers.authorization}`,
            company: `${req.headers.company}`,
            whse: `${req.headers.whse}`,
            inowner: `${req.headers.inowner}`
          }
        };
        let Base_url = process.env.BASEURL
        const response1 = await axios.put(
          Base_url + url,
          null, // No payload
          config
        );
        resolve(response1.data.data);
      }
      catch (error) {
        reject(error);
      }
    });
  };
  static async getFilePath(path) {
    let folderName = "public";
    path = path.split(folderName);
    return folderName + path[1];
  }

  static getOtp = async (LOGINID) => {
    return new Promise(async (resolve, reject) => {
      try {
        const OTPDETL = registerModel.getModel("OTPDETL");
        /// let val = Math.floor(1000 + Math.random() * 9000);
        let val = 1234;
        // let OtpDetail = await OTPDETL.findOne({ where: { LOGINID: LOGINID } });
        let OtpDetail = 1234;

        if (OtpDetail) {
          // const updatedAt = new Date(OtpDetail.updatedAt);
          // const currentTime = new Date();
          // const timeDifference = currentTime - updatedAt;
          // const timeDifferenceInMinutes = timeDifference / (1000 * 60);

          // if (timeDifferenceInMinutes < 10) {
          //   resolve({ otp: OtpDetail.otp, isValidOtp: true });
          // } else {
          //   resolve({ otp: val, isValidOtp: false });
          // }
          resolve({ otp: val, isValidOtp: false });
        } else {
          resolve({ otp: val, isValidOtp: false });
        }
      } catch (error) {
        reject(error);
      }
    });
  };

  static async paginationBuilder(query = "") {
    var pagination = {};
    var take = query._limit;
    var pageNo = query._page;
    var skip = (pageNo - 1) * take;
    pagination.take = Number(take);
    pagination.skip = Number(skip);
    return pagination;
  }

  static async getDefaultValue(columnName, tableName) {
    try {
      // Use raw SQL query to get default value
      const query = `SELECT column_default FROM information_schema.columns 
                     WHERE table_name = '${tableName}' AND column_name = '${columnName}';`;

      const result = await sequelize.query(query, {
        type: Sequelize.QueryTypes.SELECT,
      });

      // Extract the default value from the result
      const defaultValue = result[0].column_default;
      // console.log(`Default value of ${columnName}:`, defaultValue);

      return defaultValue;
    } catch (error) {
      console.error("Error retrieving default value:", error.message);
    }
  }

  static async fixedNum(value) {
    let num = value.toFixed(2);
    return Number(num);
  }

  static async getPagingData(data, page, limit) {
    //console.log("initdata",data);
    const { count: totalItems, rows: result } = data;
    const currentPage = page ? +page : 0;
    const totalPages = Math.ceil(totalItems / limit);
    return { totalItems, totalPages, currentPage, result };
  }

  // static async getPagination(page, size) {
  //   const limit = size ? +size : 25;
  //   const offset = page ? page * limit : 0;

  //   return { limit, offset };
  // }

  static async getFields(tableName) {
    const tableColumns = await sequelize.query(
      `
  SELECT
    c.column_name,
    c.column_default,
    c.is_nullable,
    c.data_type,
    c.udt_name,
    c.character_maximum_length,
    c.numeric_precision,
    c.numeric_scale,
    c.is_updatable,
    CASE
    WHEN tc.constraint_type = 'PRIMARY KEY' THEN 'Primary Key'
      WHEN tc.constraint_type = 'UNIQUE' THEN 'Unique Key'
      ELSE NULL
    END AS constraint_type
  FROM information_schema.columns c
  LEFT JOIN information_schema.constraint_column_usage ccu ON c.column_name = ccu.column_name AND c.table_name = ccu.table_name
  LEFT JOIN information_schema.table_constraints tc ON ccu.constraint_name = tc.constraint_name
  WHERE c.table_name = :TABLENAME
`,
      {
        replacements: { TABLENAME: tableName },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    //console.log(tableColumns);exit();
    let fieldObj = {};
    tableColumns.forEach((column) => {
      let type = DataTypes.STRING(255);
      let allowNull = false;
      let notEmpty = false;

      if (column.udt_name == "varchar") {
        type = DataTypes.STRING(column.character_maximum_length);
      } else if (
        column.data_type == "integer" ||
        column.data_type == "numeric"
      ) {
        type = DataTypes.INTEGER;
        //console.log("fieldObj_integer",column.column_name);
      }
      else if (column.data_type == "json") {
        type = DataTypes.JSON;
      } else if (column.data_type == "jsonb") {
        type = DataTypes.JSONB;
      }
      else if (column.data_type == "text") {
        type = DataTypes.TEXT;
      } else if (column.data_type == "boolean") {
        type = DataTypes.BOOLEAN;
      } else if (column.data_type == "smallint") {
        type = DataTypes.SMALLINT;
      } else if (
        column.data_type == "date" ||
        column.data_type == "timestamp with time zone"
      ) {
        type = DataTypes.DATE;
        //console.log("fieldObj_date_time",column.column_name);
      } else if (column.data_type == "ARRAY") {
        type = DataTypes.ARRAY(DataTypes.STRING);
      }

      if (column.is_nullable == "YES") {
        allowNull = true;
      } else {
        if(column.column_name == "sourceid"){
          allowNull = true;
        }else{
          notEmpty = true;
        }
      }
      if (column.column_name != "id") {
        fieldObj[column.column_name] = {
          type: type,
          allowNull: allowNull,
        };
        // if(allowNull){
        //   fieldObj[column.column_name].validate = { allowNull: allowNull}
        //   console.log("fieldObj[column.column_name]",column.column_name);
        // }
        if (notEmpty) {
          fieldObj[column.column_name].validate = {
            notNull: {
              args: true,
              msg: `${column.column_name} is required`, // Custom error message for notEmpty validation
            }
          };
          //console.log("fieldObj[column.column_name]", column.column_name);
        }
      }
      if (
        (column.constraint_type == "Unique Key" ||
          column.constraint_type == "Primary Key") &&
        column.column_name !== "id"
      ) {
        fieldObj[column.column_name].unique = {
          args: true,
          msg: `${column.column_name} already exist,Kindly try another one`,
        };
      }
    });

    return fieldObj;
  }

  static async apifetchdata(api) {
    const actualAPI = process.env.BASEURL + api;
    const response = await axios.get(actualAPI);

    return response;
  }

  static async apifetchdataWithHeaders(api, headers) {
    const actualAPI = process.env.BASEURL + api;
    const response = await axios.get(actualAPI, headers);

    return response;
  }

  static async getlengthntype(table, columns) {
    let sqlQuery = `
    SELECT COLUMN_NAME, DATA_TYPE, character_maximum_length,
    numeric_precision,
    numeric_scale
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = :table
    AND COLUMN_NAME IN (:columns);
  `;

    // console.log("sqlQuery",sqlQuery);
    const results = await sequelize.query(sqlQuery, {
      type: Sequelize.QueryTypes.SELECT,
      replacements: { table, columns },
    });

    let resultArray = [];
    if (results instanceof Object) {
      //console.log("results123",results)

      for (let i = 0; i < results.length; i++) {
        let columninfo = {};
        columninfo["db_type"] = results[i]?.data_type;
        columninfo["field_name"] = results[i]?.column_name;
        columninfo["length"] = results[i]?.character_maximum_length;
        columninfo["numeric_scale"] = results[i]?.numeric_scale;
        resultArray.push(columninfo);
      }
    }

    return resultArray;
  }

  static formatNumberWithLeadingZeros = (number, length) => {
    return number.toString().padStart(length, "0");
  };
  static formatedData = (format, year, month, date) => {
    console.log(format, year, month, date, "==========>");
    const regex = /\d+[YMD]/g;
    const matches = format?.match(regex);
    console.log(matches);
    let output = "";
    if (matches) {
      for (const item of matches) {
        console.log(item.match(/\d+|[A-Za-z]+/g));
        const splitItem = item.match(/\d+|[A-Za-z]+/g);
        if (splitItem[1] == "Y") {
          output =
            output +
            year.toString().slice(-splitItem[0]).padStart(splitItem[0], "0");
        }
        if (splitItem[1] == "M") {
          output =
            output +
            month.toString().slice(-splitItem[0]).padStart(splitItem[0], "0");
        }
        if (splitItem[1] == "D") {
          output =
            output +
            date.toString().slice(-splitItem[0]).padStart(splitItem[0], "0");
        }
      }
    }
    return output;
  };
  static monthToLetter = (month) => {
    if (month >= 1 && month <= 12) {
      const monthLetters = "ABCDEFGHIJKL";
      return monthLetters.charAt(month - 1);
    } else {
      return "Invalid Month";
    }
  };
  static getCurrentDay = () => {
    const currentDate = new Date();

    const CURMONTH = currentDate.getMonth() + 1; // Months are zero-based, so add 1
    const CURDAY = currentDate.getDate();
    const CURYEAR = currentDate.getFullYear();

    // Calculate the current week number
    const startOfYear = new Date(currentDate.getFullYear(), 0, 1);
    const currentWeek = Math.ceil(
      ((currentDate - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7
    );

    const duration = new Date().getSeconds();

    const CURWEEK = currentWeek;

    const result = {
      CURMONTH,
      CURDAY,
      CURYEAR,
      CURWEEK,
      DURATION: duration,
    };
    return result;
  };
  static generateSerialControl = async (req, res) => {
    let response = {
      status: false,
      message: "Unprocessable Entry",
      data: {},
      statusCode: 422,
    };
    try {
      const { table, type } = req.params;
      const WHSE = req.headers.whse;
      const COMPANY = req.headers.company;
      let INSTANCE = registerModel.getModel(table);
      let INS_TABLE = await INSTANCE.findOne({
        where: {
          SRLTYPE: type,
          COMPANY: COMPANY,
          WHSE: WHSE,
          INOWNER: req.headers.inowner,
        },
      });
      if (!INS_TABLE) {
        // response.message = `given ${type} is not available in this ${table} table.`;
        // response.statusCode = 400;
        // return this.sendResponse(res, response);
        INSTANCE = SRLCTL01;
        INS_TABLE = await INSTANCE.findOne({
          where: {
            SRLTYPE: type,
          },
        });
      }
      const getCurrentDayDetails = this.getCurrentDay();
      const generateId = `${INS_TABLE.PREFIX ? INS_TABLE.PREFIX : ""
        }${this.formatedData(
          INS_TABLE.GENTYPE,
          getCurrentDayDetails.CURYEAR,
          getCurrentDayDetails.CURMONTH,
          getCurrentDayDetails.CURDAY
        )}${INS_TABLE.DURATION ? getCurrentDayDetails.DURATION : ""}${INS_TABLE.CURWEEK ? getCurrentDayDetails.CURWEEK : ""
        }${INS_TABLE.INCCHAR
          ? this.monthToLetter(getCurrentDayDetails.CURMONTH)
          : ""
        }${INS_TABLE.RUNNUM && INS_TABLE.INCNUMLIMIT
          ? this.formatNumberWithLeadingZeros(
            INS_TABLE.RUNNUM,
            INS_TABLE.INCNUMLIMIT
          )
          : ""
        }`;
      response.statusCode = 200;
      response.status = true;
      response.message = "success";
      response.data = generateId;
      this.sendResponse(res, response);
    } catch (error) {
      console.log("Error \n", error);
      response.status = false;
      response.message = error.message || response.message;
      response.validation = error.cause || {};
      response.statusCode = error.statusCode || response.statusCode;
      this.sendResponse(res, response);
    }
  };
  static generateSerialControlWithUpdate = async (req, res) => {
    let response = {
      status: false,
      message: "Unprocessable Entry",
      data: {},
      statusCode: 422,
    };
    try {
      const { table,type } = req.params;
      
     
      let INSTANCE = registerModel.getModel(table);

      let INS_TABLE = await INSTANCE.findOne({
        where: {
          SRLTYPE: type,
         
        },
      });
      // INS_TABLE = INS_TABLE.dataValues;
      if (!INS_TABLE) {
        // response.message = `given ${type} is not available in this ${table} table.`;
        // response.statusCode = 400;
        // return this.sendResponse(res, response);
        INSTANCE = SRLCTL01;
        INS_TABLE = await INSTANCE.findOne({
          where: {
            SRLTYPE: type,
          },
        });
      }
      const getCurrentDayDetails = this.getCurrentDay();
      const generateId = `${INS_TABLE.PREFIX ? INS_TABLE.PREFIX : ""
        }${this.formatedData(
          INS_TABLE.GENTYPE,
          getCurrentDayDetails.CURYEAR,
          getCurrentDayDetails.CURMONTH,
          getCurrentDayDetails.CURDAY
        )}${INS_TABLE.DURATION ? getCurrentDayDetails.DURATION : ""}${INS_TABLE.CURWEEK ? getCurrentDayDetails.CURWEEK : ""
        }${INS_TABLE.INCCHAR
          ? this.monthToLetter(getCurrentDayDetails.CURMONTH)
          : ""
        }${INS_TABLE.RUNNUM && INS_TABLE.INCNUMLIMIT
          ? this.formatNumberWithLeadingZeros(
            INS_TABLE.RUNNUM,
            INS_TABLE.INCNUMLIMIT
          )
          : ""
        }`;
      INS_TABLE.RUNNUM = parseInt(INS_TABLE.RUNNUM) + 1;
      INS_TABLE.CURYEAR = INS_TABLE.CURYEAR
        ? getCurrentDayDetails.CURYEAR
        : INS_TABLE.CURYEAR;
      INS_TABLE.CURMONTH = INS_TABLE.CURMONTH
        ? getCurrentDayDetails.CURMONTH
        : INS_TABLE.CURMONTH;
      INS_TABLE.CURDAY = INS_TABLE.CURDAY
        ? getCurrentDayDetails.CURDAY
        : INS_TABLE.CURDAY;
      INS_TABLE.DURATION = INS_TABLE.DURATION
        ? getCurrentDayDetails.DURATION
        : INS_TABLE.DURATION;
      INS_TABLE.CURWEEK = INS_TABLE.CURWEEK
        ? getCurrentDayDetails.CURWEEK
        : INS_TABLE.CURWEEK;
      INS_TABLE.INCCHAR = INS_TABLE.INCCHAR
        ? this.monthToLetter(getCurrentDayDetails.CURMONTH)
        : INS_TABLE.INCCHAR;
      INS_TABLE.SERIALNUM = generateId;
      console.log(INS_TABLE);
      const UPD_TABLE = await INSTANCE.update(
        {
          RUNNUM: INS_TABLE.RUNNUM,
          CURYEAR: INS_TABLE.CURYEAR,
          CURMONTH: INS_TABLE.CURMONTH,
          CURDAY: INS_TABLE.CURDAY,
          DURATION: INS_TABLE.DURATION,
          CURWEEK: INS_TABLE.CURWEEK,
          INCCHAR: INS_TABLE.INCCHAR,
          SERIALNUM: INS_TABLE.SERIALNUM,
        },
        {
          where: {
            id: INS_TABLE.id,
          },
        }
      );
      response.statusCode = 200;
      response.status = true;
      response.message = "success";
      response.data = generateId;
      this.sendResponse(res, response);
    } catch (error) {
      console.log("Error \n", error);
      response.status = false;
      response.message = error.message || response.message;
      response.validation = error.cause || {};
      response.statusCode = error.statusCode || response.statusCode;
      this.sendResponse(res, response);
    }
  };

  static async  clearCache(req) {
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
   // console.log(cacheKey, cacheKeyPattern, "=============> cachekey, cache pattern");
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
  

  static genrateSerialId = async (table, type, COMPANY, WHSE, INOWNER) => {
    try {
      let INSTANCE = registerModel.getModel(table);
      let INS_TABLE = await INSTANCE.findOne({
        where: {
          SRLTYPE: type,
          COMPANY: COMPANY,
          WHSE: WHSE,
          INOWNER: INOWNER,
        },
      });
      if (!INS_TABLE) {
        // return {
        //   success: false,
        //   data: `given ${type} is not available in this ${table} table.`,
        // };
        INSTANCE = registerModel.getModel("SRLCTL01");
        INS_TABLE = await INSTANCE.findOne({
          where: {
            SRLTYPE: type,
          },
        });
      }
      const getCurrentDayDetails = this.getCurrentDay();
      const generateId = `${INS_TABLE.PREFIX ? INS_TABLE.PREFIX : ""
        }${this.formatedData(
          INS_TABLE.GENTYPE,
          getCurrentDayDetails.CURYEAR,
          getCurrentDayDetails.CURMONTH,
          getCurrentDayDetails.CURDAY
        )}${INS_TABLE.DURATION ? getCurrentDayDetails.DURATION : ""}${INS_TABLE.CURWEEK ? getCurrentDayDetails.CURWEEK : ""
        }${INS_TABLE.INCCHAR
          ? this.monthToLetter(getCurrentDayDetails.CURMONTH)
          : ""
        }${INS_TABLE.RUNNUM && INS_TABLE.INCNUMLIMIT
          ? this.formatNumberWithLeadingZeros(
            INS_TABLE.RUNNUM,
            INS_TABLE.INCNUMLIMIT
          )
          : ""
        }`;
      INS_TABLE.RUNNUM = parseInt(INS_TABLE.RUNNUM) + 1;
      INS_TABLE.CURYEAR = INS_TABLE.CURYEAR
        ? getCurrentDayDetails.CURYEAR
        : INS_TABLE.CURYEAR;
      INS_TABLE.CURMONTH = INS_TABLE.CURMONTH
        ? getCurrentDayDetails.CURMONTH
        : INS_TABLE.CURMONTH;
      INS_TABLE.CURDAY = INS_TABLE.CURDAY
        ? getCurrentDayDetails.CURDAY
        : INS_TABLE.CURDAY;
      INS_TABLE.DURATION = INS_TABLE.DURATION
        ? getCurrentDayDetails.DURATION
        : INS_TABLE.DURATION;
      INS_TABLE.CURWEEK = INS_TABLE.CURWEEK
        ? getCurrentDayDetails.CURWEEK
        : INS_TABLE.CURWEEK;
      INS_TABLE.INCCHAR = INS_TABLE.INCCHAR
        ? this.monthToLetter(getCurrentDayDetails.CURMONTH)
        : INS_TABLE.INCCHAR;
      INS_TABLE.SERIALNUM = generateId;
      console.log(INS_TABLE);
      const UPD_TABLE = await INSTANCE.update(
        {
          RUNNUM: INS_TABLE.RUNNUM,
          CURYEAR: INS_TABLE.CURYEAR,
          CURMONTH: INS_TABLE.CURMONTH,
          CURDAY: INS_TABLE.CURDAY,
          DURATION: INS_TABLE.DURATION,
          CURWEEK: INS_TABLE.CURWEEK,
          INCCHAR: INS_TABLE.INCCHAR,
          SERIALNUM: INS_TABLE.SERIALNUM,
        },
        {
          where: {
            id: INS_TABLE.id,
          },
        }
      );

      return { success: true, data: generateId };
    } catch (error) {
      console.log(error);
      throw error;
      return { success: false, data: error.message };
    }
  };
  static validateSKUCode = async (SKUCODE, COMPANY, WHSE, INOWNER) => {
    try {
      var SKUMST00 = registerModel.getModel('SKUMST00')
      const SKUCODECHECK = await SKUMST00.findOne({
        where: {
          COMPANY: COMPANY,
          //WHSE:WHSE,
          INOWNER: INOWNER,
          SKUCODE: SKUCODE,
          STATUS: 10100
        },
        attributes: ['SKUCODE'],
        raw: true
      })
      if (SKUCODECHECK) {
        return true
      }
      else {
        return false;
      }

    } catch (error) {
      console.log(error);

      return { success: false, data: error.message };
    }
  };
  static validateLanguage = async (fieldnme, langid) => {
    try {
      var FLDTXT00 = registerModel.getModel('FLDTXT00')
      const LanguageCHECK = await FLDTXT00.findOne({
        where: {
          //  COMPANY: COMPANY,
          //  //WHSE:WHSE,
          //  INOWNER:INOWNER,
          FIELDNO: fieldnme,
          LANGID: langid,
          STATUS: 10100
        },
        attributes: ['FIELDNO'],
        raw: true
      })
      if (LanguageCHECK) {
        return false
      }
      else {
        return true;
      }

    } catch (error) {
      console.log(error);

      return { success: false, data: error.message };
    }
  };
  static validateSKUCodePack = async (SKUCODE, PACK, COMPANY, WHSE, INOWNER) => {
    try {
      var PKCONF00 = registerModel.getModel('PKCONF00')
      const SKUCODECHECK = await PKCONF00.findOne({
        where: {
          COMPANY: COMPANY,

          INOWNER: INOWNER,
          SKUCODE: SKUCODE,
          STATUS: 10100,
          PACKID: PACK
        },
        attributes: ['SKUCODE'],
        raw: true
      })
      if (SKUCODECHECK) {
        return true
      }
      else {
        return false;
      }

    } catch (error) {
      console.log(error);

      return { success: false, data: error.message };
    }
  };
  static validateSKUCodeLoc = async (SKUCODE, LOC, COMPANY, WHSE, INOWNER) => {
    try {
      var PFLOCSKUCONF00 = registerModel.getModel('PFLOCSKUCONF00')
      const SKUCODECHECK = await PFLOCSKUCONF00.findOne({
        where: {
          COMPANY: COMPANY,
          INOWNER: INOWNER,
          SKUCODE: SKUCODE,
          STATUS: 10100,
          LOCID: LOC,
          WHSE: WHSE
        },
        attributes: ['SKUCODE'],
        raw: true
      })
      if (SKUCODECHECK) {
        return false
      }
      else {
        return true;
      }

    } catch (error) {
      console.log(error);

      return { success: false, data: error.message };
    }
  };
  static validateSKUCodeUnique = async (SKUCODE, COMPANY, WHSE, INOWNER) => {
    try {
      console.log("check");
      var PFLOCSKUCONF00 = registerModel.getModel('PFLOCSKUCONF00')
      const SKUCODECHECK = await PFLOCSKUCONF00.findOne({
        where: {
          COMPANY: COMPANY,
          INOWNER: INOWNER,
          SKUCODE: SKUCODE,
          STATUS: 10100,
          WHSE: WHSE

        },
        attributes: ['SKUCODE'],
        raw: true
      })
      if (SKUCODECHECK) {
        return false
      }
      else {
        return trye;
      }

    } catch (error) {
      console.log(error);

      return { success: false, data: error.message };
    }
  };
  static validateSKUCodePackLDUNIT = async (SKUCODE, PACK, LDUNIT, COMPANY, WHSE, INOWNER) => {
    try {
      var LUCONF00 = registerModel.getModel('LUCONF00')
      const SKUCODECHECK = await LUCONF00.findOne({
        where: {
          COMPANY: COMPANY,
          LDUNIT: LDUNIT,
          INOWNER: INOWNER,
          SKUCODE: SKUCODE,
          STATUS: 10100,
          PACKID: PACK
        },
        attributes: ['SKUCODE'],
        raw: true
      })
      if (SKUCODECHECK) {
        return true
      }
      else {
        return false;
      }

    } catch (error) {
      console.log(error);

      return { success: false, data: error.message };
    }
  };
  static validateVendor = async (SKUCODE, COMPANY, WHSE, INOWNER) => {
    try {
      var VNDMST00 = registerModel.getModel('VNDMST00')
      const VENDORCHECK = await VNDMST00.findOne({
        where: {
          COMPANY: COMPANY,
          //WHSE:WHSE,
          INOWNER: INOWNER,
          VENDOR: SKUCODE,
          STATUS: 10100
        },
        attributes: ['SUPPLIER'],
        raw: true
      })
      if (VENDORCHECK) {
        return true
      }
      else {
        return false;
      }

    } catch (error) {
      console.log(error);

      return { success: false, data: error.message };
    }
  };

  static validateCarrier = async (SKUCODE, COMPANY, WHSE, INOWNER) => {
    try {
      var CARMST00 = registerModel.getModel('CARMST00')
      const CARRIERCHECK = await CARMST00.findOne({
        where: {
          COMPANY: COMPANY,
          //WHSE:WHSE,
          INOWNER: INOWNER,
          CARRIER: SKUCODE,
        },
        attributes: ['CARRIER'],
        raw: true
      })
      if (CARRIERCHECK) {
        return true
      }
      else {
        return false;
      }

    } catch (error) {
      console.log(error);

      return { success: false, data: error.message };
    }
  };

  static getROUTES = async (req, LOGINID) => {
    const MENUPROFILE = registerModel.getModel("MNUPRFL01");
    const USERMODEL = registerModel.getModel("USRMST00");
    const page = registerModel.getModel("Page");
    const FLDIDX00 = registerModel.getModel("FLDIDX00");
    return new Promise(async (resolve, reject) => {
      try {
        // get MenuProfiles from user master
        let Result = await USERMODEL.findOne({
          attributes: ["MENUPROFILE"],
          where: {
            LOGINID: LOGINID
          },
          raw: true
        })
        let Arr_of_id = []

        //filter active menuprofile ids 
        for (let Key in Result.MENUPROFILE) {
          if (Result.MENUPROFILE[Key] === 1) {
            Arr_of_id.push(Key.split('_')[0])
          }
        }

        resolve(Arr_of_id)
        let formatArray = []
        // get menuprofiles based on user
        // if (Arr_of_id.length > 0) {
        //   let MenuProfileAcess = await MENUPROFILE.findAll({
        //     where: {

        //       id: { [Op.in]: Arr_of_id }
        //     }, attributes: ["PRFLNAME", "MENUPROFILE"]
        //   })
        //   // filter module  ids
        //   await Promise.all(MenuProfileAcess.map(el => {

        //     el.MENUPROFILE.map(el2 => {

        //       el2.MNUPRFLSBCATEs.map(el3 => {

        //         el3.MNUPRFLMDLs.map(el4 => {

        //           if (el4.CHECKED == 1) {
        //             formatArray.push(el4.id)


        //           }
        //         })
        //       })
        //     })
        //   }))
        //   let unique_ids = formatArray?.filter((value, index, array) => array.indexOf(value) === index);
        //   page.hasMany(FLDIDX00, { foreignKey: "page_id" });

        //   let Routes = await page.findAll({
        //     attributes: ["id", "api"],
        //     include: [{
        //       model: FLDIDX00,
        //       attributes: ["page_id", "api"],
        //       where: {
        //         api: {
        //           [Op.not]: null, // Changed from Op.ne to Op.not
        //           // If you want to exclude empty strings as well, you can use [Op.not]: ''
        //         }
        //       }
        //     }],
        //     where: {
        //       module: { [Op.in]: unique_ids }
        //     },
        //     raw: true
        //   });


        //   let AllRoutes = []
        //   let UrlAndPageid = {}
        //   Routes.map(el => {
        //     for (let key in el.api) {
        //       if (el.api[key] !== null || el.api[key] !== '') {
        //         AllRoutes.push(el.api[key])
        //         UrlAndPageid[el.api[key]] = el.id
        //       }

        //     }
        //     if (el['FLDIDX00s.api'] !== '') {
        //       AllRoutes.push(el['FLDIDX00s.api'])
        //       UrlAndPageid[el['FLDIDX00s.api']] = el.id
        //     }
        //   })

        //   //console.log(UrlAndPageid)
        //   if (AllRoutes.length > 0) {
        //     resolve({ AllRoutes, UrlAndPageid });
        //   } else {

        //     reject({ message: "No ROUTES Availble for this Account" });
        //   }
        // }


      } catch (error) {
        console.log(error)
        reject(error);
      }
    });
  };

  static UpdateModuleInMNUPRFL01 = async (data) => {
    console.log('function trigger')

    try {
      const MENUPROFILE = registerModel.getModel("MNUPRFL01");

      let result = await MENUPROFILE.findAll({
        attributes: ["id", "MENUPROFILE"],

        raw: true
      })
      console.log(data, "comingdata")

      let UpdatedArray = [];


      result.map(el => {

        el.MENUPROFILE.map(el2 => {
          let SubCategory = []
          let Current_length = 0
          el2.MNUPRFLSBCATEs.map(el3 => {
            if (data.MAINCATEGORYID === el2.id) {
              Current_length += 1;
              SubCategory.push(el3);
              if (el2.MNUPRFLSBCATEs.length === Current_length) {

                SubCategory.push({ ...data, "MNUPRFLMDLs": [] });
                console.log({ ...data, "MNUPRFLMDLs": [] })
              }
            } else {
              SubCategory.push(el3);
            }
            let mudule = []
            let muduleCurrent_length = 0
            if (el3.MNUPRFLMDLs.length === 0 || el3.MNUPRFLMDLs.length === null) {

              mudule.push(data);
            }
            el3.MNUPRFLMDLs.map(el4 => {
              // console.log(el3,'subid')

              if (data.SUBCATEGORYID === el3.id) {
                muduleCurrent_length += 1;
                mudule.push(el4);
                console.log("Coming in outside condition=====")
                if (el3.MNUPRFLMDLs.length === muduleCurrent_length || el3.MNUPRFLMDLs.length === 0) {
                  console.log("Coming in model condition=====")
                  mudule.push(data);
                }
              } else {


                mudule.push(el4);
              }



            })
            el3.MNUPRFLMDLs = mudule
          }

          )
          el2.MNUPRFLSBCATEs = SubCategory
        })
        UpdatedArray.push(el);

      })
      console.log(UpdatedArray)
      console.table(UpdatedArray)
      UpdatedArray.map(async el => {

        let [Aff, result] = await MENUPROFILE.update({ MENUPROFILE: el.MENUPROFILE }, { where: { id: 9 }, returing: true, atrributes: ['MENUPROFILE'] })
        console.log(result, Aff)

      })
      return UpdatedArray
    } catch (error) {
      console.log("Error \n", error);

    }
  };

  static CreateDynamicModel = async (tableName,database) => {
    let sequelize1 =sequelize
    database?sequelize1 = new Sequelize(`${database}`,{
      timezone:process.env.timezone||'+05:30',}):sequelize
     
    return new Promise(async (resolve, reject) => {
      try {
        let fieldObj = await getSchemaDetails(tableName,database)


        const schema = [fieldObj, {
          tableName: tableName,
          freezeTableName: true,
          timestamps: false,
          indexes: [
            {
              name: "PRIMARY",
              unique: true,
              using: "BTREE",
              fields: [
                { name: "id" },
              ]
            },
          ]
        }];
        let model = sequelize1.define(tableName, ...schema)
        resolve(model);
      }
      catch (error) {
        reject(error);
      }
    });
  };
  static monthToLetter = (month) => {
    if (month >= 1 && month <= 12) {
      const monthLetters = "ABCDEFGHIJKL";
      return monthLetters.charAt(month - 1);
    } else {
      return "Invalid Month";
    }
  };
  static formatedData = (format, year, month, date) => {
    console.log(format, year, month, date, "==========>");
    const regex = /\d+[YMD]/g;
    const matches = format?.match(regex);
    console.log(matches);
    let output = "";
    if (matches) {
      for (const item of matches) {
        console.log(item.match(/\d+|[A-Za-z]+/g));
        const splitItem = item.match(/\d+|[A-Za-z]+/g);
        if (splitItem[1] == "Y") {
          output =
            output +
            year.toString().slice(-splitItem[0]).padStart(splitItem[0], "0");
        }
        if (splitItem[1] == "M") {
          output =
            output +
            month.toString().slice(-splitItem[0]).padStart(splitItem[0], "0");
        }
        if (splitItem[1] == "D") {
          output =
            output +
            date.toString().slice(-splitItem[0]).padStart(splitItem[0], "0");
        }
      }
    }
    return output;
  };
  static formatNumberWithLeadingZeros = (number, length) => {
    return number.toString().padStart(length, "0");
  };
  static generateSerialControl = async (req, res) => {
    let response = {
      status: false,
      message: "Unprocessable Entry",
      data: {},
      statusCode: 422,
    };
    try {
      const { table, type } = req.params;
      const WHSE = req.headers.whse;
      const COMPANY = req.headers.company;
      let INSTANCE = registerModel.getModel(table);
      let INS_TABLE = await INSTANCE.findOne({
        where: {
          SRLTYPE: type,
         // COMPANY: COMPANY,
          //WHSE: WHSE,
          //INOWNER: req.headers.inowner,
        },
      });
      if (!INS_TABLE) {
        // response.message = `given ${type} is not available in this ${table} table.`;
        // response.statusCode = 400;
        // return this.sendResponse(res, response);
        INSTANCE = SRLCTL01;
        INS_TABLE = await INSTANCE.findOne({
          where: {
            SRLTYPE: type,
          },
        });
      }
      const getCurrentDayDetails = this.getCurrentDay();
      const generateId = `${INS_TABLE.PREFIX ? INS_TABLE.PREFIX : ""
        }${this.formatedData(
          INS_TABLE.GENTYPE,
          getCurrentDayDetails.CURYEAR,
          getCurrentDayDetails.CURMONTH,
          getCurrentDayDetails.CURDAY
        )}${INS_TABLE.DURATION ? getCurrentDayDetails.DURATION : ""}${INS_TABLE.CURWEEK ? getCurrentDayDetails.CURWEEK : ""
        }${INS_TABLE.INCCHAR
          ? this.monthToLetter(getCurrentDayDetails.CURMONTH)
          : ""
        }${INS_TABLE.RUNNUM && INS_TABLE.INCNUMLIMIT
          ? this.formatNumberWithLeadingZeros(
            INS_TABLE.RUNNUM,
            INS_TABLE.INCNUMLIMIT
          )
          : ""
        }`;
      response.statusCode = 200;
      response.status = true;
      response.message = "success";
      response.data = generateId;
      this.sendResponse(res, response);
    } catch (error) {
      console.log("Error \n", error);
      response.status = false;
      response.message = error.message || response.message;
      response.validation = error.cause || {};
      response.statusCode = error.statusCode || response.statusCode;
      this.sendResponse(res, response);
    }
  };
  static getControlBoardSettings = async (COMPANY, WHSE, INOWNER, SETID) => {
    try {
      console.log(
        COMPANY,
        WHSE,
        INOWNER,
        SETID,
        "===============> checkCTLBRDSettings"
      );
      const CTLBRD00 = registerModel.getModel("CTLBRD00");
      const CTLBRD01 = registerModel.getModel("CTLBRD01");
      const INS_CTLBRD01 = await CTLBRD01.findOne({
        where: {
          COMPANY: COMPANY,
          WHSE: WHSE,
          INOWNER: INOWNER,
          SETID: SETID,
        },
      });
      if (!INS_CTLBRD01) {
        const INS_CTLBRD00 = await CTLBRD00.findOne({
          where: {
            SETID: SETID,
          },
        });
        return INS_CTLBRD00?.SETTVAL;
      }
      return INS_CTLBRD01.SETTVAL;
    } catch (error) {
      throw error;
    }
  };
  static validateString = async (pattern, input) => {
    const parts = pattern.split(';');

    for (const part of parts) {
      const [indexStr, expectedChar] = part.split('');
      const index = parseInt(indexStr) - 1;

      if (input[index] !== expectedChar) {
        return false;
      }
    }

    return true;
  }
  
}
export { HelperFunctionController };

async function StoreHistory(previousData, updatedData, pageid, LOGINID) {
  const HISTORY00 = registerModel.getModel("HISTORY00");
  const HISTORY01 = registerModel.getModel("HISTORY01");
  try {
    const diffObject = {};

    // Iterate through the properties of the "updated" object
    for (const key in updatedData[0].dataValues) {
      if (updatedData[0].dataValues[key] !== previousData[0].dataValues[key]) {
        diffObject[key] = updatedData[0].dataValues[key];
      }
    }
    if (diffObject.hasOwnProperty("DTCR")) {
      delete diffObject.DTCR;
    }
    if (diffObject.hasOwnProperty("DTLM")) {
      delete diffObject.DTLM;
    }

    if (Object.keys(diffObject).length > 0) {
      let previous = {};
      let current = {};
      for (const key in diffObject) {
        previous[key] = previousData[0].dataValues[key];
        current[key] = diffObject[key];
      }

      let data = {
        row_id: updatedData[0].dataValues.id,
        LOGINID: LOGINID,
        page_id: pageid,
      };
      let result = await HISTORY00.create(data);
      if (result) {
        let history01Data = [];
        for (const key in current) {
          let data = {};

          if (key !== "UPDCNT" && key !== "LMUSERID" && key !== "DTLM") {
            data.his_id = result.id;
            data.prev_value = previous[key];
            data.curr_value = current[key];
            data.field_name = key;
            history01Data.push(data);
          }
        }
        await HISTORY01.bulkCreate(history01Data)


      }
    }

  } catch (error) {
    console.log(error);
  }
}

function getotp() {
  return Math.floor(1000 + Math.random() * 9000);
}

function getPagination(page, size) {
  const limit = size ? +size : 50;
  let offset = 0;
  page = page - 1;
  if (page >= 1) {
    offset = page * limit;
  }
  console.log(limit, offset);
  return { limit, offset };
}

function getPagingData(data, page, limit) {
  //console.log("initdata",data);
  const { count: totalItems, rows: result } = data;
  const currentPage = page ? +page : 0;
  const totalPages = Math.ceil(totalItems / limit);
  return { totalItems, totalPages, currentPage, result };
}
const uploadFile = (req, res) => {
  let fileFolder = req.query.moduleName;

  return new Promise((resolve, reject,) => {
    const upload = multer({
      storage: multer.diskStorage({
        destination: (req, file, cb) => {
          cb(null, `app/public/${fileFolder}/`);
        },
        filename: (req, file, cb) => {
          cb(null, `${new Date()}+${file.originalname}`);
        },
      }),
    }).single("File");

    upload(req, res, async (err) => {
      try {
        if (err) {
          console.error("Error during file upload:", err);
          reject(err);
        } else {
          resolve(req.file);
        }
      } catch (error) {
        reject(error);
      }
    });
  });
};

// Function to convert JSON to Excel and return buffer
function jsonToExcelBuffer(jsonData) {
  // Create a new workbook
  const workbook = XLSX.utils.book_new();

  // Convert JSON to worksheet
  const worksheet = XLSX.utils.json_to_sheet(jsonData);

  // Add worksheet to the workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

  // Write the workbook to a buffer
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

  return buffer;
}

// // Set up storage for uploaded files
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     // cb(null, `app/public/${req.query.moduleName||"SKUMASTER"}/`); // Specify the directory where files will be stored
//     const moduleName = req.query.moduleName || "SKUMASTER";
//     const destinationPath = `app/public/${moduleName}/`;

//     // Create the destination directory if it doesn't exist
//     if (!fs.existsSync(destinationPath)) {
//       fs.mkdirSync(destinationPath, { recursive: true });
//     }

//     cb(null, destinationPath);
//   },
//   filename: function (req, file, cb) {
//     // cb(null, file.originalname); // Keep the original file name
//     cb(null, `${Math.floor(new Date().getTime() / 1000)}_${file.originalname}`);
//   },
// });




let getStatus = () => {
  const SystemCode = registerModel.getModel("SYSCDFL00");
  return new Promise(async (resolve, reject) => {
    try {
      let query = ` SELECT "REMARK", "SYSCODEID" FROM "SYSCDFL00" AS "SYSCDFL00" WHERE "SYSCDFL00"."SYSCODEGROUP" LIKE '%STATUS%';`;

      const AllStatus = await sequelize.query(query, {
        type: Sequelize.QueryTypes.SELECT,
      });
      let CODES = {};
      AllStatus.map((el) => {
        CODES[el.SYSCODEID] = el.REMARK;
      });
      resolve(CODES);
    } catch (error) {
      reject(error);
    }
  });
};

// Upadte chache for Upload
let UpdateUploadCache = async (req,MENUID) => {
  const UploadConf00 = registerModel.getModel("UPLDCONF00");
  // return new Promise(async (resolve, reject) => {
    try {
  
      let uploadConf = await UploadConf00.findOne({ where: { MENUID: MENUID }, raw: true });
      
      const MAINTABLENAME = uploadConf.MAINTABLENAME;
      const UniqueID = uploadConf.UniqueID
      let UniqueIndexColumn = uploadConf.UniqueIndexColumn

      let redisPayload= {}
      let existingRecord;


      

   
      let comAndWhseAndInwn =  UniqueIndexColumn['0'].split(',')
       let redisObjectKeyArray = []
        let redis_table= ``

        if(comAndWhseAndInwn.includes('COMPANY')){
            redis_table+=`${req.headers.company}-` 
        }
        if(comAndWhseAndInwn.includes('WHSE')){
            
            redis_table+=`${req.headers.whse}-` 
        }
        if(comAndWhseAndInwn.includes('INOWNER')){
           
            redis_table+=`${req.headers.inowner}-${MAINTABLENAME}` 
        }else{
            redis_table+=`${MAINTABLENAME}`   
        }

      
        let AllUniqueColumnString = ''
     let whereCondition= ``
     let auth= req.headers
     if (comAndWhseAndInwn.includes('COMPANY')) {
        whereCondition += `"COMPANY" =  '${auth.company}' and`
    }
    if (comAndWhseAndInwn.includes('INOWNER')) {
        whereCondition += `"WHSE" =  '${auth.whse}' and`
    }
    if (comAndWhseAndInwn.includes('INOWNER')) {
        whereCondition += `"INOWNER" =  '${auth.inowner}'`
    }else {
        whereCondition= whereCondition.slice(0,-3)   
    }
   
    
        for (let el in UniqueIndexColumn) {
            let redisObjectKey = ``
            let allColumnArray = UniqueIndexColumn[el]?.split(',')
           
            for (let i = 0; i < allColumnArray.length; i++) {
       
        
                redisObjectKey += `${allColumnArray[i]}`
                AllUniqueColumnString += ` "${allColumnArray[i]}" ,`
               
                if (i < allColumnArray.length - 1) {
                   
                    redisObjectKey += '-'
                }
            }
            redisObjectKeyArray.push(redisObjectKey)
        }
        AllUniqueColumnString=    AllUniqueColumnString.slice(0,-1)
        console.log(redisObjectKeyArray,'redisObjectKeyArray')
      //  exit()
        let countQuery = ` SELECT count(*) AS "count" FROM "${MAINTABLENAME}" where  ${whereCondition}  `
        let Count = await sequelize.query(countQuery, { type: Sequelize.QueryTypes.SELECT });
        console.log(Count, 'Count')

        let redisExistingRecord = await client.get(`${redis_table}`)

        if (redisExistingRecord) {
            redisPayload = await asyncJSONParse(redisExistingRecord);
        }

        const redisPayloadLength = Object.keys(redisPayload).length/UniqueID.split(',').length;
        //        console.log(redisPayloadLength,"redisPayloadLength")
        // console.log(parseInt(Count[0].count),'parseInt(Count[0].count)');

       

        if (redisPayloadLength !== parseInt(Count[0].count) ||  parseInt(Count[0].count) === 0) {
            
            let query = `SELECT  ${AllUniqueColumnString} 
         FROM "${MAINTABLENAME}"  where  ${whereCondition}   `;
            existingRecord = await sequelize.query(query, { type: Sequelize.QueryTypes.SELECT });
            redisPayload = {}
            //console.log(query,'query')
            await Promise.all(existingRecord.map(async el => {
               // console.log(el)
                await Promise.all(redisObjectKeyArray.map(async column => {
                    const columnNames = column.split('-');
                    const redisKey = columnNames.map(name => el[name]).join('-');
                   // console.log(columnNames,"columnNames")
                  // console.log(redisKey,"redisKey")
                    redisPayload[redisKey] = el
                }));
              
            }));

            await client.set(`${redis_table}`, JSON.stringify(redisPayload));
        }


    } catch (error) {
      console.log(error);
    }
 // });
 };


 // json 
 function asyncJSONParse(jsonString) {
  return new Promise((resolve, reject) => {
      try {
          const parsedObject = JSON.parse(jsonString);
          resolve(parsedObject);
      } catch (error) {
          reject(error);
      }
  });
}
// const upload = multer({ storage: storage });
// Resolve the project root directory
const projectRoot = path.resolve(__dirname, '../../'); 

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const moduleName = req.query.moduleName || "SKUMASTER";
    console.log("Destination path:", `app/public/${moduleName}/`);
    const dir = path.resolve(projectRoot, `app/public/${moduleName}/`);
    console.log("Resolved path:", dir);
    if (!fs.existsSync(dir)) {
      console.log("Directory does not exist, creating...");
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const filename = `${Math.floor(new Date().getTime() / 1000)}_${file.originalname}`;
    console.log("Generated filename:", filename);
    cb(null, filename);
  },
});

const upload = multer({ storage: storage });


export default {
  getotp,
  getPagination,
  getPagingData,
  StoreHistory,
  uploadFile,
  upload,
  getStatus,
  jsonToExcelBuffer,
  UpdateUploadCache
};
