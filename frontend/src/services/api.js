const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const response = await fetch(url, { ...options, headers });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `HTTP error ${response.status}: ${response.statusText}`);
  }

  return data;
}

export const api = {
  // Workflows
  getWorkflows: () => request('/workflows'),
  getWorkflow: (id) => request(`/workflows/${id}`),
  createWorkflow: (workflowData) => request('/workflows', {
    method: 'POST',
    body: JSON.stringify(workflowData)
  }),
  updateWorkflow: (id, workflowData) => request(`/workflows/${id}`, {
    method: 'PUT',
    body: JSON.stringify(workflowData)
  }),
  deleteWorkflow: (id) => request(`/workflows/${id}`, {
    method: 'DELETE'
  }),
  executeWorkflow: (id, payload = {}) => request(`/workflows/${id}/execute`, {
    method: 'POST',
    body: JSON.stringify({ payload })
  }),

  // Runs
  getRuns: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/runs${query ? `?${query}` : ''}`);
  },
  getRun: (id) => request(`/runs/${id}`),
  retryRun: (id) => request(`/runs/${id}/retry`, { method: 'POST' }),

  // AI Generator
  parseWorkflowAi: (prompt) => request('/ai/parse-workflow', {
    method: 'POST',
    body: JSON.stringify({ prompt })
  }),

  // Health & Stats
  getHealth: () => request('/health'),
  getStats: () => request('/stats'),
  simulateRestart: () => request('/test/simulate-restart', { method: 'POST' }),
  resetDemo: () => request('/test/reset-demo', { method: 'POST' })
};

export default api;
