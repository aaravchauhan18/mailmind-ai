export type Priority = "URGENT" | "IMPORTANT" | "FYI";
export type Email = { id: string; threadId?: string; sender: string; subject: string; receivedAt: string; priority: Priority; status: string; summary: string; preview: string; body?: string; html?: string };
export type Task = { id: string; title: string; dueAt?: string; completed: boolean; emailId?: string; emailSubject?: string };
export type Digest = { urgent: number; important: number; fyi: number; pendingTasks: Task[]; highlights: string[] };
export type Profile = { email: string; displayName: string; initials: string; provider: string };
export type Attachment = { name: string; contentType: string; data: string; invalid?: boolean; error?: string };
export type IncomingAttachment = { id: string; name: string; contentType: string; size: number };

const headers = { "Content-Type": "application/json" };
const configuredApiBase = import.meta.env.VITE_API_BASE_URL;
if (configuredApiBase === undefined) throw new Error("VITE_API_BASE_URL must be set in the repository-root .env file.");
const apiBase = configuredApiBase.replace(/\/$/, "");
export const apiUrl = (path: string) => `${apiBase}${path}`;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(apiUrl(path), { ...init, headers: { ...headers, ...init?.headers } });
  if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error || "Request failed");
  return response.status === 204 ? undefined as T : response.json();
}
const compose = (body: string, attachments: Attachment[]) => ({ method: "POST", body: JSON.stringify({ body, attachments: attachments.filter((file) => !file.invalid) }) });

export const api = {
  me: () => request<Profile>("/api/me"), sync: () => request<{ imported: number }>("/api/gmail/sync", { method: "POST" }),
  logout: () => fetch(apiUrl("/api/logout"), { method: "POST" }), emails: () => request<Email[]>("/api/emails"),
  body: (id: string) => request<{ body: string; html: string }>(`/api/emails/${id}/body`), incomingAttachments: (id: string) => request<IncomingAttachment[]>(`/api/emails/${id}/attachments`),
  digest: () => request<Digest>("/api/digest"), tasks: () => request<Task[]>("/api/tasks"), closedTasks: () => request<Task[]>("/api/tasks/closed"),
  generateTasks: () => request<Task[]>("/api/tasks/generate", { method: "POST" }), summary: (id: string) => request<Email>(`/api/emails/${id}/ai-summary`, { method: "POST" }),
  search: (query: string) => request<{ results: Email[] }>(`/api/search?q=${encodeURIComponent(query)}`), complete: (id: string) => request<void>(`/api/tasks/${id}/complete`, { method: "PATCH" }),
  deleteClosedTask: (id: string) => request<void>(`/api/tasks/${id}`, { method: "DELETE" }), deleteAllClosedTasks: () => request<void>("/api/tasks/closed", { method: "DELETE" }),
  reply: (id: string, instruction: string) => request<{ text: string }>(`/api/emails/${id}/reply`, { method: "POST", body: JSON.stringify({ instruction }) }),
  saveDraft: (id: string, body: string, attachments: Attachment[]) => request<{ id: string; threadId: string }>(`/api/emails/${id}/gmail-draft`, compose(body, attachments)),
  send: (id: string, body: string, attachments: Attachment[]) => request<{ id: string; threadId: string }>(`/api/emails/${id}/gmail-send`, compose(body, attachments)),
};
