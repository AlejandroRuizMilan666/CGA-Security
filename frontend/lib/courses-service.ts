import { api } from "./api";

export type ModuleType = "VIDEO" | "DOCUMENT" | "TEXT";
export type PaymentStatus = "PENDING" | "COMPLETED" | "FAILED";

export interface CourseModule {
  id: string;
  title: string;
  description?: string | null;
  type: ModuleType;
  contentUrl?: string | null;
  position: number;
}

export interface CourseFull {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  price: number;
  isPublished: boolean;
  enrollmentCount: number;
  modules: CourseModule[];
  createdAt?: string;
}

export interface EnrollmentWithProgress {
  id: string;
  paymentStatus: PaymentStatus;
  enrolledAt: string;
  course: CourseFull;
  progressPercent: number;
}

export interface ModuleProgress {
  id: string;
  courseModuleId: string;
  completed: boolean;
  completedAt?: string | null;
  module: CourseModule;
}

export interface CourseProgressDetail {
  enrollment: { id: string; paymentStatus: PaymentStatus };
  course: CourseFull;
  progressPercent: number;
  modules: ModuleProgress[];
}

export interface CreateCourseModulePayload {
  title: string;
  description?: string;
  type: ModuleType;
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

export interface UpdateCoursePayload {
  title?: string;
  description?: string;
  price?: number;
  isPublished?: boolean;
  modules?: CreateCourseModulePayload[];
}

export async function fetchPublishedCourses(): Promise<CourseFull[]> {
  const { data } = await api.get<CourseFull[]>("/courses");
  return data;
}

export async function fetchAllCourses(): Promise<CourseFull[]> {
  const { data } = await api.get<CourseFull[]>("/courses/admin/all");
  return data;
}

export async function fetchCourseBySlug(slug: string): Promise<CourseFull> {
  const { data } = await api.get<CourseFull>(`/courses/${slug}`);
  return data;
}

export async function createCourseApi(
  payload: CreateCoursePayload,
): Promise<CourseFull> {
  const { data } = await api.post<CourseFull>("/courses", payload);
  return data;
}

export async function updateCourseApi(
  courseId: string,
  payload: UpdateCoursePayload,
): Promise<CourseFull> {
  const { data } = await api.patch<CourseFull>(`/courses/${courseId}`, payload);
  return data;
}

export async function deleteCourseApi(courseId: string): Promise<void> {
  await api.delete(`/courses/${courseId}`);
}

export async function fetchMyEnrollments(): Promise<EnrollmentWithProgress[]> {
  const { data } = await api.get<EnrollmentWithProgress[]>(
    "/courses/me/enrollments",
  );
  return data;
}

export async function fetchCourseProgress(
  courseId: string,
): Promise<CourseProgressDetail> {
  const { data } = await api.get<CourseProgressDetail>(
    `/courses/${courseId}/progress/me`,
  );
  return data;
}

export async function enrollInCourseApi(courseId: string): Promise<void> {
  await api.post(`/courses/${courseId}/enroll`);
}

export async function completeModule(
  courseId: string,
  moduleId: string,
): Promise<void> {
  await api.post(`/courses/${courseId}/modules/${moduleId}/complete`);
}
