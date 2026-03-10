import axios from 'axios'

const instance = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

const TOKEN_KEY = 'airdrop_token';

// Request interceptor
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error('API Error:', error.response.data)
    } else if (error.request) {
      console.error('Network Error:', error.request)
    } else {
      console.error('Error:', error.message)
    }
    return Promise.reject(error)
  }
)

// ── Typed service functions ─────────────────────────────────────

const api = {
  // Raw instance for custom calls
  raw: instance,

  // Alerts
  getAlerts: (params = {}) => instance.get('/alerts', { params }),
  getUrgentAlerts: () => instance.get('/alerts/urgent'),
  markAlertRead: (id) => instance.patch(`/alerts/${id}/notify`),
  deleteAlert: (id) => instance.delete(`/alerts/${id}`),
  createAlert: (data) => instance.post('/alerts', data),

  // Wallets
  getWallets: () => instance.get('/wallets'),
  getWallet: (address) => instance.get(`/wallets/${address}`),
  addWallet: (data) => instance.post('/wallets', data),
  deleteWallet: (address) => instance.delete(`/wallets/${address}`),
  toggleWallet: (address) => instance.patch(`/wallets/${address}/toggle`),
  getWalletBalances: (address) => instance.get(`/wallets/${address}/balances`),
  getWalletActivity: (address, chain) => instance.get(`/wallets/${address}/activity`, { params: { chain } }),

  // Airdrops
  getAirdrops: (params = {}) => instance.get('/airdrops', { params }),
  getAirdrop: (id) => instance.get(`/airdrops/${id}`),
  createAirdrop: (data) => instance.post('/airdrops', data),
  updateAirdrop: (id, data) => instance.patch(`/airdrops/${id}`, data),
  deleteAirdrop: (id) => instance.delete(`/airdrops/${id}`),

  // Eligibility
  checkEligibility: (wallet, airdropId) => instance.post('/eligibility/check', { wallet, airdrop: airdropId }),

  // Analytics / Dashboard
  getDashboardStats: () => instance.get('/analytics/dashboard'),

  // Social Feed
  getSocialFeed: (params = {}) => instance.get('/social/feed', { params }),

  // Bot
  sendBotMessage: (data) => instance.post('/bot/message', data),

  // Auth
  getMe: () => instance.get('/auth/me'),

  // Transactions
  getTransactions: (params = {}) => instance.get('/transactions', { params }),
  getTransactionsSummary: () => instance.get('/transactions/summary'),
  createTransaction: (data) => instance.post('/transactions', data),
  updateTransaction: (id, data) => instance.patch(`/transactions/${id}`, data),
  deleteTransaction: (id) => instance.delete(`/transactions/${id}`),

  // AI Robot
  getRobotStatus: () => instance.get('/ai-robot/status'),
  getRobotInsights: (params = {}) => instance.get('/ai-robot/insights', { params }),
  getRobotReminders: (params = {}) => instance.get('/ai-robot/reminders', { params }),
  triggerRobotAnalysis: () => instance.post('/ai-robot/analyze'),
  toggleRobot: () => instance.post('/ai-robot/toggle'),
  sendRobotChat: (data) => instance.post('/ai-robot/chat', data),

  // Generic GET/POST (backward compatible)
  get: (...args) => instance.get(...args),
  post: (...args) => instance.post(...args),
  patch: (...args) => instance.patch(...args),
  delete: (...args) => instance.delete(...args),
}

export default api
