import { Column, Entity, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Doctor } from "./Doctor";

@Entity()
export class User {
  @PrimaryGeneratedColumn({ name: "id" })
  id!: number;

  @Column()
  email!: string;

  @Column({ default: null })
  password?: string;

  @Column({ name: "phone_number", type: "bigint", default: null })
  phoneNumber?: number;

  @Column({ default: null })
  dob!: string;

  @Column({ name: "email_verified", default: false })
  emailVerfied!: string;

  @Column({ name: "full_name" })
  fullName?: string;

  @Column({ name: "gender", default: null })
  gender?: string;

  @Column({ name: "phone_verified", default: false })
  phoneVerified!: string;

  @Column({ name: "is_active", default: false })
  isActive!: boolean;

  @Column({ name: "profile_pic", default: null })
  profilePic!: string;

  @Column({ name: "social_login", default: null })
  socialLogin!: string;

  @OneToOne(() => Doctor, (doctor) => doctor.user, {
    eager: true,
  })
  doctor?: Doctor;

  [prop: string]: any;
}
