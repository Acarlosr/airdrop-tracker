/**
 * Card com fundo escuro e glow azul índigo premium.
 */
export function GlowCard({ children, className = '', active = false, hoverGlow = true }) {
  const base = [
    'rounded-2xl p-6 border relative overflow-hidden transition-all duration-300',
  ].join(' ')

  const borderColor = active
    ? 'border-[rgba(240, 160, 32,0.35)]'
    : 'border-[rgba(255,255,255,0.07)]'

  const shadow = active
    ? 'shadow-[0_0_0_1px_rgba(240, 160, 32,0.20),0_8px_32px_rgba(240, 160, 32,0.18)]'
    : ''

  const hoverClass = hoverGlow
    ? 'hover:border-[rgba(240, 160, 32,0.28)] hover:shadow-[0_0_0_1px_rgba(240, 160, 32,0.15),0_8px_32px_rgba(240, 160, 32,0.12)]'
    : ''

  return (
    <div
      className={`${base} ${borderColor} ${shadow} ${hoverClass} ${className}`}
      style={{ background: 'var(--surface-card)' }}
    >
      {/* Subtle blue gradient overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, rgba(240, 160, 32,0.055) 0%, transparent 60%)',
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  )
}

export default GlowCard
