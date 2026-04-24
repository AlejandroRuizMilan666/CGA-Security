import { api } from "./api";

export type DocumentDirection = "INCOMING" | "OUTGOING";

export interface DocumentRecord {
  id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  direction: DocumentDirection;
  notes?: string | null;
  createdAt: string;
  company?: { id: string; companyName: string } | null;
  uploadedBy?: { id: string; fullName: string } | null;
}

export interface UploadDocumentPayload {
  file: File;
  direction: DocumentDirection;
  notes?: string;
  companyId?: string;
}

export interface DownloadUrlResponse {
  url: string;
}

export async function fetchMyDocuments(): Promise<DocumentRecord[]> {
  const { data } = await api.get<DocumentRecord[]>("/documents/me");
  return data;
}

export async function fetchCompanyDocuments(
  companyId: string,
): Promise<DocumentRecord[]> {
  const { data } = await api.get<DocumentRecord[]>(
    `/documents/company/${companyId}`,
  );
  return data;
}

export async function uploadDocument(
  payload: UploadDocumentPayload,
): Promise<DocumentRecord> {
  const form = new FormData();
  form.append("file", payload.file);
  form.append("direction", payload.direction);
  if (payload.notes) form.append("notes", payload.notes);
  if (payload.companyId) form.append("companyId", payload.companyId);

  const { data } = await api.post<DocumentRecord>("/documents/upload", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function getDownloadUrl(
  documentId: string,
): Promise<DownloadUrlResponse> {
  const { data } = await api.get<DownloadUrlResponse>(
    `/documents/${documentId}/download`,
  );
  return data;
}

export async function deleteDocument(documentId: string): Promise<void> {
  await api.delete(`/documents/${documentId}`);
}
