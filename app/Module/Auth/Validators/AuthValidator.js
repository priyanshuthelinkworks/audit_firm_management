class AuthValidator {
  constructor() {
  }

  static updateUser = async (data) => {
    let response = {
      status: false,
      message: "Validation Failed",
      data: {},
    };
    try {
      // Define your schema
      const schema = {
        email: 'string',
        phone: 'string',
        firstname: 'string',
      };

      // Check for required properties
      const requiredProperties = ['email', 'phone', 'firstname'];
      const missingProperties = requiredProperties.filter(prop => !(prop in data));
     console.log("missingProperties",missingProperties);
      if (missingProperties.length > 0) {
        throw { message: "Validation Failed", validate: missingProperties.map(prop => ({ keyword: "required", dataPath: "", message: `${prop} is required` })) };
      }

      // Check types of properties
      const typeErrors = [];
      for (const prop in schema) {
        if (data.hasOwnProperty(prop) && typeof data[prop] !== schema[prop]) {
          typeErrors.push({ keyword: "type", dataPath: `.${prop}`, message: `${prop} must be of type ${schema[prop]}` });
        }
      }

      if (typeErrors.length > 0) {
        throw { message: "Validation Failed", validate: typeErrors };
      }

      response = {
        status: true,
        message: "Validation Success",
        data: {},
      };
    } catch (Error) {
      console.log("error",Error);
      response = {
        status: false,
        message: Error.message || "Validation failed",
        data: {
          validate: Error.validate,
        },
      };
    }
    return response;
  };


  static login = async (data) => {
    let response = {
      status: false,
      message: "Validation Failed",
      data: {},
    };
    try {
      // Define your schema
      const schema = {
        EMAIL: 'string',
        
        PASSWORD: 'string',
      };

      // Check for required properties
      const requiredProperties = ['EMAIL', 'PASSWORD'];
      const missingProperties = requiredProperties.filter(prop => !(prop in data));

      if (missingProperties.length > 0) {
        throw { message: "Validation Failed", validate: missingProperties.map(prop => ({ keyword: "required", dataPath: "", message: `${prop} is required` })) };
      }

      // Check types of properties
      const typeErrors = [];
      for (const prop in schema) {
        if (data.hasOwnProperty(prop) && typeof data[prop] !== schema[prop]) {
          typeErrors.push({ keyword: "type", dataPath: `.${prop}`, message: `${prop} must be of type ${schema[prop]}` });
        }
      }

      if (typeErrors.length > 0) {
        throw { message: "Validation Failed", validate: typeErrors };
      }

      // If all checks pass, set validation success response
      response = {
        status: true,
        message: "Validation Success",
        data: {},
      };
    } catch (Error) {
      // If any validation error occurs, set validation failed response
      response = {
        status: false,
        message: Error.message || "Validation failed",
        data: {
          validate: Error.validate,
        },
      };
    }
    return response;
  };


  static forgetPassword = async (data) => {
    let response = {
      status: false,
      message: "Validation Failed",
      data: {},
    };
    try {
      // Define your schema
      const schema = {
        email: 'string',
        otp: 'string',
        newPassword: 'string',
        confirmPassword: 'string',
      };

      // Check for required properties
      const requiredProperties = ['email', 'otp', 'newPassword', 'confirmPassword'];
      const missingProperties = requiredProperties.filter(prop => !(prop in data));

      if (missingProperties.length > 0) {
        throw { message: "Validation Failed", validate: missingProperties.map(prop => ({ keyword: "required", dataPath: "", message: `${prop} is required` })) };
      }

      // Check types of properties
      const typeErrors = [];
      for (const prop in schema) {
        if (data.hasOwnProperty(prop) && typeof data[prop] !== schema[prop]) {
          typeErrors.push({ keyword: "type", dataPath: `.${prop}`, message: `${prop} must be of type ${schema[prop]}` });
        }
      }

      // Check for password matching
      if (data.newPassword !== data.confirmPassword) {
        typeErrors.push({ keyword: "passwordMismatch", dataPath: ".newPassword", message: "Passwords do not match" });
      }

      if (typeErrors.length > 0) {
        throw { message: "Validation Failed", validate: typeErrors };
      }

      // If all checks pass, set validation success response
      response = {
        status: true,
        message: "Validation Success",
        data: {},
      };
    } catch (Error) {
      // If any validation error occurs, set validation failed response
      response = {
        status: false,
        message: Error.message || "Validation failed",
        data: {
          validate: Error.validate,
        },
      };
    }
    return response;
  };


  static changePassword = async (data, id) => {
    let response = {
      status: false,
      message: "Validation Failed",
      data: {},
    };
    try {
     

      // Define your schema
      const schema = {
       
        newPassword: 'string',
        currentPassword: 'string',
      };

      // Check for required properties
      const requiredProperties = ['newPassword', 'currentPassword'];
      const missingProperties = requiredProperties.filter(prop => !(prop in data));

      if (missingProperties.length > 0) {
        throw { message: "Validation Failed", validate: missingProperties.map(prop => ({ keyword: "required", dataPath: "", message: `${prop} is required` })) };
      }

      // Check types of properties
      const typeErrors = [];
      for (const prop in schema) {
        if (data.hasOwnProperty(prop) && typeof data[prop] !== schema[prop]) {
          typeErrors.push({ keyword: "type", dataPath: `.${prop}`, message: `${prop} must be of type ${schema[prop]}` });
        }
      }

      if (typeErrors.length > 0) {
        throw { message: "Validation Failed", validate: typeErrors };
      }

      // If all checks pass, set validation success response
      response = {
        status: true,
        message: "Validation Success",
        data: {},
      };
    } catch (Error) {
      // If any validation error occurs, set validation failed response
      response = {
        status: false,
        message: Error.message || "Validation failed",
        data: {
          validate: Error.validate,
        },
      };
    }
    return response;
  };
}

export { AuthValidator };
