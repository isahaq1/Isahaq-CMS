const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

import type {
  User,
  CompanyGroup,
  Company,
  Site,
  Page,
  Navigation,
  Media,
  Language,
  DashboardStats,
  AuthResponse,
} from '@group-cms/shared';

interface FetchOptions extends RequestInit {
  token?: string;
}

class ApiClient {
  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  }

  async request<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
    const { token, ...fetchOptions } = options;
    const authToken = token || this.getToken();

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(fetchOptions.headers || {}),
    };

    if (authToken) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${authToken}`;
    }

    const res = await fetch(`${API_URL}${endpoint}`, {
      ...fetchOptions,
      headers,
    });

    const data = await res.json();

    if (!res.ok) {
      const err = new Error(data.error || 'Request failed') as Error & { details?: Record<string, string[]> };
      if (data.details) err.details = data.details;
      throw err;
    }

    return data.data ?? data;
  }

  // Auth
  login(email: string, password: string) {
    return this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  getMe() {
    return this.request<User>('/auth/me');
  }

  // Groups
  getGroups() {
    return this.request<CompanyGroup[]>('/groups');
  }

  getGroup(id: string) {
    return this.request<CompanyGroup>(`/groups/${id}`);
  }

  createGroup(data: Record<string, unknown>) {
    return this.request('/groups', { method: 'POST', body: JSON.stringify(data) });
  }

  updateGroup(id: string, data: Record<string, unknown>) {
    return this.request(`/groups/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  deleteGroup(id: string) {
    return this.request(`/groups/${id}`, { method: 'DELETE' });
  }

  // Companies
  getCompanies() {
    return this.request<Company[]>('/companies');
  }

  getCompany(id: string) {
    return this.request<Company>(`/companies/${id}`);
  }

  createCompany(data: Record<string, unknown>) {
    return this.request('/companies', { method: 'POST', body: JSON.stringify(data) });
  }

  updateCompany(id: string, data: Record<string, unknown>) {
    return this.request(`/companies/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  deleteCompany(id: string) {
    return this.request(`/companies/${id}`, { method: 'DELETE' });
  }

  // Sites
  getSites(companyId?: string) {
    const query = companyId ? `?companyId=${companyId}` : '';
    return this.request<Site[]>(`/sites${query}`);
  }

  getSite(id: string) {
    return this.request<Site>(`/sites/${id}`);
  }

  createSite(data: Record<string, unknown>) {
    return this.request('/sites', { method: 'POST', body: JSON.stringify(data) });
  }

  updateSite(id: string, data: Record<string, unknown>) {
    return this.request(`/sites/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  deleteSite(id: string) {
    return this.request(`/sites/${id}`, { method: 'DELETE' });
  }

  // Pages
  getPages(siteId: string) {
    return this.request<Page[]>(`/pages?siteId=${siteId}`);
  }

  getPage(id: string) {
    return this.request<Page>(`/pages/${id}`);
  }

  createPage(data: Record<string, unknown>) {
    return this.request('/pages', { method: 'POST', body: JSON.stringify(data) });
  }

  updatePage(id: string, data: Record<string, unknown>) {
    return this.request(`/pages/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  updatePageBlocks(id: string, blocks: unknown[]) {
    return this.request(`/pages/${id}/blocks`, {
      method: 'PUT',
      body: JSON.stringify({ blocks }),
    });
  }

  reorderPages(pages: { id: string; sortOrder: number }[]) {
    return this.request('/pages/reorder', {
      method: 'PUT',
      body: JSON.stringify({ pages }),
    });
  }

  deletePage(id: string) {
    return this.request(`/pages/${id}`, { method: 'DELETE' });
  }

  // Navigation
  getNavigations(siteId: string, position?: string) {
    const q = position ? `&position=${position}` : '';
    return this.request<Navigation[]>(`/navigation?siteId=${siteId}${q}`);
  }

  createNavigation(data: Record<string, unknown>) {
    return this.request<Navigation>('/navigation', { method: 'POST', body: JSON.stringify(data) });
  }

  updateNavigation(id: string, data: Record<string, unknown>) {
    return this.request<Navigation>(`/navigation/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  deleteNavigation(id: string) {
    return this.request(`/navigation/${id}`, { method: 'DELETE' });
  }

  // Media
  getMedia(companyId: string) {
    return this.request<Media[]>(`/media?companyId=${companyId}`);
  }

  async uploadMedia(companyId: string, file: File, alt?: string) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('companyId', companyId);
    if (alt) formData.append('alt', alt);

    const token = this.getToken();
    const res = await fetch(`${API_URL}/media/upload`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Upload failed');
    return data.data;
  }

  deleteMedia(id: string) {
    return this.request(`/media/${id}`, { method: 'DELETE' });
  }

  // Languages
  getLanguages() {
    return this.request<Language[]>('/languages');
  }

  createLanguage(data: Record<string, unknown>) {
    return this.request<Language>('/languages', { method: 'POST', body: JSON.stringify(data) });
  }

  updateLanguage(id: string, data: Record<string, unknown>) {
    return this.request<Language>(`/languages/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  setDefaultLanguage(id: string) {
    return this.request<Language>(`/languages/${id}/default`, { method: 'PUT' });
  }

  deleteLanguage(id: string) {
    return this.request(`/languages/${id}`, { method: 'DELETE' });
  }

  // Users (SUPER_ADMIN only)
  getUsers() {
    return this.request<User[]>('/users');
  }

  createUser(data: Record<string, unknown>) {
    return this.request<User>('/users', { method: 'POST', body: JSON.stringify(data) });
  }

  updateUser(id: string, data: Record<string, unknown>) {
    return this.request<User>(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  changeUserPassword(id: string, password: string) {
    return this.request(`/users/${id}/password`, { method: 'PUT', body: JSON.stringify({ password }) });
  }

  deleteUser(id: string) {
    return this.request(`/users/${id}`, { method: 'DELETE' });
  }

  // Dashboard
  getDashboardStats() {
    return this.request<DashboardStats>('/dashboard/stats');
  }

  // Public
  getPublicSite(siteId: string) {
    return this.request<Site & { pages: Page[]; navigations: Navigation[] }>(`/public/site/${siteId}`);
  }

  getPublicPage(siteId: string, slug: string) {
    return this.request<Page & { site: Site & { company: Company; navigations: Navigation[] } }>(
      `/public/site/${siteId}/page/${slug}`
    );
  }

  getPublicHomePage(siteId: string) {
    return this.request<Page & { site: Site & { company: Company; navigations: Navigation[] } }>(
      `/public/site/${siteId}/home`
    );
  }
}

export const api = new ApiClient();
