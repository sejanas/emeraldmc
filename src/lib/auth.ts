import { api } from './api';

export async function getProfile() {
  return api.get<{ profile: any }>('/auth/me');
}

export async function login(email: string, password: string) {
  return api.post<{ session: { access_token: string; refresh_token: string }; profile: any }>('/auth/login', { email, password });
}

export async function signup(data: any) {
  return api.post('/auth/signup', data);
}

export default { getProfile, login, signup };
