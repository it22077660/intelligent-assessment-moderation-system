/**
 * API Utility Functions
 * Centralized API calls to backend
 */

import axios from 'axios';
import { getAuthToken } from './auth';

const API_BASE_URL = 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Don't override Content-Type for FormData uploads
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me')
};

// Module APIs
export const moduleAPI = {
  getAll: () => api.get('/modules'),
  getById: (id) => api.get(`/modules/${id}`),
  create: (moduleData) => api.post('/modules', moduleData),
  update: (id, moduleData) => api.put(`/modules/${id}`, moduleData),
  delete: (id) => api.delete(`/modules/${id}`)
};

// Question APIs
export const questionAPI = {
  getByModule: (moduleId, filters = {}) => {
    const params = new URLSearchParams();
    if (filters.source) params.append('source', filters.source);
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    const queryString = params.toString();
    return api.get(`/questions/module/${moduleId}${queryString ? '?' + queryString : ''}`);
  },
  getById: (id) => api.get(`/questions/${id}`),
  create: (questionData) => api.post('/questions', questionData),
  update: (id, questionData) => api.put(`/questions/${id}`, questionData),
  delete: (id) => api.delete(`/questions/${id}`),
  upload: (moduleId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('moduleId', moduleId);
    // Axios will automatically set Content-Type with boundary for FormData
    return api.post('/questions/upload', formData);
  }
};

// Coverage APIs
export const coverageAPI = {
  analyze: (moduleId, data = {}) => api.post(`/coverage/analyze/${moduleId}`, data),
  getByModule: (moduleId, analysisTag = null) => {
    const params = analysisTag ? `?analysisTag=${encodeURIComponent(analysisTag)}` : '';
    return api.get(`/coverage/module/${moduleId}${params}`);
  },
  getStats: (moduleId, analysisTag = null) => {
    const params = analysisTag ? `?analysisTag=${encodeURIComponent(analysisTag)}` : '';
    return api.get(`/coverage/stats/${moduleId}${params}`);
  },
  getAnalysisTags: (moduleId) => api.get(`/coverage/analysis-tags/${moduleId}`)
};

// AI APIs
export const aiAPI = {
  generateQuestions: (data) => api.post('/ai/generate-questions', data),
  generateBatch: (data) => api.post('/ai/generate-batch', data)
};

export default api;

