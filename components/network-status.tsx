import { getXrplNetwork } from '@/lib/xrpl-server'

export function NetworkStatus() {
  const network = getXrplNetwork()
  const isTestnet = network === 'Testnet'

  return (
    <div
      className="interface-chip inline-flex items-center gap-1.5 whitespace-nowrap border border-border px-2 py-1.5 font-mono text-[0.62rem] uppercase tracking-[0.12em] text-foreground sm:gap-2 sm:px-3 sm:text-[0.7rem] sm:tracking-[0.16em]"
      aria-label={`XRPL network: ${network}`}
      title={`Connected to XRPL ${network}`}
    >
      <span
        className={`size-2 rounded-full ${isTestnet ? 'bg-gold' : 'bg-primary'}`}
        aria-hidden="true"
      />
      XRPL {network}
    </div>
  )
}
