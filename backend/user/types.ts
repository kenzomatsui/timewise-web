export interface User {
  id: number;
  email: string;
  createdAt: Date;
  isActive: boolean;
}

export interface UserRow {
  id: number;
  email: string;
  password_hash: string;
  created_at: Date;
  is_active: boolean;
}
