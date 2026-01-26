
export interface UserEntity {  
    id: string;
    email: string;
    passwordHash: string;
    role: string;
    createdAt: Date;
  }