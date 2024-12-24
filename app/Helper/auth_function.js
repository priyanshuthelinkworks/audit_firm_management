import { Sequelize, DataTypes, Op } from "sequelize";
import sequelize from "#wms/Config/database";
import OTP from "#wms/Module/Auth/Model/Otp";
import axios from "axios";
import registerModel from "#wms/ModuleRegister/registerModel";
import multer from "multer";
import { error } from "console";
import fs from "fs";
import XLSX from 'xlsx'
let getSchemaDetails = (tableName) => {

  return new Promise(async (resolve, reject) => {
    try {
      const tableColumns = await sequelize.query(
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

  static getUserhaveModule = async (req, LOGINID) => {

    const USERMODEL = registerModel.getModel("USRMST00");
    const MENUPROFILE = registerModel.getModel("MNUPRFL01");
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
          if (Result.MENUPROFILE[Key] === 1 || Result.MENUPROFILE[Key] === 'Y') {
            Arr_of_id.push(parseInt(Key.split('_')[0]))
          }
        }

        let formatArray = []
        // get menuprofiles based on user
        if (Arr_of_id.length > 0) {
          let MenuProfileAcess = await MENUPROFILE.findAll({
            where: {

              id: { [Op.in]: Arr_of_id }
            }, attributes: ["PRFLNAME", "MENUPROFILE"]
          })
          // filter module  ids
          await Promise.all(MenuProfileAcess.map(el => {

            el.MENUPROFILE.map(el2 => {

              el2.MNUPRFLSBCATEs.map(el3 => {

                el3.MNUMST00s.map(el4 => {

                  if (el4.CHECKED == 1) {
                    formatArray.push(el4.id)


                  }
                })
              })
            })
          }))
          let unique_ids = formatArray?.filter((value, index, array) => array.indexOf(value) === index);



          resolve(unique_ids)

        }

      } catch (error) {
        console.log(error)
        reject(error);
      }
    });
  };

  static checkSubset = async (arr1, arr2) => {

    return new Promise(async (resolve, reject) => {
      try {


        const set1 = new Set(arr1);
        const set2 = new Set(arr2);
        for (let elem of set1) {
          if (!set2.has(elem)) {
            resolve(false);
          }

          resolve(true);
        }





      } catch (error) {
        console.log(error)
        reject(error);
      }
    });
  };

















}
export { HelperFunctionController };







export default {

};
