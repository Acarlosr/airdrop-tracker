export type AirdropPhase =
  | 'speculative'
  | 'confirmed'
  | 'live'
  | 'claimable'
  | 'ended'

export type AirdropWalletStatus =
  | 'pending'
  | 'in_progress'
  | 'claimed'
  | 'skip'

export interface Airdrop {
  id: string
  name: string
  protocol?: string | null
  chain?: string | null
  status?: string | null
  total_supply?: number | null
  snapshot_date?: string | null
  claim_start?: string | null
  claim_end?: string | null
  criteria?: Record<string, unknown> | null
  links?: Record<string, string | null> | null
  phase?: AirdropPhase
  tgeDate?: string | null
  vestingEndDate?: string | null
  estimatedValue?: string | null
  walletIds?: string[] | null
  walletStatus?: Record<string, AirdropWalletStatus> | null
}
