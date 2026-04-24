import { api } from "./api";
import type { AppRole } from "./auth-service";

export interface UserDetail {
  id: string;
  email: string;
  fullName: string;
  isActive: boolean;
  role: { name: AppRole };
  company?: { id: string; companyName: string } | null;
  createdAt: string;
}

export interface AdminUpdateUserPayload {
  fullName?: string;
  isActive?: boolean;
  role?: AppRole;
}

export async function fetchUsers(): Promise<UserDetail[]> {
  const { data } = await api.get<UserDetail[]>("/users");
  return data;
}

export async function fetchMe(): Promise<UserDetail> {
  const { data } = await api.get<UserDetail>("/users/me");
  return data;
}

export interface UpdateProfilePayload {
  fullName?: string;
}

export async function updateMyProfile(
  payload: UpdateProfilePayload,
): Promise<UserDetail> {
  const { data } = await api.patch<UserDetail>("/users/me", payload);
  return data;
}

export async function adminUpdateUser(
  id: string,
  payload: AdminUpdateUserPayload,
): Promise<UserDetail> {
  const { data } = await api.patch<UserDetail>(`/users/${id}`, payload);
  return data;
}
