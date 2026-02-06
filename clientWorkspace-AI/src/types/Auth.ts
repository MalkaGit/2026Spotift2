export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  expiresIn: number;
}

export interface RegisterInput {
  email: string;
  password: string;
}

export interface RegisterResponse {
  id: string;
}
