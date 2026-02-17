import { useEffect, useState } from 'react'
import { TrendingUp, Zap, Wallet, Bell } from 'lucide-react'
import api from '../services/api'
import { AiBotChat } from '../components/AiBotChat'
import { SocialFeed } from '../components/SocialFeed'

export default function Dashboard() {
  const [wallet, setWallet] = useState(null)
  
  // Mock wallet - em produção, usar wallet real conectada
  useEffect(() => {
    setWallet({ 
      address: '0x1234567890123456789012345678901234567890'
    })
  }, [])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    fetchDashboardData()
  }, [])
  
  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/analytics/dashboard')
      setStats(response.data.data)
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }
  
  const statCards = [
    {
      name: 'Active Airdrops',
      value: stats?.activeAirdrops || 0,
      icon: Zap,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
      name: 'Monitored Wallets',
      value: stats?.monitoredWallets || 0,
      icon: Wallet,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20'
    },
    {
      name: 'Eligible Checks',
      value: stats?.eligibleChecks || 0,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20'
    },
    {
      name: 'Pending Alerts',
      value: stats?.pendingAlerts || 0,
      icon: Bell,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20'
    }
  ]
  
  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Monitor your airdrop eligibility and alerts
        </p>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.name} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {stat.name}
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                    {stat.value}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </div>
          )
        })}
      </div>
      
      {/* Recent Activity */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Recent Activity
        </h2>
        
        {stats?.recentActivity && stats.recentActivity.length > 0 ? (
          <div className="space-y-3">
            {stats.recentActivity.map((activity, index) => (
              <div
                key={index}
                className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary-600"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {activity.count} new alerts
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {new Date(activity.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No recent activity
          </div>
        )}
      </div>
      
      {/* Quick Actions */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card hover:shadow-lg transition-shadow cursor-pointer">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            🎯 Check Eligibility
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Verify your wallet eligibility for active airdrops
          </p>
        </div>
        
        <div className="card hover:shadow-lg transition-shadow cursor-pointer">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            🔔 View Alerts
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Check critical notifications and updates
          </p>
        </div>
        
        <div className="card hover:shadow-lg transition-shadow cursor-pointer">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            💰 Add Wallet
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Monitor a new wallet address
          </p>
        </div>
      </div>

      {/* AI Bot e Social Feed */}
      <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Bot Chat */}
        <div style={{ height: '500px' }}>
          {wallet && <AiBotChat wallet={wallet} />}
        </div>
        
        {/* Social Feed */}
        <div style={{ height: '500px' }}>
          <SocialFeed />
        </div>
      </div>
    </div>
  )
}
