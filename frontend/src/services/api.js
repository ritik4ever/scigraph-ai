import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// API methods
const apiMethods = {
  // Dashboard
  getDashboardData: () => api.get('/dashboard'),

  // Papers
  getPapers: (params) => api.get('/papers', { params }),
  getPaper: (id) => api.get(`/papers/${id}`),
  uploadPaper: (formData) => api.post('/papers/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  deletePaper: (id) => api.delete(`/papers/${id}`),
  analyzePaper: (id) => api.post(`/papers/${id}/analyze`),

  // Knowledge Graph
  getKnowledgeGraph: (params) => api.get('/knowledge-graph', { params }),
  searchKnowledgeGraph: (data) => api.post('/knowledge-graph/search', data),
  findPath: (from, to, params) => api.get(`/knowledge-graph/path/${from}/${to}`, { params }),
  getEntities: (params) => api.get('/knowledge-graph/entities', { params }),

  // Analysis
  extractEntities: (data) => api.post('/analysis/extract-entities', data),
  findRelationships: (data) => api.post('/analysis/find-relationships', data),
  summarizeText: (data) => api.post('/analysis/summarize', data),
  compareTexts: (data) => api.post('/analysis/compare', data),

  // Hypotheses
  getHypotheses: (params) => api.get('/hypotheses', { params }),
  generateHypotheses: (data) => api.post('/hypotheses/generate', data),
  validateHypothesis: (id, data) => api.put(`/hypotheses/${id}/validate`, data),
  deleteHypothesis: (id) => api.delete(`/hypotheses/${id}`),
};

export default apiMethods;