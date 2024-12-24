import Constants from "#wms/Config/Constants";
import Jwt from "jsonwebtoken";
import middleware from "#wms/ModuleRegister/registerMiddleware";
// const middleware = registerMiddleware().getInstance();



class AuthMiddleware {
  constructor() { }

  /**
   * Adds two numbers together.
   * @param {object} generateObject The first number.
   * @returns {object} Auth Data.
   */
  static generateAuth = async (generateObject) => {

    let authObject = {
      status: false,
      data: {},
      message: "",
    };

    try {
      const { authToken = "" } = generateObject;
      const cipherKey = Constants.auth.cipherKey;
      if (cipherKey != "") {
        const authInfo = await new Promise((resolve, reject) => {
          Jwt.verify(authToken, cipherKey, function (err, decoded) {

            if (err) {
              reject(err.message || "Failed to authenticate.");
            } else {
              resolve(decoded);
            }
          });
        });
        authObject = {
          status: true,
          data: {
            ...authInfo,
            role: authInfo.CATEGORY,


          },
          message: "Auth Verified",
        };
      }
    } catch (error) {
      console.log("ERROR", error);
      authObject = {
        status: true,
        data: {},
        message: error.message || "Authendication Error",
      };
    }
    // console.log("authObject", authObject);
    return authObject;
  };

  /**
   * Adds two numbers together.
   */

  static addAuth =
    (roles = []) =>
      async (req, res, next) => {
        try {

          const Authorization = req.headers["authorization"] || null;
          let authData = null;
          if (Authorization) {
            const generateObject = {
              authToken: Authorization,
            };
            const generateAuthFunc = await this.generateAuth(generateObject);
            if (!generateAuthFunc.status)
              throw new Error("Authentication token is invalid.");
            authData = generateAuthFunc.data;
            if (!roles.includes(authData.role))
              throw new Error("Authentication role not permit for this action.");
          }
          req.auth = authData;
          next();
        } catch (error) {
          return res.status(req, res, error);
        }
      };

  /**
   * Adds two numbers together.
   */
  static Authorization =
    (roles = []) =>
      async (req, res, next) => {
        try {
          const Authorization = req.headers["authorization"] || null;
          if (!Authorization) throw new Error("Authentication is required.");
          const generateObject = {
            authToken: Authorization,
          };

          const generateAuthFunc = await this.generateAuth(generateObject);
          if (!generateAuthFunc.status)
            throw new Error("Authentication token is invalid.");

          const authData = generateAuthFunc.data;
          console.log(roles, 'roles')
          console.log(authData)
          req.auth = authData
          if (!roles.includes(authData.role))
            throw new Error("Authentication role not permit for this action.");
          req.auth = authData
          next()
        } catch (error) {
          return res.status(401).json({
            success: false,
            message: error.message || "Authentication Failed",
          });
        }
      };
}


middleware.register('Authorization', {
  func: AuthMiddleware.Authorization
})