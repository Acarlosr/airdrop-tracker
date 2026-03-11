import { createContext, useContext, useEffect, useState, useCallback } from 'react'

const STORAGE_KEY = 'airdrop-tracker.networks.v1'

const DEFAULT_NETWORKS = [
  {
    id: 'arbitrum-mainnet',
    name: 'Arbitrum',
    chainId: 42161,
    env: 'mainnet',
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    explorerUrl: 'https://arbiscan.io',
    explorerAddressTemplate: 'https://arbiscan.io/address/{wallet}',
    explorerTxTemplate: 'https://arbiscan.io/tx/{hash}',
    apiType: 'etherscan',
    apiKey: '',
    nativeCurrency: 'ETH',
    isActive: true,
  },
  {
    id: 'arbitrum-sepolia',
    name: 'Arbitrum Sepolia',
    chainId: 421614,
    env: 'testnet',
    rpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
    explorerUrl: 'https://sepolia.arbiscan.io',
    explorerAddressTemplate: 'https://sepolia.arbiscan.io/address/{wallet}',
    explorerTxTemplate: 'https://sepolia.arbiscan.io/tx/{hash}',
    apiType: 'etherscan',
    apiKey: '',
    nativeCurrency: 'ETH',
    isActive: true,
  },
  {
    id: 'base-mainnet',
    name: 'Base',
    chainId: 8453,
    env: 'mainnet',
    rpcUrl: 'https://mainnet.base.org',
    explorerUrl: 'https://basescan.org',
    explorerAddressTemplate: 'https://basescan.org/address/{wallet}',
    explorerTxTemplate: 'https://basescan.org/tx/{hash}',
    apiType: 'etherscan',
    apiKey: '',
    nativeCurrency: 'ETH',
    isActive: true,
  },
  {
    id: 'base-sepolia',
    name: 'Base Sepolia',
    chainId: 84532,
    env: 'testnet',
    rpcUrl: 'https://sepolia.base.org',
    explorerUrl: 'https://sepolia.basescan.org',
    explorerAddressTemplate: 'https://sepolia.basescan.org/address/{wallet}',
    explorerTxTemplate: 'https://sepolia.basescan.org/tx/{hash}',
    apiType: 'etherscan',
    apiKey: '',
    nativeCurrency: 'ETH',
    isActive: true,
  },
  {
    id: 'optimism-mainnet',
    name: 'Optimism',
    chainId: 10,
    env: 'mainnet',
    rpcUrl: 'https://mainnet.optimism.io',
    explorerUrl: 'https://optimistic.etherscan.io',
    explorerAddressTemplate: 'https://optimistic.etherscan.io/address/{wallet}',
    explorerTxTemplate: 'https://optimistic.etherscan.io/tx/{hash}',
    apiType: 'etherscan',
    apiKey: '',
    nativeCurrency: 'ETH',
    isActive: true,
  },
]

const NetworksContext = createContext(null)

export function NetworksProvider({ children }) {
  const [networks, setNetworks] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) return JSON.parse(stored)
    } catch {
      // ignore
    }
    return DEFAULT_NETWORKS
  })

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(networks))
    } catch {
      // ignore
    }
  }, [networks])

  const addNetwork = useCallback((data) => {
    const id =
      data.id ||
      (typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `net-${Date.now()}-${Math.random().toString(16).slice(2)}`)
    const net = {
      id,
      name: data.name?.trim() || 'Nova rede',
      chainId: Number(data.chainId) || 0,
      env: data.env === 'testnet' ? 'testnet' : 'mainnet',
      rpcUrl: data.rpcUrl?.trim() || '',
      explorerUrl: data.explorerUrl?.trim() || '',
      explorerAddressTemplate: data.explorerAddressTemplate?.trim() || '',
      explorerTxTemplate: data.explorerTxTemplate?.trim() || '',
      apiType: data.apiType || 'rpc-only',
      apiKey: data.apiKey?.trim() || '',
      nativeCurrency: data.nativeCurrency?.trim() || 'ETH',
      isActive: data.isActive ?? true,
    }
    setNetworks((prev) => [...prev, net])
  }, [])

  const updateNetwork = useCallback((id, patch) => {
    setNetworks((prev) =>
      prev.map((n) => (n.id === id ? { ...n, ...patch, chainId: Number(patch.chainId ?? n.chainId) } : n)),
    )
  }, [])

  const removeNetwork = useCallback((id) => {
    setNetworks((prev) => prev.filter((n) => n.id !== id))
  }, [])

  const value = { networks, addNetwork, updateNetwork, removeNetwork }

  return <NetworksContext.Provider value={value}>{children}</NetworksContext.Provider>
}

/* eslint-disable react-refresh/only-export-components -- hooks/helpers exported from context file */
export function useNetworks() {
  const ctx = useContext(NetworksContext)
  if (!ctx) throw new Error('useNetworks deve ser usado dentro de NetworksProvider')
  return ctx
}

export function findNetworkForAirdrop(networks, airdrop) {
  if (!airdrop) return null
  const criteria = airdrop.criteria || {}
  const guide = criteria.guide || {}
  const networkId = criteria.networkId || guide.networkId
  if (networkId) {
    const byId = networks.find((n) => n.id === networkId)
    if (byId) return byId
  }
  const chain = (airdrop.chain || '').toLowerCase()
  if (!chain) return null
  return (
    networks.find((n) => n.name.toLowerCase() === chain) ||
    networks.find((n) => chain.includes(String(n.chainId))) ||
    networks.find((n) => chain.includes(n.name.toLowerCase()))
  )
}

