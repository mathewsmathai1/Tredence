const router = require("express").Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const http = require("http");
const nodemailer = require("nodemailer");
const { v4: uuidv4 } = require("uuid");
import { NextFunction, Request, Response } from "express";
import _ from "lodash";
import { getConnection, getCustomRepository } from "typeorm";
import { Doctor } from "../entity/Doctor";
import { User } from "../entity/User";
import { DoctorRepository } from "../repository/DoctorRepository";
import { UserRepository } from "../repository/UserRepository";
import { app as ctx } from "../server";
import { DoctorUtility } from "../utilities/doctor-utility";
import { GoogleAuth } from "../utilities/google-auth-utility";
import { OtpUtility } from "../utilities/otp-utility";
import { Tokenizer } from "../utilities/tokenizer";
import { UserUtility } from "../utilities/user-utility";
const mysqlConnection = getConnection("mysqlDB");
const { getToken, verifyToken } = require("../utilities/tokenizer");
const redis = ctx.locals.redisDB;

router
  .route("/getUsers")
  .get((req: Request, res: Response, next: NextFunction) => {
    console.log("Printing Redis: ", redis);
    redis.set("sample", "dataSample", (success: any) => {
      console.log("Inside set: ", success);
    });

    mysqlConnection.query("Select * from User").then(async (results) => {
      let tokenPayload = {
        name: "Samuel",
        id: 1,
      };
      const jwtToken = await getToken(tokenPayload);
      const verifiedJwtData = await verifyToken(
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiU2FtdWVsIiwiaWQiOjEsImlhdCI6MTYzMTAzMzgxN30.vGR27mlV1GFmgWEwD0kbnjKYw0Dvh0TGEU30pJhk9-w"
      );

      res.status(res.statusCode).json({
        token: jwtToken,
        res: results[0],
        count: results.length,
        verifiedJwt: verifiedJwtData,
      });
    });
  });

router.route("/create").post(async (req: any, res: any, next: NextFunction) => {
  console.log("User:  ", req.body.user);

  req.responseProperties = {};
  const modulePrefix = "registration";
  let user: User = req.body.user;
  let entityHolder: any = {};
  let currentUser: User = new User();
  let fetchedUserAccount: User = new User();

  if (req.body.entity == "Doctor") {
    let promises: Array<any> = [];
    promises.push(
      OtpUtility.verifyOtp(user.email, req.body.emailOtp, modulePrefix)
    );
    promises.push(
      OtpUtility.verifyOtp(user.phoneNumber, req.body.phoneOtp, modulePrefix)
    );

    console.log("BEFORE CALLING OTP CHECK");
    await Promise.all(promises)
      .then(([emailOtpResponse, phoneOtpResponse]) => {
        console.log("OTP RESPONSE RECEIVED");
        console.log(emailOtpResponse, phoneOtpResponse);
        if (emailOtpResponse.success == false) {
          if (emailOtpResponse.present == false) {
            req.responseProperties.emailOtpPresent = false;
          }
          req.responseProperties.emailOtpIncorrect = true;
          req.responseProperties.success = false;
          req.exitStatus = true;
        }
        if (phoneOtpResponse.success == false) {
          if (phoneOtpResponse.present == false) {
            req.responseProperties.phoneOtpPresent = false;
          }
          req.responseProperties.phoneOtpIncorrect = true;
          req.responseProperties.success = false;
          req.exitStatus = true;
        }
      })
      .catch(() => {
        req.responseProperties.message =
          "Something went wrong. Please try again later";
        req.responseProperties.success = false;
        req.exitStatus = true;
      });

    if (req.exitStatus) {
      next();
      console.log("HERE");
      return true;
    }
  }

  let userDetails: any = { fetchedUserAccount, user, currentUser };
  await checkAndCreateUserAccount(req, userDetails);
  ({ fetchedUserAccount, currentUser } = userDetails);

  userDetails = { entityHolder, user, currentUser, fetchedUserAccount };
  if (req.body.entity == "Doctor") {
    await createDoctorAccount(req, userDetails);
    ({ entityHolder, currentUser, fetchedUserAccount } = userDetails);
  }

  if (req.exitStatus) {
    next();
    return true;
  }

  await createAccessToken(req, entityHolder, currentUser, user);
  next();
});

router.route("/login").post(async (req: any, res: any, next: NextFunction) => {
  console.log("User:  ", req.body.user);

  req.responseProperties = {};
  const modulePrefix = "registration";
  let user: User = req.body.user;
  let entityHolder: any = {};
  let currentUser: User = new User();
  let fetchedUserAccount: User = new User();

  console.log("REQUEST BODY: ", req.body);
  if (!(user.email && user.password)) {
    res.status(401);
    req.responseProperties.message = "Authentication Failed!";
    req.responseProperties.success = false;
    req.exitStatus = true;
    next();
    return true;
  }

  fetchedUserAccount = await UserUtility.entityExists(user.email).catch(
    (err) => {
      console.log("ERROR: ", err);
    }
  );

  if (!fetchedUserAccount) {
    res.status(401);
    req.responseProperties.message = "Authentication Failed!";
    req.responseProperties.success = false;
    req.exitStatus = true;
    next();
    return true;
  }

  if (!fetchedUserAccount.doctorExists) {
    res.status(401);
    req.responseProperties.message = "No Doctor Account Found For This User!";
    req.responseProperties.success = false;
    req.exitStatus = true;
    next();
    return true;
  }

  fetchedUserAccount = JSON.parse(JSON.stringify(fetchedUserAccount));

  console.log(
    "FETCHED USER: ",
    fetchedUserAccount,
    fetchedUserAccount.user.doctor
  );
  currentUser = fetchedUserAccount.user;
  entityHolder = DoctorUtility.formatModel(fetchedUserAccount.user.doctor);

  await createAccessToken(req, entityHolder, currentUser, user);
  next();
});
function checkProfileStatus(entity: string, entityHolder: any): boolean {
  const isEmpty = Object.values(entityHolder).some((value: any, index) => {
    if (value == null || value == "") {
      console.log(value);
      return true;
    }
  });

  if (isEmpty === true) {
    return false;
  } else if (entityHolder.isActive == false) {
    return false;
  }

  return true;
}

router
  .route("/googleAuth")
  .post(async (req: any, res: any, next: NextFunction) => {
    req.responseProperties = {};
    let user: User = new User();
    const doctor: Doctor = new Doctor();
    let gPayload: any = null;
    let gIdToken: string = req.body.gIdToken;

    let entityHolder: any = {};
    let currentUser: User = new User();
    let fetchedUserAccount: User = new User();

    await GoogleAuth.verify(gIdToken)
      .then((value: any) => {
        console.log("SUCCESSFUL");
        console.log(value);
        gPayload = value.payload;
      })
      .catch((err: any) => {
        console.log("ERROR HERE");
        console.log(err);
      });
    console.log("gPayload:  ", gPayload, user);
    if (gPayload) {
      user.email = gPayload.email;
      user.emailVerified = gPayload.email_verified == true ? "Y" : "N";
      user.password = "";
      user.fullName = gPayload.given_name + " " + gPayload.family_name;
      user.isActive = gPayload.email_verified;
      user.profilePic = gPayload.picture;
      user.socialLogin = gPayload.iss;

      doctor.isActive = user.is_active;
    } else {
      req.responseProperties.message = "Something went wrong";
      req.responseProperties.success = false;
      return next();
    }

    if (req.body.gAccessToken) {
      await GoogleAuth.getAdditionalInfo(req.body.gAccessToken).then(
        (additionalInfo: any) => {
          console.log("additional info: ", additionalInfo);
          if (additionalInfo) {
            _.extend(user, additionalInfo);
            console.log("User After adding additional: ", user);
          }
        }
      );
    }

    let userDetails: any = { fetchedUserAccount, user, currentUser };
    await checkAndCreateUserAccount(req, userDetails);
    ({ fetchedUserAccount, currentUser } = userDetails);

    userDetails = { entityHolder, user, currentUser, fetchedUserAccount };
    if (req.body.entity == "Doctor") {
      await createDoctorAccount(req, userDetails);
      ({ entityHolder, currentUser, fetchedUserAccount } = userDetails);
    }

    if (req.exitStatus) {
      next();
      return true;
    }

    await createAccessToken(req, entityHolder, currentUser, user);

    next();
    return true;
  });

async function createAccessToken(
  req: any,
  entityHolder: any,
  currentUser: any,
  user: any
) {
  const tokenPayload = {
    userId: currentUser.id,
    userName: user.fullName,
    userEmail: user.email,
    entity: req.body.entity,
    entityId: entityHolder.id,
    entityIsActive: entityHolder.isActive,
    entityProfileCompletionStatus: checkProfileStatus(
      req.body.entity,
      entityHolder
    ),
  };
  const jwtToken = await Tokenizer.getToken(tokenPayload);
  console.log("jwtToken: ", jwtToken);

  req.responseProperties.accessToken = jwtToken;
}

//await checkAndCreateUserAccount(req, fetchedUserAccount, user, currentUser);
async function checkAndCreateUserAccount(req: any, userDetails: any) {
  let userRepository = getCustomRepository(UserRepository, "mysqlDB");
  await UserUtility.entityExists(userDetails.user.email).then(
    async (fetchedUser: any) => {
      userDetails.fetchedUserAccount = fetchedUser;
      userDetails.currentUser = fetchedUser.user;
      if (fetchedUser.userExists == false) {
        userDetails.user.isActive = true;
        await userRepository.save(userDetails.user).then((userObject) => {
          userDetails.currentUser = userObject;
        });
      }
    }
  );
}

async function createDoctorAccount(req: any, userDetails: any) {
  if (userDetails.fetchedUserAccount.doctorExists == true) {
    if (req.body.gIdToken) {
      userDetails.entityHolder = DoctorUtility.formatModel(
        userDetails.currentUser.doctor
      );
      console.log(userDetails.entityHolder);
      req.responseProperties.message = "Logged In";
      req.responseProperties.success = true;
      return true;
    }
    req.responseProperties.message = "Doctor Already Exists for This Account";
    req.responseProperties.success = false;
    req.exitStatus = true;
  }

  if (req.exitStatus) {
    return true;
  }

  userDetails.entityHolder = new Doctor();

  userDetails.entityHolder = userDetails.user;
  console.log(userDetails.currentUser);
  userDetails.entityHolder.userId = userDetails.currentUser.id;
  userDetails.entityHolder.isActive = true;

  let entityRepository = getCustomRepository(DoctorRepository, "mysqlDB");
  await entityRepository.save(userDetails.entityHolder).then((result) => {
    userDetails.entityHolder = DoctorUtility.formatModel(result);
  });

  req.responseProperties.message = "Doctor Account Created";
  req.responseProperties.success = true;
}
module.exports = router;
