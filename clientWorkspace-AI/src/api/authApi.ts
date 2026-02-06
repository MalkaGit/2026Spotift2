import { httpClient } from './httpClient';
import type { LoginCredentials, LoginResponse, RegisterInput, RegisterResponse } from '@/types';

export async function login(credentials: LoginCredentials): Promise<LoginResponse> {
  const { data } = await httpClient.post<LoginResponse>('/users/login', credentials);
  return data;
}

export async function register(input: RegisterInput): Promise<RegisterResponse> {
  const { data } = await httpClient.post<RegisterResponse>('/users/register', input);
  return data;
}
