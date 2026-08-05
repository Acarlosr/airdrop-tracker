/**
 * Logo do ClaimOS — ícone de “claim” (check) + referência airdrop.
 * Uso: <ClaimOSLogo className="w-12 h-12" /> ou com size.
 */
export function ClaimOSLogo({ className = 'w-10 h-10', size }) {
  const s = size ?? 40
  return (
    <svg
      viewBox="0 0 48 48"
      width={s}
      height={s}
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      {/* Fundo: escudo/badge arredondado */}
      <path
        d="M24 4C12 4 6 12 6 22v14c0 4 4 8 18 8s18-4 18-8V22C42 12 36 4 24 4z"
        fill="currentColor"
        fillOpacity="0.12"
      />
      {/* Borda do escudo */}
      <path
        d="M24 4C12 4 6 12 6 22v14c0 4 4 8 18 8s18-4 18-8V22C42 12 36 4 24 4z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        fill="none"
        opacity="0.4"
      />
      {/* Check (claim) */}
      <path
        d="M16 24l6 6 12-12"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Pequeno “+” ou ponto (airdrop) acima */}
      <circle cx="32" cy="14" r="2.5" fill="currentColor" opacity="0.9" />
    </svg>
  )
}
