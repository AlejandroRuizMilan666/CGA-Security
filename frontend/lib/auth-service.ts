import { api } from "./api";

export type AppRole = "ADMIN" | "EMPRESA" | "ALUMNO";

export interface AppUser {
  id: string;
  email: string;
  fullName: string;
  role: AppRole;
  company?: {
    id: string;
    companyName: string;
    taxId: string;
    phone?: string | null;
    address?: string | null;
  } | null;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: AppUser;
}

export interface CourseSummary {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  price: number;
  isPublished: boolean;
  enrollmentCount: number;
  modules: Array<{
    id: string;
    title: string;
    type: string;
    position: number;
  }>;
}

export interface CreateCourseModulePayload {
  title: string;
  description?: string;
  type: "TEXT" | "VIDEO" | "DOCUMENT";
  contentUrl?: string;
  position?: number;
}

export interface CreateCoursePayload {
  title: string;
  slug?: string;
  description?: string;
  price: number;
  isPublished?: boolean;
  modules?: CreateCourseModulePayload[];
}

const SESSION_KEY = "cga-beta-session";

export function setAuthorizationToken(token: string | null) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    return;
  }

  delete api.defaults.headers.common.Authorization;
}

export function persistSession(session: AuthResponse) {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  setAuthorizationToken(session.accessToken);
}

export function getStoredSession() {
  if (typeof window === "undefined") {
    return null;
  }

  const rawValue = localStorage.getItem(SESSION_KEY);

  if (!rawValue) {
    return null;
  }

  const session = JSON.parse(rawValue) as AuthResponse;
  setAuthorizationToken(session.accessToken);
  return session;
}

export function clearStoredSession() {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(SESSION_KEY);
  setAuthorizationToken(null);
}

export async function login(payload: { email: string; password: string }) {
  const { data } = await api.post<AuthResponse>("/auth/login", payload);
  return data;
}

export async function registerStudent(payload: {
  email: string;
  password: string;
  fullName: string;
}) {
  const { data } = await api.post<AuthResponse>(
    "/auth/register/student",
    payload,
  );
  return data;
}

export async function registerCompany(payload: {
  email: string;
  password: string;
  fullName: string;
  companyName: string;
  taxId: string;
  phone?: string;
  address?: string;
}) {
  const { data } = await api.post<AuthResponse>(
    "/auth/register/company",
    payload,
  );
  return data;
}

export async function fetchCourses() {
  const { data } = await api.get<CourseSummary[]>("/courses");
  return data;
}

export async function fetchAdminCourses() {
  const { data } = await api.get<CourseSummary[]>("/courses/admin/all");
  return data;
}

export async function createCourse(payload: CreateCoursePayload) {
  const { data } = await api.post<CourseSummary>("/courses", payload);
  return data;
}

export async function enrollInCourse(courseId: string) {
  const { data } = await api.post(`/courses/${courseId}/enroll`);
  return data;
}
