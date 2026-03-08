import { api } from './api';

export async function getProfile() {
  return api.get<{ profile: any; phones: any[]; emails: any[] }>('/auth/me');
}

export async function login(email: string, password: string) {
  return api.post<{ session: { access_token: string; refresh_token: string }; profile: any }>('/auth/login', { email, password });
}

export async function signup(data: any) {
  return api.post('/auth/signup', data);
}

export async function updateProfile(data: { name: string; clinic_role: string; phones: string[]; emails: string[] }) {
  return api.put('/auth/profile', data);
}

export async function resubmit() {
  return api.post('/auth/resubmit');
}

export default { getProfile, login, signup, updateProfile, resubmit };
