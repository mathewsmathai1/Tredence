import { Doctor } from "../entity/Doctor";

export class DoctorUtility {
  constructor() {}

  static doctor = new Doctor();

  static formatModel(unfilteredDoctor: any) {
    delete this.doctor.user;
    return Object.keys(unfilteredDoctor)
      .filter((key) => Object.keys(DoctorUtility.doctor).includes(key))
      .reduce((obj: any, key: any) => {
        obj[key] = unfilteredDoctor[key];
        return obj;
      }, {});
  }
}
