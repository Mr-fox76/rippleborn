import { getXrplNetwork } from '@/lib/xrpl-server'

export function NetworkStatus() {
  const network = getXrplNetwork()
  const isTestnet = network === 'Testnet'

  return (
    <div
      className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1.5 font-mono text-[0.7rem] uppercase tracking-[0.16em] text-foreground"
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
