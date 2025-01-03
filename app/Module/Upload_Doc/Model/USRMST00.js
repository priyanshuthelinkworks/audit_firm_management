import { Sequelize, DataTypes } from 'sequelize';
import sequelize from "#wms/Config/database";
import { HelperFunctionController as helper } from "#wms/Helper/function";

const tableName = 'user_master';
const fieldObj = await helper.getFields(tableName);
const USRPWDHIST =[fieldObj,{
tableName: tableName,
freezeTableName:true,
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
]}];

export const schema =USRPWDHIST ;
export const name = tableName;
export default {
  name,
  model: sequelize.define(name, ...schema)
}

