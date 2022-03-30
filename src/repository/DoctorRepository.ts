import { EntityRepository, Repository } from "typeorm";
import { Doctor } from "../entity/Doctor";

//any function using custom queries will go here
@EntityRepository(Doctor)
export class DoctorRepository extends Repository<Doctor> {}
