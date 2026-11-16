import { Column, Entity, Index } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { UserRole } from '../../../common/enums/role.enum';

@Entity('users')
export class User extends AbstractBaseEntity {
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255, select: false })
  passwordHash: string;

  @Column({ type: 'varchar', length: 150 })
  fullName: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phoneNumber?: string | null;

  @Column({ type: 'varchar', length: 300, nullable: true })
  bio?: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  location?: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  avatarUrl?: string | null;

  @Index()
  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.CLIENT,
  })
  role: UserRole;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;
}
