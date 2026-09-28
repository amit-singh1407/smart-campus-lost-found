import api from './api';

export const itemService = {
  // Unified Dashboard API
  async getDashboard() {
    const res = await api.get('/dashboard');
    return res.data;
  },

  // Image Upload API (Cloudinary)
  async uploadImage(file) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/items/upload-image', formData, {
      headers: {
        'Content-Type': null,
      },
    });
    return res.data;
  },

  // Browse & Search with pagination
  async getItems(params = {}) {
    const res = await api.get('/items', { params });
    return res.data;
  },

  async searchByImage(file, params = {}) {
    const formData = new FormData();
    formData.append('file', file);
    Object.entries(params).forEach(([key, value]) => formData.append(key, value));
    const res = await api.post('/items/search-by-image', formData, {
      headers: { 'Content-Type': null },
    });
    return res.data;
  },

  // Item details by ID
  async getItemById(id) {
    const res = await api.get(`/items/${id}`);
    return res.data;
  },

  // Report Lost
  async reportLost(data) {
    const res = await api.post('/items/lost', data);
    return res.data;
  },

  // Report Found
  async reportFound(data) {
    const res = await api.post('/items/found', data);
    return res.data;
  },

  // Submit Found Confirmation (New Flow)
  async submitFoundConfirmation(data) {
    const res = await api.post('/items/found-confirmation', data);
    return res.data;
  },

  // My Reports
  async getMyReports() {
    const res = await api.get('/items/my');
    return res.data;
  },

  // Update own item report
  async updateItem(id, data) {
    const res = await api.put(`/items/${id}`, data);
    return res.data;
  },

  // Delete own item report
  async deleteItem(id) {
    const res = await api.delete(`/items/${id}`);
    return res.data;
  },

  // Update status
  async updateItemStatus(id, status) {
    const res = await api.patch(`/items/${id}/status`, { status });
    return res.data;
  },

  // Get Smart Matches
  async getMatches() {
    const res = await api.get('/items/matches');
    return res.data;
  },

  async createWatchlist(lostItemId) {
    const res = await api.post('/watchlists', { lost_item_id: lostItemId });
    return res.data;
  },

  async deleteWatchlist(id) {
    const res = await api.delete(`/watchlists/${id}`);
    return res.data;
  },
};

export const claimService = {
  async getMyClaims() {
    const res = await api.get('/claims/my');
    return res.data;
  },

  async createClaim(data) {
    const res = await api.post('/claims', data);
    return res.data;
  },

  async getClaimDetails(id) {
    const res = await api.get(`/claims/${id}`);
    return res.data;
  },

  async getNotifications() {
    const res = await api.get('/notifications');
    return res.data;
  },

  async markNotificationRead(id) {
    const res = await api.patch(`/notifications/${id}/read`);
    return res.data;
  },
};

export const assistantService = {
  async chatAssistant(query, language = 'en') {
    const res = await api.post('/assistant/chat', { query, language });
    return res.data;
  },

  async analyzeQuality(data) {
    const res = await api.post('/assistant/analyze-quality', data);
    return res.data;
  },
};

export const adminService = {
  async getStats() {
    const res = await api.get('/admin/dashboard');
    return res.data;
  },

  async getUsers(params = {}) {
    const res = await api.get('/admin/users', { params });
    return res.data;
  },

  async getUserById(id) {
    const res = await api.get(`/admin/users/${id}`);
    return res.data;
  },

  async updateUserRole(userId, role) {
    const res = await api.patch(`/admin/users/${userId}/role`, { role });
    return res.data;
  },

  async updateUserStatus(userId, status) {
    const res = await api.put(`/admin/users/${userId}/status`, { status });
    return res.data;
  },

  async getAdminItems(params = {}) {
    const res = await api.get('/admin/items', { params });
    return res.data;
  },

  async deleteAdminItem(id) {
    const res = await api.delete(`/admin/items/${id}`);
    return res.data;
  },

  async getAdminClaims(params = {}) {
    const res = await api.get('/admin/claims', { params });
    return res.data;
  },

  async getAdminClaimById(id) {
    const res = await api.get(`/admin/claims/${id}`);
    return res.data;
  },

  async resolveClaim(claimId, decision, notes = '') {
    const res = await api.patch(`/admin/claims/${claimId}/resolve`, { decision, notes });
    return res.data;
  },

  async verifyCollection(token) {
    const res = await api.post('/admin/collection/verify', null, { params: { token } });
    return res.data;
  },

  async getAuditLogs(params = {}) {
    const res = await api.get('/admin/audit-logs', { params });
    return res.data;
  },
};

