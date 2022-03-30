import express, {NextFunction} from "express";
import {User} from "../../entity/User";
import {app} from "../../server";
import {EmailService} from "../../utilities/email-utility";
import {OtpUtility} from "../../utilities/otp-utility";
import {UserUtility} from "../../utilities/user-utility";

const router = express.Router();
// const redis = require("../../connections/redis-connection");
const redisConnection = app.locals.redisDB;
router
  .route("/generateOtp")
  .put(async (req: any, res: any, next: NextFunction) => {
    req.responseProperties = {};
    console.log("Inside generate OTP");

    let idField: any = req.body.idField;
    let appModule: string = req.body.appModule;
    let fetchedUserAccount: User = new User();

    await UserUtility.entityExists(idField).then(async (fetchedUser: any) => {
      fetchedUserAccount = fetchedUser;
      if (fetchedUser.userExists == true) {
        req.responseProperties.skipBasicFields = true;
      }
      if (fetchedUserAccount.doctorExists == true) {
        req.responseProperties.success = false;
        req.responseProperties.message = "Doctor Account already exists";
        req.exitStatus = true;
        next();
      }
    });

    if (req.exitStatus) {
      return true;
    }

    let otp: any = null;
    await OtpUtility.generateOtp(idField, appModule)
      .then((otpValue) => {
        otp = otpValue;
      })
      .catch((err) => {
        req.responseProperties.success = false;
        req.responseProperties.message =
          "Seomthing went wrong. Please try again later";
        req.exitStatus = true;
        next();
      });

    if (req.exitStatus) {
      return true;
    }

    if (isNaN(idField) == true) {
      const mailSubject = "Email Confirmation";
      const mailBody =
        "Hello, <br> Please Use the Below Otp To Confirm Your Email Account: <br>" +
        otp +
        "<br>Best Regards,<br>" +
        "Team DocTech";
      const mailOptions = EmailService.prepEmail(
        idField,
        mailSubject,
        mailBody
      );

    EmailService.sendMail(mailOptions);
    } else {
      await OtpUtility.sendPhoneOtp(idField, otp)
        .then((response) => {
          console.log(response);
        })
        .catch((err) => {
          console.log(err);
          req.responseProperties.success = false;
          req.responseProperties.message =
            "Seomthing went wrong. Please try again later";
          req.exitStatus = true;
          next();
        });
      console.log("All Good", otp);
    }

    if (req.exitStatus) {
      return true;
    }

    req.responseProperties.success = true;
    req.responseProperties.message = "Otp Sent Successfuly: " + otp;
    next();
  });

export = router;
