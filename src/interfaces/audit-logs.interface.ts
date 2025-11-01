import { User } from './users.interface';
import { Action } from './enums.interface';

export interface AuditLog {
  id: string;
  user_id: string;
  action: Action;
  bc_hash: string;
  created_at: Date;

  user: User;
}
