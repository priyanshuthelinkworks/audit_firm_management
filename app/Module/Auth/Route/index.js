import { Enum } from "#wms/Helper/utils";

const routes = {
  UserController: [
    {
      name: "Login", //unique name
      method: "post",
      route: "/login",
      action: "login",
     },


      {
        name: "User", //unique name
        method: "post",
        route: "/user",
        action: "addUser",
        // middleware: [{
        //   name:"Authorization",
        //   params:[[Enum.ROLES.DEVELOPER]],
        // }],
      },
    ,
    {
      name: "ForgotPassword", //unique name
      method: "post",
      route: "/forgot-password",
      action: "ForgotPassword",
    //   middlewares: [{
    //   name:"Authorization",
    //   params:[[Enum.ROLES.ADMINUSER,Enum.ROLES.POWERUSER,Enum.ROLES.ENDUSER,Enum.ROLES.DEVELOPER]],
    // }]
    },
    {
      name: "VerifyOtpForgotPassword", //unique name
      method: "post",
      route: "/verify-forgot-password-otp",
      action: "VerifyOtpForgotPassword",
    //   middlewares: [{
    //   name:"Authorization",
    //   params:[[Enum.ROLES.ADMINUSER,Enum.ROLES.POWERUSER,Enum.ROLES.ENDUSER,Enum.ROLES.DEVELOPER]],
    // }],
  },
    {
      name: "changePassword", //unique name
      method: "put",
      route: "/change-password",
      action: "changePassword",
      middleware: [{
      name:"Authorization",
      params:[[Enum.ROLES.ADMINUSER,Enum.ROLES.POWERUSER,Enum.ROLES.ENDUSER,Enum.ROLES.DEVELOPER]],
    }],},
   
    {
      name: "VerifyOTP", //unique name
      method: "post",
      route: "/verifyotp",
      action: "VerifyOTP",
      middlewares:[]
    }
]}

export default routes;