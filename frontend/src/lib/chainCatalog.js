/**
 * Catálogo local de redes EVM, usado para autopreencher o cadastro de rede.
 *
 * É local de propósito: nada de chamada externa, funciona offline e sem CORS.
 * Os valores são SUGESTÕES — o formulário mantém todos os campos editáveis e
 * pede confirmação antes de salvar, porque RPCs públicos mudam com o tempo.
 */

export const CHAIN_CATALOG = [
  // ── Mainnets ────────────────────────────────────────────────────
  { chainId: 1, name: 'Ethereum', env: 'mainnet', rpcUrl: 'https://eth.llamarpc.com', explorerUrl: 'https://etherscan.io', nativeCurrency: 'ETH' },
  { chainId: 10, name: 'Optimism', env: 'mainnet', rpcUrl: 'https://mainnet.optimism.io', explorerUrl: 'https://optimistic.etherscan.io', nativeCurrency: 'ETH' },
  { chainId: 56, name: 'BNB Smart Chain', env: 'mainnet', rpcUrl: 'https://bsc-dataseed.binance.org', explorerUrl: 'https://bscscan.com', nativeCurrency: 'BNB' },
  { chainId: 100, name: 'Gnosis', env: 'mainnet', rpcUrl: 'https://rpc.gnosischain.com', explorerUrl: 'https://gnosisscan.io', nativeCurrency: 'XDAI' },
  { chainId: 130, name: 'Unichain', env: 'mainnet', rpcUrl: 'https://mainnet.unichain.org', explorerUrl: 'https://uniscan.xyz', nativeCurrency: 'ETH' },
  { chainId: 137, name: 'Polygon', env: 'mainnet', rpcUrl: 'https://polygon-rpc.com', explorerUrl: 'https://polygonscan.com', nativeCurrency: 'POL' },
  { chainId: 204, name: 'opBNB', env: 'mainnet', rpcUrl: 'https://opbnb-mainnet-rpc.bnbchain.org', explorerUrl: 'https://opbnb.bscscan.com', nativeCurrency: 'BNB' },
  { chainId: 250, name: 'Fantom', env: 'mainnet', rpcUrl: 'https://rpc.ftm.tools', explorerUrl: 'https://ftmscan.com', nativeCurrency: 'FTM' },
  { chainId: 252, name: 'Fraxtal', env: 'mainnet', rpcUrl: 'https://rpc.frax.com', explorerUrl: 'https://fraxscan.com', nativeCurrency: 'frxETH' },
  { chainId: 324, name: 'zkSync Era', env: 'mainnet', rpcUrl: 'https://mainnet.era.zksync.io', explorerUrl: 'https://explorer.zksync.io', nativeCurrency: 'ETH' },
  { chainId: 480, name: 'World Chain', env: 'mainnet', rpcUrl: 'https://worldchain-mainnet.g.alchemy.com/public', explorerUrl: 'https://worldscan.org', nativeCurrency: 'ETH' },
  { chainId: 1088, name: 'Metis', env: 'mainnet', rpcUrl: 'https://andromeda.metis.io/?owner=1088', explorerUrl: 'https://andromeda-explorer.metis.io', nativeCurrency: 'METIS' },
  { chainId: 1101, name: 'Polygon zkEVM', env: 'mainnet', rpcUrl: 'https://zkevm-rpc.com', explorerUrl: 'https://zkevm.polygonscan.com', nativeCurrency: 'ETH' },
  { chainId: 1284, name: 'Moonbeam', env: 'mainnet', rpcUrl: 'https://rpc.api.moonbeam.network', explorerUrl: 'https://moonscan.io', nativeCurrency: 'GLMR' },
  { chainId: 5000, name: 'Mantle', env: 'mainnet', rpcUrl: 'https://rpc.mantle.xyz', explorerUrl: 'https://explorer.mantle.xyz', nativeCurrency: 'MNT' },
  { chainId: 8453, name: 'Base', env: 'mainnet', rpcUrl: 'https://mainnet.base.org', explorerUrl: 'https://basescan.org', nativeCurrency: 'ETH' },
  { chainId: 34443, name: 'Mode', env: 'mainnet', rpcUrl: 'https://mainnet.mode.network', explorerUrl: 'https://explorer.mode.network', nativeCurrency: 'ETH' },
  { chainId: 42161, name: 'Arbitrum One', env: 'mainnet', rpcUrl: 'https://arb1.arbitrum.io/rpc', explorerUrl: 'https://arbiscan.io', nativeCurrency: 'ETH' },
  { chainId: 42170, name: 'Arbitrum Nova', env: 'mainnet', rpcUrl: 'https://nova.arbitrum.io/rpc', explorerUrl: 'https://nova.arbiscan.io', nativeCurrency: 'ETH' },
  { chainId: 42220, name: 'Celo', env: 'mainnet', rpcUrl: 'https://forno.celo.org', explorerUrl: 'https://celoscan.io', nativeCurrency: 'CELO' },
  { chainId: 43114, name: 'Avalanche C-Chain', env: 'mainnet', rpcUrl: 'https://api.avax.network/ext/bc/C/rpc', explorerUrl: 'https://snowtrace.io', nativeCurrency: 'AVAX' },
  { chainId: 59144, name: 'Linea', env: 'mainnet', rpcUrl: 'https://rpc.linea.build', explorerUrl: 'https://lineascan.build', nativeCurrency: 'ETH' },
  { chainId: 81457, name: 'Blast', env: 'mainnet', rpcUrl: 'https://rpc.blast.io', explorerUrl: 'https://blastscan.io', nativeCurrency: 'ETH' },
  { chainId: 167000, name: 'Taiko', env: 'mainnet', rpcUrl: 'https://rpc.mainnet.taiko.xyz', explorerUrl: 'https://taikoscan.io', nativeCurrency: 'ETH' },
  { chainId: 534352, name: 'Scroll', env: 'mainnet', rpcUrl: 'https://rpc.scroll.io', explorerUrl: 'https://scrollscan.com', nativeCurrency: 'ETH' },
  { chainId: 7777777, name: 'Zora', env: 'mainnet', rpcUrl: 'https://rpc.zora.energy', explorerUrl: 'https://explorer.zora.energy', nativeCurrency: 'ETH' },

  // ── Testnets ────────────────────────────────────────────────────
  { chainId: 97, name: 'BNB Smart Chain Testnet', env: 'testnet', rpcUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545', explorerUrl: 'https://testnet.bscscan.com', nativeCurrency: 'tBNB' },
  { chainId: 300, name: 'zkSync Sepolia', env: 'testnet', rpcUrl: 'https://sepolia.era.zksync.dev', explorerUrl: 'https://sepolia.explorer.zksync.io', nativeCurrency: 'ETH' },
  { chainId: 17000, name: 'Holesky', env: 'testnet', rpcUrl: 'https://ethereum-holesky-rpc.publicnode.com', explorerUrl: 'https://holesky.etherscan.io', nativeCurrency: 'ETH' },
  { chainId: 80002, name: 'Polygon Amoy', env: 'testnet', rpcUrl: 'https://rpc-amoy.polygon.technology', explorerUrl: 'https://amoy.polygonscan.com', nativeCurrency: 'POL' },
  { chainId: 84532, name: 'Base Sepolia', env: 'testnet', rpcUrl: 'https://sepolia.base.org', explorerUrl: 'https://sepolia.basescan.org', nativeCurrency: 'ETH' },
  { chainId: 421614, name: 'Arbitrum Sepolia', env: 'testnet', rpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc', explorerUrl: 'https://sepolia.arbiscan.io', nativeCurrency: 'ETH' },
  { chainId: 534351, name: 'Scroll Sepolia', env: 'testnet', rpcUrl: 'https://sepolia-rpc.scroll.io', explorerUrl: 'https://sepolia.scrollscan.com', nativeCurrency: 'ETH' },
  { chainId: 59141, name: 'Linea Sepolia', env: 'testnet', rpcUrl: 'https://rpc.sepolia.linea.build', explorerUrl: 'https://sepolia.lineascan.build', nativeCurrency: 'ETH' },
  { chainId: 11155111, name: 'Sepolia', env: 'testnet', rpcUrl: 'https://rpc.sepolia.org', explorerUrl: 'https://sepolia.etherscan.io', nativeCurrency: 'ETH' },
  { chainId: 11155420, name: 'OP Sepolia', env: 'testnet', rpcUrl: 'https://sepolia.optimism.io', explorerUrl: 'https://sepolia-optimism.etherscan.io', nativeCurrency: 'ETH' },
]

/** Explorers "etherscan-like" expõem /address/ e /tx/ e aceitam API compatível. */
function guessApiType(explorerUrl) {
  return /scan\.|etherscan|scan\.io|scan\.com|scan\.build|scan\.xyz/i.test(explorerUrl || '')
    ? 'etherscan'
    : 'rpc-only'
}

/** Deriva os templates de URL do explorer a partir da base. */
export function buildExplorerTemplates(explorerUrl) {
  const base = String(explorerUrl || '').trim().replace(/\/+$/, '')
  if (!base) return { explorerAddressTemplate: '', explorerTxTemplate: '' }
  return {
    explorerAddressTemplate: `${base}/address/{wallet}`,
    explorerTxTemplate: `${base}/tx/{hash}`,
  }
}

/**
 * Procura uma rede pelo Chain ID.
 * @returns {object|null} rascunho pronto para o formulário, ou null se desconhecido.
 */
export function lookupChain(chainId) {
  const id = Number(chainId)
  if (!Number.isInteger(id) || id <= 0) return null

  const found = CHAIN_CATALOG.find((c) => c.chainId === id)
  if (!found) return null

  return {
    ...found,
    chainId: String(found.chainId),
    apiType: guessApiType(found.explorerUrl),
    ...buildExplorerTemplates(found.explorerUrl),
  }
}

/** Busca por nome ou Chain ID, para sugerir enquanto o usuário digita. */
export function searchChains(term, limit = 6) {
  const q = String(term || '').trim().toLowerCase()
  if (!q) return []
  return CHAIN_CATALOG.filter(
    (c) => c.name.toLowerCase().includes(q) || String(c.chainId).startsWith(q),
  ).slice(0, limit)
}
