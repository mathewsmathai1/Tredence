const { OAuth2Client } = require("google-auth-library");
const unirest = require("unirest");
const moment = require("moment");
//import jwt from 'jsonwebtoken';
export class GoogleAuth {
  static client = new OAuth2Client(process.env.GAUTH_CLIENT_ID);

  static async verify(gToken: string) {
    const ticket = this.client.verifyIdToken({
      idToken: gToken,
      audience: process.env.GAUTH_CLIENT_ID, // Specify the CLIENT_ID of the app that accesses the backend
      // Or, if multiple clients access the backend:
      //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
    });

    return ticket;

    //const payload = ticket.getPayload();
    //const userid = payload['sub'];

    /*
    jwt.verify(
      this.token,
      '-----BEGIN CERTIFICATE-----\nMIIDJjCCAg6gAwIBAgIIYkwrFjEpP6AwDQYJKoZIhvcNAQEFBQAwNjE0MDIGA1UE\nAxMrZmVkZXJhdGVkLXNpZ25vbi5zeXN0ZW0uZ3NlcnZpY2VhY2NvdW50LmNvbTAe\nFw0yMTA4MTUwNDMwMDZaFw0yMTA4MzExNjQ1MDZaMDYxNDAyBgNVBAMTK2ZlZGVy\nYXRlZC1zaWdub24uc3lzdGVtLmdzZXJ2aWNlYWNjb3VudC5jb20wggEiMA0GCSqG\nSIb3DQEBAQUAA4IBDwAwggEKAoIBAQDGSCbSNTQntKCuaa4vKmNY7on0yUX2+lGm\nzDziyZ7gS1YxTIC7jNP5f1N6fnAH1bbPQZ+3lA6YUv3254/cx46pmxcbBbZRZW5A\nKmQPRujioMOrBu3wKXfVCNvlEd66+bBik1Ar/Wmlvp3CVQIDZj0BoTtSxkhOVHuv\nleIE284RmHQtOyM9yKQKF4Czqc9IwFt0h4zby+KLU+A9hNTrHp1EFUEATFpGdEM9\nlmHhpyB8oils4Iwmba25yrBiHHdavkuG7nqhkAsriW8/1ICA5l0bcEDjw8oh0s56\nJM/4Mj+kcmEifU3mUwJyZykbc4oy9ajS0Uw4aPw6v6YeoH/kj4vjAgMBAAGjODA2\nMAwGA1UdEwEB/wQCMAAwDgYDVR0PAQH/BAQDAgeAMBYGA1UdJQEB/wQMMAoGCCsG\nAQUFBwMCMA0GCSqGSIb3DQEBBQUAA4IBAQBab7wxuzfef5MTLZC/f/b04yb7Tzon\nlK2rqMNKF0XU+zhc2ToEo6W9OwaJN5kdM3iX3eBiCgJARhN4173p58fCZZ+sw5hS\nuoW5zrmU016NjTQTIhNI9djj/trZu0PJRDo8gwNBoGtOKvA3MjHxkw9fG4NdjbT/\n/gmiPY0nC6PXls75Mydzj+PNWQ1ldcfGIGMLbcArja5N1Z4/oU/zb8VTDF+NGdGQ\nJ4wm2T2mfEkPrz5LDKQsUKFCs5YKHiuZ1SNQrEPVZWtUe5I8wVIamIOgUtr8yKBz\nNW57m/cbblz4fs/iFugAOO91/sU5wD1Y+GSI8KCXvWn1NLZdZBDUe01b\n-----END CERTIFICATE-----',
      {algorithms: ['RS256']},
      (err, val) => {
        if (err) console.log('J-error: ', err);
        else console.log('J-value: ', val);
      },
    );
  */

    //console.log(payload);
    // If request specified a G Suite domain:
    // const domain = payload['hd'];
  }
  //verify().catch(console.error);
  static async getAdditionalInfo(gAccessToken: string) {
    console.log("Access Token: ", gAccessToken);
    const peopleApiUrl =
      "https://people.googleapis.com/v1/people/me?personFields=phoneNumbers,genders,names,emailAddresses,birthdays&&access_token=";
    const request = unirest("GET", peopleApiUrl + gAccessToken);

    return new Promise((resolve: any, reject: any) => {
      request.end(function (response: any) {
        if (response.error) {
          console.log("Error while fetching additional details");
          return resolve({});
        }
        let extractedDetailsObject = GoogleAuth.extractDetails(response.body);
        console.log("Extracted Details: ", extractedDetailsObject);
        resolve(extractedDetailsObject);
      });
    });
  }

  static extractDetails(additionalInfo: any) {
    let extractedDetailsObject: any = {};
    if (additionalInfo) {
      extractedDetailsObject.gender = additionalInfo.genders
        ? additionalInfo.genders.length
          ? additionalInfo.genders[0].formattedValue
          : null
        : null;

      extractedDetailsObject.dob = additionalInfo.birthdays
        ? additionalInfo.birthdays.length
          ? (additionalInfo.birthdays[0].date.day > 9
              ? "" + additionalInfo.birthdays[0].date.day
              : "0" + additionalInfo.birthdays[0].date.day) +
            "-" +
            (additionalInfo.birthdays[0].date.month > 9
              ? "" + additionalInfo.birthdays[0].date.month
              : "0" + additionalInfo.birthdays[0].date.month) +
            "-" +
            additionalInfo.birthdays[0].date.year
          : null
        : null;
    }
    return extractedDetailsObject;
  }
}
