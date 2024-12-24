import registerModel from "#wms/ModuleRegister/registerModel";
import { WebClient } from '@slack/web-api';
import axios from "axios";
import { EmailController as Mail } from "#wms/Config/SendMail";
let CONTDETL00 = registerModel.getModel("CONTDETL00");
let METRICS01 = registerModel.getModel("METRICS01");
class Alert {
  static emailAlert = async (message, alertto,) => {


    try {

      let AlertTo = alertto
      console.log(alertto, 'alertto')
      AlertTo.forEach(async (id) => {

        let resultContact = await CONTDETL00.findOne({ where: { id, status: 10100 }, raw: true })


        //success responce of mailGateway
        let otpMail = await Mail.sendMail(resultContact.email, undefined, message, "Alert");

      })



    } catch (error) {
      console.log(error)
    }


  };
  static emailAlertForWeather = async (message, alertto, headers) => {


    try {

      let AlertTo = alertto
      console.log(alertto, 'alertto',headers)

      AlertTo.forEach(async (id) => {
        let resultContact = await CONTDETL00.findOne({ where: { id, status: 10100 }, raw: true })
        let otpMail = await Mail.sendMail(resultContact.email, headers, message, "Alert",headers);
      })



    } catch (error) {
      console.log(error)
    }


  };

  static slackAlert = async (message, alertto) => {


    try {

      let AlertTo = alertto
      console.log(alertto, "alertto")
      AlertTo.forEach(async (id) => {

        let resultContact = await CONTDETL00.findOne({ where: { id, status: 10100 }, raw: true })

        this.sendSlackMessage(message, resultContact.slack);


      })



    } catch (error) {
      //console.log(error)
    }


  };

  static whatsappAlert = async (message, alertto) => {

    try {



      //console.log(alertto,"alertto")

      let AlertTo = alertto
      AlertTo.forEach(async (id) => {

        let resultContact = await CONTDETL00.findOne({ where: { id, status: 10100 }, raw: true })

        this.sendWhatsAppMessage(message, resultContact.whatsapp);

      })







    } catch (error) {
      // console.log(error,'whatsapp alert')
    }


  };

  static sendWhatsAppMessage = async (message, phone) => {

    try {



      const token = 'EAF6gSALQxcgBO0vlQgLPTz7St8oHutkAX004Naaqfiz2afsqrd7LLGRjh0kJItGUTCcj9bOGJ8mURoTiXJ8EC3PuTZCXXNeMQSuZCcl1SFZBdqgZBt1jlVFCmmbEoil3qFPt0sfc1OjmnzCHWQ4d6ZCW7hEOo7Vdr9qy3oYXsS3849H0vxb7wiPLLnmgTFHsd1suqJLPMnTMjdFtBz9mATKa8L8ael7Tmv8IZD'
      const response = await axios({
        method: 'post',
        url: `https://graph.facebook.com/v20.0/409724545558336/messages`, // Replace YOUR_PHONE_NUMBER_ID with your phone number ID
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        data: {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: phone,
          type: 'text',
          text: {
            "preview_url": false,
            body: message
          }
        }
      })

      console.log('Message sent successfully:', response.data);







    } catch (error) {
      // console.log(error,'whatsapp alert')
    }


  };

  static sendSlackMessage = async (message, slackid) => {

    try {
      const token = 'xoxb-7676865936496-7640706705591-tPnlOaSyXXWXJmIq1AjmK9eK';

      const web = new WebClient(token);

      // Send a message to the user
      const result = await web.chat.postMessage({
        text: message,
        channel: slackid,  // User ID instead of channel name
      });

      console.log(`Message sent: ${result.ts}`);









    } catch (error) {
      //console.log(error,'whatsapp alert')
    }


  };

}
export default Alert;
