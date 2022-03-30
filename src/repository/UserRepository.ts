import { EntityRepository, Repository } from "typeorm";
import { User } from "../entity/User";

@EntityRepository(User)
export class UserRepository extends Repository<User> {
  findByName(full_name: any) {
    return this.findOne({ full_name });
  }
}
