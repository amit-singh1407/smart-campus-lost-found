import api from './api';

export const authService = {
  async register(data) {
    const res = await api.post('/auth/register', data);
    return res.data;
  },

  async verifyEmail(data) {
    const res = await api.post('/auth/verify-email', data);
    return res.data;
  },

  async resendOtp(data) {
    const res = await api.post('/auth/resend-otp', data);
    return res.data;
  },

  async login(data) {
    const res = await api.post('/auth/login', data);
    return res.data;
  },

  async adminLogin(data) {
    const res = await api.post('/admin/login', data);
    return res.data;
  },

  async getMe() {
    const res = await api.get('/auth/me');
    return res.data;
  },

  async updateProfile(data) {
    const res = await api.put('/users/profile', data);
    return res.data;
  },

  async requestPasswordReset(data) {
    const res = await api.post('/auth/forgot-password', data);
    return res.data;
  },

  async resetPassword(data) {
    const res = await api.post('/auth/reset-password', data);
    return res.data;
  },
};
