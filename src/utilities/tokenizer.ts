import jwt from "jsonwebtoken";

export class Tokenizer {
  static jwtSecret: any = process.env.JWT_SECRET;

  static async getToken(payload: any) {
    console.log("Inside Tokenizer :  ", payload);
    return new Promise((resolve, reject) => {
      jwt.sign(payload, Tokenizer.jwtSecret, (err: any, token: any) => {
        if (err) {
          reject(err);
        }
        resolve(token);
      });
    });
  }

  static async verifyToken(token: string) {
    return new Promise((resolve, reject) => {
      jwt.verify(token, Tokenizer.jwtSecret, (err: any, verifiedJwt: any) => {
        if (err) {
          console.log("err verify: ", err);
          reject("Error verifying JWT");
        }
        if (verifiedJwt) {
          console.log("verify succ: ", verifiedJwt);
          resolve(verifiedJwt);
        }
      });
    });
  }
}
