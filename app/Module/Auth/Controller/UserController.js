import moment from "moment";
import registerModel from "#wms/ModuleRegister/registerModel";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import sequelize from "sequelize";
import { AuthValidator } from "../Validators/AuthValidator.js";
import Constants from "#wms/Config/Constants";
import { EmailController as Mail } from "#wms/Config/SendMail";
import { HelperFunctionController as helper } from "#wms/Helper/function";
import  otpGenerator  from 'otp-generator'
const USRMST00 = await helper.CreateDynamicModel("user_master")||registerModel.getModel("user_master");

import { Op, Sequelize } from "sequelize";





class UserController  {
  constructor() { }

  static addUser = async (req, res) => {
    let response = {
      status: false,
      message: "Unprocessable Entry",
      data: {},

      statusCode: 422,
    };
    try {
      let body = req.body;
     
     
      const adminExists = await USRMST00.findOne({
        where: {
         
            email: body.email ,
            
         
        },
      });

      if (adminExists) {
        throw new Error(" Email  already Exists.");
      }
//ADMIN DOCUMENT CREATION

req.body.password = await bcrypt.hash(body.password, 10);
req.body.STATUS =10100
req.body.CATEGORY = "ADMINUSER"
req.body.audit_firm=otpGenerator.generate(6, { upperCaseAlphabets: true, specialChars: true });
const data = await USRMST00.create(req.body);
     
      

      //SUCCESS RESPONCE
      response.data = data;
      response.status = true;
      response.message = "Account crated successfully";
      response.statusCode = 200;
    } catch (error) {
      //ERROR RESPONCE
      console.log("Error \n", error);
      response.status = false;
      response.message = error.message || response.message;
      response.validation = error.cause || {};
      response.statusCode = error.statusCode || response.statusCode;
    }
    return res
      .status(response.statusCode || 500)
      .json(response)
      .end();
  };

  static login = async (req, res) => {
    let response = {
      status: false,
      message: "Unprocessable Entry",
      data: {},

      statusCode: 422,
    };
    try {
      let body = req.body;
      let validation = await AuthValidator.login(body);
      if (!validation.status)
        throw new Error("Validation Failed", { cause: validation.data });

      //CHECK DATA
      let data = await USRMST00.findOne({
        where: {
          email: body.email,
          status: 10100,
        },
        //attributes: ["USERID", "PASSWORD"]
      });
      if (!data) {
        throw new Error("Credential Invalid");
      }

      //PASSWORD VALIDATION
      const isValid = await bcrypt.compare(body.password, data.password);
      if (isValid) {
        let tokenData= {
          client:data.client,
          EMAIL:data.EMAIL,
          id:data.id,
          USERFNAME:data.USERFNAME,
          CATEGORY:data.CATEGORY
        }
        const token = jwt.sign(tokenData, Constants.auth.cipherKey);
       

        //SUCCESS RESPONCE
       
        response.token = token;
        response.status = true;
        response.message = "Success";
        response.statusCode = 200;
      } else {
       throw new Error("Credential Invalid");
      }
      // response.data = data;
      // //response.token = token;
      // response.status = true;
      // response.message = "LOGIN_SUCCESS";
      // response.statusCode = 200;
    } catch (error) {
      //FAILURE RESPONCE
      console.log("Error \n", error);
      response.status = false;
      response.message = error.message || response.message;
      response.validation = error.cause || {};
      response.statusCode = error.statusCode || response.statusCode;
    }
    return res
      .status(response.statusCode || 500)
      .json(response)
      .end();
  };

  static VerifyOTP = async (req, res) => {
    let response = {
      status: false,
      message: "Unprocessable Entry",
      data: {},
      validation: {},
      statusCode: 422,
    };
    try {
      let result = await OTPDETL.findOne({
        where: { LOGINID: req.body.LOGINID },
      });
      if (!result) {
        throw new Error("Credential invalid");
      }
      var finalresult = [];

      if (result.otp == req.body.otp) {
        var userdata = await user.findOne({
          where: {
            LOGINID: result.LOGINID,
          },
          attributes: [
            "USERID",
            "COMPANY",
            "CATEGORY",
            "USERFNAME",
            "LOGINID",
            "FACILITYPROFILE",
            "LANGID",
          ],
        });

        const faciltydata = userdata.FACILITYPROFILE;
        //         if (userdata.CATEGORY == "DEVELOPER") {
        //           const Companies = await COMPANYMODEL.findAll({
        //             attributes: ["COMPANY", "COMPNAME"],
        //           });
        //        console.log("Companies",Companies);
        //           const Whse = await WHSEMODEL.findAll({
        //             attributes: ["WHSE", "WHSENAME"],
        //           });
        // console.log("Whse",Whse);
        //           const results = await INOCONF00Model.findAll({
        //             attributes: ["COMPANY", "WHSE", "SELECTED"],
        //           });
        // console.log("results",results);
        //           // Organize the data into the desired structure
        //           const groupedData = {};

        //           // results.forEach((item) => {
        //           //   const company = Companies.find(
        //           //     (c) => Number(c.COMPANY) === Number(item.COMPANY)
        //           //   );
        //           //   const warehouse = Whse.find((w) => w.WHSE === item.WHSE);

        //           //   if (company && company.COMPANY) {
        //           //     if (!groupedData[company.COMPANY]) {
        //           //       groupedData[company.COMPANY] = {
        //           //         COMPANY: company.COMPANY,
        //           //         COMPANYName: company.COMPNAME,
        //           //         WHSE: [],
        //           //       };
        //           //     }
        //           //     // You can do more with the WHSE array if needed
        //           //     if (warehouse) {
        //           //       groupedData[company.COMPANY].WHSE.push({
        //           //         WHSE: warehouse.WHSE,
        //           //         WHSENAME: warehouse.WHSENAME,
        //           //         inventories: item?.SELECTED ?? null,
        //           //       });
        //           //     }
        //           //   }
        //           // });
        //          // Array to hold promises for all queries
        // const queryPromises = [];

        // // Loop through items
        // results.forEach((item) => {
        //   const selected = item?.SELECTED;
        //   const INOWNERArray = selected.map(item => item.INOWNER);

        //   // Push the promise of each database query into the array
        //   queryPromises.push(
        //     INOMST00.findAll({
        //       attributes: ['INONAME', 'INOWNER'],
        //       where: {
        //         INOWNER: INOWNERArray,
        //         STATUS: 10100
        //       },
        //       raw: true
        //     })
        //   );
        // });

        // // Wait for all queries to complete
        // Promise.all(queryPromises)
        //   .then((results) => {
        //     // Process results and populate groupedData
        //     results.forEach((result, index) => {
        //       const item = results[index];

        //       const company = Companies.find(
        //         (c) => Number(c.COMPANY) === Number(item.COMPANY)
        //       );
        //       const warehouse = Whse.find((w) => w.WHSE === item.WHSE);

        //       if (company && company.COMPANY) {
        //         if (!groupedData[company.COMPANY]) {
        //           groupedData[company.COMPANY] = {
        //             COMPANY: company.COMPANY,
        //             COMPANYName: company.COMPNAME,
        //             WHSE: [],
        //           };
        //         }
        //         // You can do more with the WHSE array if needed
        //         if (warehouse) {
        //           groupedData[company.COMPANY].WHSE.push({
        //             WHSE: warehouse.WHSE,
        //             WHSENAME: warehouse.WHSENAME,
        //             inventories: result || null,
        //           });
        //         }
        //       }
        //     });

        //     // Now you can use groupedData after all queries are completed
        //     console.log("groupedData", groupedData);
        //   })
        //   .catch((error) => {
        //     console.error("Error occurred:", error);
        //   });


        //           // Convert the groupedData object to an array
        //           console.log("groupedData",groupedData);
        //           finalresult = Object.values(groupedData);


        //         } 
        if (userdata.CATEGORY == "DEVELOPER") {
          const Companies = await COMPANYMODEL.findAll({
            attributes: ["COMPANY", "COMPNAME"],
          });
          console.log("Companies", Companies);
          const Whse = await WHSEMODEL.findAll({
            attributes: ["WHSE", "WHSENAME"],
            where: {
              STATUS: 10100
            }
          });
          console.log("Whse", Whse);
          const results = await INOCONF00Model.findAll({
            attributes: ["COMPANY", "WHSE", "SELECTED"],
          });
          console.log("results", results);

          const groupedData = {};

          const queryPromises = [];

          // Loop through items
          results.forEach((item) => {
            const selected = item?.SELECTED;
            const INOWNERArray = selected.map(item => item.INOWNER);

            // Push the promise of each database query into the array
            queryPromises.push(
              INOMST00.findAll({
                attributes: ['INONAME', 'INOWNER'],
                where: {
                  INOWNER: INOWNERArray,
                  STATUS: 10100
                },
                raw: true
              })
                .then((resultselected) => {
                  const company = Companies.find(
                    (c) => Number(c.COMPANY) === Number(item.COMPANY)
                  );
                  const warehouse = Whse.find((w) => w.WHSE === item.WHSE);

                  if (company && company.COMPANY) {
                    if (!groupedData[company.COMPANY]) {
                      groupedData[company.COMPANY] = {
                        COMPANY: company.COMPANY,
                        COMPANYName: company.COMPNAME,
                        WHSE: [],
                      };
                    }
                    // You can do more with the WHSE array if needed
                    if (warehouse) {
                      groupedData[company.COMPANY].WHSE.push({
                        WHSE: warehouse.WHSE,
                        WHSENAME: warehouse.WHSENAME,
                        inventories: resultselected || null,
                      });
                    }
                  }
                })
            );
          });

          // Wait for all promises to complete
          await Promise.all(queryPromises);
          // console.log("queryArray",queryPromises)
          // // Now you can use groupedData after all queries are completed
          // console.log("groupedData", groupedData);
          finalresult = Object.values(groupedData);
        }


        else {
          const conditions = [];
          for (let key in faciltydata) {
            if (faciltydata[key] === 1 || faciltydata[key] === 'Y') {
              let id = key.split("_");
              conditions.push({ id: id[0], STATUS: 10100 });
            }
          }

          if (conditions.length === 0 && userdata.CATEGORY !== "DEVELOPER") {
            response.message = "User does not have facility access";
            return res
              .status((response.statusCode = 422))
              .json(response)
              .end();
          }
          const orCondition = {
            [Op.or]: conditions,
          };
          //  console.log("orc", orCondition, conditions);
          let userfacility = await Facility.findAll({
            where: orCondition,
            attributes: ["SELECTED"],
          });
          console.log(userfacility, "facility");
          if (userfacility.length == 0 && !userdata.CATEGORY === "DEVELOPER")
            throw new Error(" Facility profile is not available for this user");
          // Change Output Format

          var isCOMPANY = false;
          var isWHSE = false;
          var isINOWNER = false;
          var Companies = [];
          var warehouses = [];
          var InventoriesAccess = [];
          var INOWNEROWNERS = [];
          var Companiestoken = [];
          var warehousestoken = [];
          var Inventoriestoken = [];
          let Inventories;
          //console.log("us", userfacility);

          await Promise.all(
            userfacility.map((item) => {
              for (let i = 0; i < item.SELECTED.length; i++) {
                if (
                  item.SELECTED[i].hasOwnProperty("COMPANY") &
                  !item.SELECTED[i].hasOwnProperty("WHSE") &
                  !item.SELECTED[i].hasOwnProperty("INOWNER")
                ) {
                  isCOMPANY = true;

                  let data = {
                    COMPANY: item.SELECTED[i].COMPANY,
                  };
                  const exists = Companies.some(
                    (item) => JSON.stringify(item) === JSON.stringify(data)
                  );
                  if (!exists) {
                    Companies.push(data);
                  }
                } else if (
                  item.SELECTED[i].hasOwnProperty("COMPANY") &
                  item.SELECTED[i].hasOwnProperty("WHSE") &
                  !item.SELECTED[i].hasOwnProperty("INOWNER")
                ) {
                  isWHSE = true;
                  let data = {
                    WHSE: item.SELECTED[i].WHSE,
                    COMPANY: item.SELECTED[i].COMPANY,
                  };
                  //console.log("data", data);
                  const exists = warehouses.some(
                    (item) => JSON.stringify(item) === JSON.stringify(data)
                  );
                  console.log("exists", exists);
                  if (!exists) {
                    warehouses.push(data);
                  }
                } else if (
                  item.SELECTED[i].hasOwnProperty("COMPANY") &
                  item.SELECTED[i].hasOwnProperty("WHSE") &
                  item.SELECTED[i].hasOwnProperty("INOWNER")
                ) {
                  isINOWNER = true;

                  let data = {
                    WHSE: item.SELECTED[i].WHSE,
                  };

                  INOWNEROWNERS.push({
                    INOWNER: item.SELECTED[i].INOWNER,
                    WHSE: item.SELECTED[i].WHSE,
                  });
                  const exists = InventoriesAccess.some(
                    (item) => JSON.stringify(item) === JSON.stringify(data)
                  );
                  if (!exists) {
                    InventoriesAccess.push(data);
                  }
                }
              }
            })
          );
          // var finalresult;
          // console.log("warehousesous",warehouses,Companies);

          // console.log("bools",isCOMPANY,isWHSE,isINOWNER);
          const companyIds = Companies.map((company) =>
            Number(company.COMPANY)
          );
          const wareHouses = warehouses;
          console.log("wareHouses 269", wareHouses);
          if (isCOMPANY) {
            const getcompanies = await COMPANYMODEL.findAll({
              attributes: ["COMPANY", "COMPNAME"],
              where: {
                COMPANY: {
                  [Op.in]: companyIds,
                },
              },
            });
            // console.log("getcompanies",getcompanies);
            WHSEMODEL.hasOne(INOWNCONFIGMODEL, { foreignKey: "WHSE" });
            INOWNCONFIGMODEL.belongsTo(WHSEMODEL, { foreignKey: "WHSE" });
            let resultINOWNER = await WHSEMODEL.findAll({
              attributes: ["WHSENAME", "WHSE", "COMPANY"],
              include: [
                {
                  model: INOWNCONFIGMODEL,
                  attributes: ["SELECTED"],
                  where: { STATUS: 10100 },
                },
              ],
              where: { [Op.or]: Companies, STATUS: 10100 },
            });
            // console.log("resultINOWNER", resultINOWNER);
            finalresult = resultINOWNER.reduce((acc, item) => {
              const existingCOMPANY = acc.find((company) => {
                // console.log("company",company);
                const numericCOMPANY = Number(company.COMPANY);
                const numericItemCOMPANY = Number(item.COMPANY);

                return numericCOMPANY === numericItemCOMPANY;
              });
              //console.log("CH",existingCOMPANY);
              if (existingCOMPANY) {
                const existingWHSE = existingCOMPANY.WHSE.find(
                  (warehouse) => Number(warehouse.WHSE) === Number(item.WHSE)
                );

                if (existingWHSE) {
                  existingWHSE.inventories.push(
                    ...(item.INOCONF00?.SELECTED ?? [])
                  );
                } else {
                  existingCOMPANY.WHSE.push({
                    WHSE: item.WHSE,
                    WHSENAME: item.WHSENAME,
                    inventories: item.INOCONF00?.SELECTED ?? [],
                  });
                }
              } else {
                acc.push({
                  COMPANY: item.COMPANY,
                  COMPANYName: getcompanies[0].COMPNAME,
                  WHSE: [
                    {
                      WHSE: item.WHSE,
                      WHSENAME: item.WHSENAME,
                      inventories: item.INOCONF00?.SELECTED ?? [],
                    },
                  ],
                });
              }

              return acc;
            }, []);
            Companiestoken = finalresult.map((item) => item.COMPANY);
            //console.log('finalResultcomp', finalresult);
            warehousestoken = finalresult.flatMap((item) =>
              item.WHSE.map((warehouse) => warehouse.WHSE)
            );

            Inventoriestoken = finalresult.flatMap((item) =>
              item.WHSE.flatMap((warehouse) =>
                warehouse.inventories.map((inventory) => inventory.INOWNER)
              )
            );


          }
          if (isWHSE) {
            //console.log("came whse",wareHouses);
            INOWNCONFIGMODEL.belongsTo(WHSEMODEL, { foreignKey: "WHSE" });
            let resultINOWNER = await WHSEMODEL.findAll({
              attributes: ["WHSENAME", "WHSE", "COMPANY"],
              include: [
                {
                  model: INOWNCONFIGMODEL,
                  attributes: ["SELECTED"],
                  where: { STATUS: 10100 },
                },
              ],
              where: { [Op.or]: wareHouses, STATUS: 10100 },
            });
            //console.log("resultINOWNERs",resultINOWNER);
            const companies = resultINOWNER.map((x) => x.COMPANY);
            //console.log("companies",companies);
            const resultCompanies = await COMPANYMODEL.findAll({
              attributes: ["COMPANY", "COMPNAME"],
              where: {
                COMPANY: {
                  [Op.in]: companies,
                },
              },
            });
            //console.log("resultCompanies",resultCompanies);

            const warehouseresult = resultCompanies.map((company) => ({
              COMPANY: company.COMPANY,
              COMPANYName: company.COMPNAME,
              WHSEs: resultINOWNER
                .filter(
                  (item) => Number(item.COMPANY) === Number(company.COMPANY)
                )
                .map((item) => ({
                  WHSE: item.WHSE,
                  WHSENAME: item.WHSENAME,
                  inventories: item.INOCONF00?.SELECTED ?? [],
                })),
            }));

            Inventories = warehouseresult
              .map((item) => item.WHSE?.inventories).flatMap((inventories) =>
                inventories.map((item2) => item2.INOWNER)
              );

            const Companies = warehouseresult.map((item) => item.COMPANY);
            //console.log('finalResultcomp', finalresult);
            const WHSEstoken = warehouseresult.flatMap((item) =>
              item.WHSE.map((warehouse) => warehouse.WHSE)
            );
            // console.log("finalresultb4",finalresult);
            Companiestoken =
              Companiestoken.length > 0 ? [...Companies] : Companies;
            warehousestoken =
              warehousestoken.length > 0 ? [...WHSEstoken] : WHSEstoken;
            Inventoriestoken =
              Inventories.length > 0 ? [...Inventories] : Inventories;
            if (finalresult.length > 0) {
              // console.log("came if");
              finalresult = [...warehouseresult];
            } else {
              finalresult = warehouseresult;
            }
            // console.log("finalresultw",finalresult);
          }
          if (isINOWNER) {
            WHSEMODEL.hasOne(INOWNCONFIGMODEL, { foreignKey: "WHSE" });
            INOWNCONFIGMODEL.belongsTo(WHSEMODEL, { foreignKey: "WHSE" });
            let resultINOWNER = await WHSEMODEL.findAll({
              attributes: ["WHSENAME", "WHSE", "COMPANY"],

              include: [
                {
                  model: INOWNCONFIGMODEL,
                  attributes: ["SELECTED"],
                  where: { STATUS: 10100 },
                },
              ],
              where: { [Op.or]: InventoriesAccess, STATUS: 10100 },
            });
            const inventories = [];

            resultINOWNER.filter((item) => {
              INOWNEROWNERS.some((el) => {
                if (
                  item.WHSE == el.WHSE &&
                  item.INOCONF00?.SELECTED?.length > 0
                ) {
                  for (let i = 0; i < item.INOCONF00.SELECTED.length; i++) {
                    if (item.INOCONF00.SELECTED[i].INOWNER == el.INOWNER) {
                      inventories.push(item.INOCONF00?.SELECTED ?? []);
                    }
                  }
                }
              });
            });

            const companies = resultINOWNER.map((x) => x.COMPANY);
            console.log("companies 454", companies);
            const resultCompanies = await COMPANYMODEL.findAll({
              attributes: ["COMPANY", "COMPNAME"],
              where: {
                COMPANY: {
                  [Op.in]: companies,
                },
              },
            });

            const INOWNERResult = resultCompanies.map((company) => ({
              COMPANY: company.COMPANY,
              COMPANYName: company.COMPNAME,
              WHSEs: resultINOWNER
                .filter(
                  (item) => Number(item.COMPANY) === Number(company.COMPANY)
                )
                .map((item) => ({
                  WHSE: item.WHSE,
                  WHSENAME: item.WHSENAME,
                  inventories: item.INOCONF00?.SELECTED ?? [],
                })),
            }));

            if (finalresult.length > 0) {
              finalresult = [...INOWNERResult];
            } else {
              finalresult = INOWNERResult;
            }
            const Inventories = INOWNERResult.flatMap((item) =>
              item.WHSEs.flatMap((item2) =>
                item2.inventories.map((item3) => {
                  return parseInt(item3.INOWNER);
                })
              )
            );

            const Companies = INOWNERResult.map((item) => parseInt(item.COMPANY));
            //console.log('finalResultcomp', finalresult);
            const WHSEstoken = INOWNERResult.flatMap((item) =>
              item.WHSEs.map((warehouse) => parseInt(warehouse.WHSE))
            );
            // console.log("finalresultb4",finalresult);
            Companiestoken =
              Companiestoken.length > 0 ? [...Companies] : Companies;
            warehousestoken =
              warehousestoken.length > 0 ? [...WHSEstoken] : WHSEstoken;
            Inventoriestoken =
              Inventories.length > 0 ? [...Inventories] : Inventories;
          }
        }
      } else {
        response.token = {};
        response.status = true;
        response.message = "Otp wrong";
        response.statusCode = 422;
      }

      //Make Uniquelet
      Companiestoken = Companiestoken?.filter((value, index, array) => array.indexOf(value) === index);
      warehousestoken = warehousestoken?.filter((value, index, array) => array.indexOf(value) === index);
      Inventoriestoken = Inventoriestoken?.filter((value, index, array) => array.indexOf(value) === index);

      // console.log(
      //   "Companiestoken Unique",
      //   Companiestoken,
      //   warehousestoken,
      //   Inventoriestoken
      // );

      const tokenData = {
        USERID: userdata.USERID,
        LOGINID: userdata.LOGINID,
        USERFNAME: userdata.USERFNAME,
        CATEGORY: userdata.CATEGORY,
        COMPANY: userdata.COMPANY,
        warehousestoken,
        Companiestoken,
        Inventoriestoken,
      };

      // jwt token generation
      // console.log("fire",tokenData);
      const token = jwt.sign(tokenData, Constants.auth.cipherKey);
      response.token = token;
      const userid = userdata.USERID;
      const category = userdata.CATEGORY;
      const userfname = userdata.USERFNAME;
      const loginid = userdata.LOGINID;
      let isWHSE_COMPANY = {}



      for (const company of finalresult) {
        for (const whse of company.WHSE || company.WHSEs) {
          const key = `${company.COMPANY}-${whse.WHSE}`;
          if (!isWHSE_COMPANY.hasOwnProperty(key)) {
            isWHSE_COMPANY[key] = [];
          }

          await Promise.all(whse.inventories.map(async el => {
            const isObjectPresent = isWHSE_COMPANY[key].some(item =>
              item.INOWNER === el.INOWNER
            );

            if (!isObjectPresent) {
              const beepDuration = await this.getControlBoardSettings(
                company.COMPANY,
                whse.WHSE,
                el.INOWNER,
                "BEEPDURATION"
              );
              const beepFrequency = await this.getControlBoardSettings(
                company.COMPANY,
                whse.WHSE,
                el.INOWNER,
                "BEEPFREQUENCY"
              );

              el.settings = {
                beepDuration,
                beepFrequency,
              };

              isWHSE_COMPANY[key].push(el);
            }
          }));
        }
      }





      const finalResponse = finalresult.map(company => {
        const mergedWHSEs = {};

        [...(company.WHSE || []), ...(company.WHSEs || [])].forEach(whse => {
          const key = `${company.COMPANY}-${whse.WHSE}`;
          if (!mergedWHSEs[key]) {
            mergedWHSEs[key] = { ...whse, inventories: [] };
          }
          whse.inventories.map(el => {
            const isObjectPresent = isWHSE_COMPANY[key].some(item =>
              item.INOWNER === el.INOWNER
            );
            if (!isObjectPresent) {
              isWHSE_COMPANY[key].push(el)
            }
          })



          mergedWHSEs[key].inventories = isWHSE_COMPANY[key];
        });

        company.WHSE = Object.values(mergedWHSEs);
        delete company.WHSEs;

        return company;
      });


      response.data = {
        Companies: finalResponse,
        UserData: {
          userid,
          category,
          userfname,
          loginid,
          LANGID: userdata.LANGID,
        },
      };
      response.status = true;
      response.message = "Login successful";
      response.statusCode = 200;
    } catch (error) {
      //ERROR RESPONCE
      console.log("Error \n", error);
      response.status = false;
      response.message = error.message || response.message;
      response.validation = error.cause || {};
      response.statusCode = error.statusCode || response.statusCode;
    }
    return res
      .status(response.statusCode || 500)
      .json(response)
      .end();
  };

  



  

  static updateUser = async (req, res) => {
    let response = {
      status: false,
      message: "Unprocessable Entry",
      data: {},
      statusCode: 422,
    };
    try {
      let body = req.body;
      if (body.includes("PASSWARD")) {
        delete body.PASSWARD;
      }
      let UpdateUser = await USERMODEL.update(body, { where: id.req.body.id });
      // Updated admin data is returned
      response.data = UpdateUser[0];
      response.status = true;
      response.message = "USER DATA UPDATED";
      response.statusCode = 200;
    } catch (error) {
      //ERROR RESPONCE
      console.log("Error \n", error);
      response.status = false;
      response.message = error.message || response.message;
      response.statusCode = error.statusCode || response.statusCode;
    }
    return res
      .status(response.statusCode || 500)
      .json(response)
      .end();
  };

  
  static resetPassword = async (req, res) => {
    let response = {
      status: false,
      message: "Unprocessable Entry",
      data: {},
      statusCode: 422,
    };
    try {
      // Generate a new password hash and salt
      const saltRounds = 10; // You can adjust the number of salt rounds for security
      const newPassword = "your_new_password"; // Set your new password here
      const salt = await bcrypt.genSalt(saltRounds);
      const hash = await bcrypt.hash(newPassword, salt);

      // Update the admin's password
      const adminData = await admin.update(
        { hash: hash, salt: salt },
        {
          where: {
            id: req.body.adminId, // Assuming you have the admin ID in the request body
          },
          returning: true,
        }
      );

      if (!adminData[0]) {
        throw new Error("FAILED TO UPDATE");
      }

      response.data = adminData[1][0]; // The updated data is in the second element of the array
      response.status = true;
      response.message = "DETAILS_UPDATED";
      response.statusCode = 200;
    } catch (error) {
      console.log("Error \n", error);
      response.status = false;
      response.message = error.message || response.message;
      response.statusCode = error.statusCode || response.statusCode;
    }
    return res
      .status(response.statusCode || 500)
      .json(response)
      .end();
  };

  static changePassword = async (req, res) => {
    let response = {
      status: false,
      message: "Unprocessable Entry",
      data: {},
      validation: {},
      statusCode: 422,
    };
    try {
      let { newPassword, currentPassword } = req.body;
      let LOGINID = req.auth.LOGINID;

      let UserData = await USERMODEL.findOne({
        where: {
          LOGINID: LOGINID,
        },
      });
      if (!UserData) throw new Error(`User Not Found`);

      // Check if the current password is correct

      const checkCurrentPassword = await bcrypt.compare(
        currentPassword,
        UserData.PASSWORD
      );

      if (!checkCurrentPassword) {
        throw new Error("Incorrect current password");
      }
      // Check if the new password is different
      const checkNewPassword = await bcrypt.compare(
        newPassword,
        UserData.PASSWORD
      );

      if (checkNewPassword) {
        throw new Error("No change in new password");
      }

      const newHash = await bcrypt.hash(newPassword, 10); // Use your desired salt rounds

      // Update the admin's password
      const updatedAdmin = await USERMODEL.update(
        {
          PASSWORD: newHash,
        },
        {
          where: {
            LOGINID: LOGINID,
          },
        }
      );

      if (!updatedAdmin[0] > 0) {
        throw new Error("Password not changed");
      }

      response.status = true;
      response.message = "Password Updated";
      response.statusCode = 200;
    } catch (error) {
      console.log("Error \n", error);
      response.status = false;
      response.message = error.message || response.message;
      response.validation = error.cause || {};
      response.statusCode = error.statusCode || response.statusCode;
    }
    return res
      .status(response.statusCode || 500)
      .json(response)
      .end();
  };

  static ForgotPassword = async (req, res) => {
    let response = {
      status: false,
      message: "Unprocessable Entry",
      data: {},
      statusCode: 422,
    };
    try {
      let { EMAIL } = req.body;
      let userData = await USERMODEL.findOne({ where: { EMAIL: EMAIL } });
      if (!userData) throw new Error("EMAIL NOT FOUND");
      const result = await helper.getOtp(userData.LOGINID);
      let { otp, isValidOtp } = result;

      //success responce of mailGateway
      let otpMail = await Mail.sendMail(userData.EMAIL, otp);
      if (!otpMail) throw new Error("OTP Mail Failed");
      const currentTime = new Date();
      if (!isValidOtp) {
        const reqdata = {
          otp: otp,
          updatedAt: currentTime,
        };
        await OTPDETL.update(reqdata, { where: { LOGINID: userData.LOGINID } });
      }

      //SUCCESS RESPONCE
      response.data = { LOGINID: userData.LOGINID };
      response.status = true;
      response.message =
        "The verification code sent to your email . Please enter this code to complete the forgot password process.";
      response.statusCode = 200;
    } catch (error) {
      //ERROR RESPONCE
      console.log("Error \n", error);
      response.status = false;
      response.message = error.message || response.message;
      response.statusCode = error.statusCode || response.statusCode;
    }
    return res
      .status(response.statusCode || 500)
      .json(response)
      .end();
  };

  static VerifyOtpForgotPassword = async (req, res) => {
    let response = {
      status: false,
      message: "Unprocessable Entry",
      data: {},
      statusCode: 422,
    };
    try {
      if (req.body.token && req.body.newPassword) {
        const authInfo = await new Promise((resolve, reject) => {
          jwt.verify(
            req.body.token,
            Constants.auth.cipherKey,
            function (err, decoded) {
              if (err) {
                reject(err.message || "Failed to authenticate.");
              } else {
                resolve(decoded);
              }
            }
          );
        });
        const getUser = await USERMODEL.findOne(
          { where: { LOGINID: authInfo.LOGINID } }
        );
        /* validate password length */
        const config = {
          headers: {
            authorization: `${req.headers.authorization}`,
            company: `${req.headers.company}`,
            whse: `${req.headers.whse}`,
            inowner: `${req.headers.inowner}`
          }
        };
        let getPasswordSettings = await this.getControlBoardSettings(
          getUser.COMPANY,
          getUser.WHSE,
          getUser.INOWNER,
          "PWDLENGTH"
        );
        console.log(getPasswordSettings, "===============>");
        if (getPasswordSettings) {
          let passwordLength = getPasswordSettings ? getPasswordSettings.VAL1 : 8;
          if (req.body.newPassword.length !== parseInt(passwordLength)) {
            throw new Error(`Required password length ${passwordLength}`)
          }
        }
        /* ************************ */

        const newHash = await bcrypt.hash(req.body.newPassword, 10); // Use your desired salt rounds

        /* validate password history count */
        let getPasswordHistorySettings = await this.getControlBoardSettings(
          getUser.COMPANY,
          getUser.WHSE,
          getUser.INOWNER,
          "PWDHISTCOUNT"
        );
        console.log(getPasswordHistorySettings, "===============> ");
        let passwordHistoryLength = getPasswordHistorySettings ? parseInt(getPasswordHistorySettings.VAL1) : 3;
        let getPasswordHistory = await USRPWDHIST.findAll({
          where: {
            USER_ID: getUser.id
          },
          attributes: ['PWDHIS'],
          limit: passwordHistoryLength,
          offset: 0,
          order: [
            ['id', 'DESC']
          ]
        });
        getPasswordHistory = getPasswordHistory.map(e => e.PWDHIS);
        console.log(getPasswordHistory, newHash);
        for (const item of getPasswordHistory) {
          console.log(item, newHash, "===============>");
          let validate = await bcrypt.compare(req.body.newPassword, item);
          console.log(validate);
          if (validate) {
            throw new Error(`Given password already you used. don't use last ${passwordHistoryLength} passwords.`)
          }
        }
        console.log("Validation passed");
        /* ******************************* */

        const updatedAdmin = await USERMODEL.update(
          { PASSWORD: newHash },
          { where: { LOGINID: authInfo.LOGINID } }
        );
        let createHistory = await USRPWDHIST.create({
          USER_ID: getUser.id,
          PWDHIS: newHash
        });
        if (updatedAdmin[0] > 0) {
          //SUCCESS RESPONCE
          response.status = true;
          response.data = {};
          response.message = "Password Updated";
          response.statusCode = 200;
          return res.json(response);
        }
      } else {
        let { LOGINID, OTP } = req.body;
        if (!LOGINID || !OTP) {
          response.message = "Please Send LoginID and OTP ";
          return res.status(response.statusCode || 500).json(response);
        }
        let result = await OTPDETL.findOne({
          where: { LOGINID: LOGINID, otp: OTP },
        });
        if (result) {
          const updatedAt = new Date(result.updatedAt);
          const currentTime = new Date();
          const timeDifference = currentTime - updatedAt;
          const timeDifferenceInMinutes = timeDifference / (1000 * 60);
          if (timeDifferenceInMinutes < 10) {
            // Check if the new password is different

            let TokenPayload = {
              LOGINID: LOGINID,
            };
            let Token = jwt.sign(TokenPayload, Constants.auth.cipherKey);

            response.status = true;
            response.data = { token: Token };
            response.message = "User Verified";
            response.statusCode = 200;
          } else {
            throw new Error("Invalid OTP");
          }
        } else {
          throw new Error("Wrong OTP");
        }
      }
    } catch (error) {
      //ERROR RESPONCE
      console.log("Error \n", error);
      response.status = false;
      response.message = error.message || response.message;
      response.statusCode = error.statusCode || response.statusCode;
    }
    return res
      .status(response.statusCode || 500)
      .json(response)
      .end();
  };

 

  
}

export default UserController;
