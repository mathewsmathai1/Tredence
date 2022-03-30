import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { User } from "./User";

@Entity()
export class Doctor {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column({ name: "reg_id", default: null })
  regId!: string;

  @Column({ name: "clinic_address", default: null })
  clinicAddress?: string;

  @Column("boolean", { default: false, name: "is_active" })
  isActive?: boolean;

  @Column({ default: null })
  city!: string;

  @Column({ default: null })
  country!: string;

  @Column({ name: "fk_user_id" })
  userId!: number;

  @OneToOne(() => User, (user) => user.doctor, { onDelete: "CASCADE" })
  @JoinColumn({ name: "fk_user_id", referencedColumnName: "id" })
  user?: User;
}
