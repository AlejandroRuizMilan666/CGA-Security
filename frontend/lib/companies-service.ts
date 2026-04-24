import { api } from "./api";

export interface CompanyDetail {
  id: string;
  companyName: string;
  taxId: string;
  phone?: string | null;
  address?: string | null;
  user?: { id: string; email: string; fullName: string } | null;
  createdAt: string;
}

export interface UpdateCompanyPayload {
  companyName?: string;
  taxId?: string;
  phone?: string;
  address?: string;
}

export async function fetchMyCompany(): Promise<CompanyDetail> {
  const { data } = await api.get<CompanyDetail>("/companies/me");
  return data;
}

export async function updateMyCompany(
  payload: UpdateCompanyPayload,
): Promise<CompanyDetail> {
  const { data } = await api.patch<CompanyDetail>("/companies/me", payload);
  return data;
}

export async function fetchCompanies(): Promise<CompanyDetail[]> {
  const { data } = await api.get<CompanyDetail[]>("/companies");
  return data;
}

export async function fetchCompanyById(id: string): Promise<CompanyDetail> {
  const { data } = await api.get<CompanyDetail>(`/companies/${id}`);
  return data;
}
