import { httpClient } from './httpClient';
import type { UserProfile } from '@/types';

export async function getMe(): Promise<UserProfile> {
  const { data } = await httpClient.get<UserProfile>('/users/me');
  return data;
}
