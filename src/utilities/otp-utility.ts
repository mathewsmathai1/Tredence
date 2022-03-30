const unirest = require("unirest");
const { v4: uuidv4 } = require("uuid");
var Promise = require("bluebird");
import { app } from "../server";

const prefix: any = {
  registration: "reg:",
};
//const saltRounds = 10;
export class OtpUtility {
  static redisConnection = app.locals.redisDB;
  static async generateOtp(idField: any, appModule: string): Promise<number> {
    return new Promise(async (resolve: any, reject: any) => {
      const modulePrefix = prefix[appModule];
      const otp = uuidv4().replace(/\D/g, "").substring(0, 6);

      OtpUtility.redisConnection.set(
        modulePrefix + idField,
        otp,
        (err: Error, result: any) => {
          if (err) {
            reject(err);
          } else {
            OtpUtility.redisConnection.expire(
              modulePrefix + idField,
              300, //seconds -> 5 minutes
              (err: Error, result: any) => {
                if (err) {
                  reject(err);
                } else {
                  resolve(otp);
                }
              }
            );
          }
        }
      );
    });
  }

  static async sendPhoneOtp(id_field: any, otp: any): Promise<any> {
    const req = unirest("POST", "https://www.fast2sms.com/dev/bulkV2");

    return Promise.resolve(1); //remove later. Only to save otp count

    req.headers({
      authorization:
        "4arvtzZPSBsGUWMpiJ7xRC0bHcLeVODgumfIoFY159l6njyNqkA6CPxid5o3kDs4KTZvVtzwpRGEr9J1",
    });

    req.form({
      message: "DocTech Otp for mobile number verification:" + otp,
      //sender_id: 'DocTEch Ltd.',
      route: "v3",
      //sender_id: 'DocTech',
      //language: 'english',
      //flash: 1,
      numbers: id_field,
    });

    await new Promise((resolve: any, reject: any) => {
      req.end(function (res: any) {
        if (res.error) {
          reject("Mobile Number Verification Failed");
        }

        resolve("Successful");
      });
    });
  }

  static async verifyOtp(idField: any, inputOtp: any, appModule: string) {
    const redisKey = prefix[appModule] + idField;
    const responseObject: any = {
      success: false,
      present: false,
    };
    return new Promise((resolve: any, reject: any) => {
      OtpUtility.redisConnection.get(
        redisKey,
        function (err: Error, reply: any) {
          // reply is null when the key is missing
          if (err) {
            reject(err);
          } else if (reply == null) {
            console.log("Key expired or not present");
          } else {
            console.log(reply, inputOtp);
            responseObject.present = true;
            if (reply == inputOtp) {
              responseObject.success = true;
            }
          }
          resolve(responseObject);
        }
      );
    });
  }
}
