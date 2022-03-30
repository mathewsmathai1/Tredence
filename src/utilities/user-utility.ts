import { getCustomRepository } from "typeorm";
import { UserRepository } from "../repository/UserRepository";

export class UserUtility {
  constructor() {}

  static userRepository = getCustomRepository(UserRepository, "mysqlDB");

  static async getEntityAccounts(idField: any) {
    //if not a number check for email otherwise number
    let whereFilter = {};
    if (isNaN(idField) == true) {
      whereFilter = {
        email: idField,
      };
    } else {
      whereFilter = {
        phoneNumber: idField,
      };
    }
    console.log("FILTER: ", whereFilter);
    return UserUtility.userRepository.findOne({
      where: whereFilter,
      //relations: ["doctor"],  relation set as eager in User.ts
    });
  }

  static async entityExists(idField: string): Promise<any> {
    let returnObject: any = {
      userExists: false,
      user: null,
      doctorExists: false,
      patientExists: false,
    };
    return new Promise((resolve, reject) => {
      UserUtility.getEntityAccounts(idField)
        .then((user: any) => {
          console.log("Inside Doctor Exists: ", user);
          if (user !== null && user !== undefined) {
            //&& "doctor" in user && user.doctor !== null) {
            returnObject.userExists = true;
            returnObject.user = user;
            if ("doctor" in user && user.doctor !== null) {
              returnObject.doctorExists = true;
            }
            resolve(returnObject);
          } else {
            resolve(returnObject);
          }
        })
        .catch((err) => {
          reject(err);
        });
    });
  }
}
