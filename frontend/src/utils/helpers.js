/**
 * Truncate wallet address: 0x1234...5678
 */
export function shortAddress(addr, chars = 4) {
    if (!addr) return '—';
    return `${addr.slice(0, chars + 2)}...${addr.slice(-chars)}`;
}

/**
 * Relative time string (e.g. "5 min ago", "2h ago", "3d ago")
 */
export function timeAgo(date) {
    if (!date) return '—';
    const now = Date.now();
    const diff = now - new Date(date).getTime();
    const seconds = Math.floor(diff / 1000);

    if (seconds < 60) return 'agora';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}min atrás`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h atrás`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d atrás`;
    const months = Math.floor(days / 30);
    return `${months}m atrás`;
}

/**
 * Map priority level to Tailwind badge classes
 */
export function priorityColor(priority) {
    switch (priority) {
        case 'critical': return 'bg-red-500/20 text-red-400 border border-red-500/30';
        case 'high': return 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
        case 'normal': return 'bg-electric/20 text-electric border border-electric/30';
        case 'low': return 'bg-white/10 text-white/60 border border-white/10';
        default: return 'bg-white/10 text-white/60 border border-white/10';
    }
}

/**
 * Priority label in Portuguese
 */
export function priorityLabel(priority) {
    switch (priority) {
        case 'critical': return 'Crítico';
        case 'high': return 'Alto';
        case 'normal': return 'Normal';
        case 'low': return 'Baixo';
        default: return priority || '—';
    }
}

/**
 * Locale-aware number formatting
 */
export function formatNumber(n) {
    if (n == null || isNaN(n)) return '0';
    return new Intl.NumberFormat('pt-BR').format(n);
}

/**
 * Validate Ethereum address (basic)
 */
export function isValidAddress(addr) {
    return /^0x[a-fA-F0-9]{40}$/.test(addr);
}
