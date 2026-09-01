import { getXrplNetwork } from '@/lib/xrpl-server'

export function NetworkStatus() {
  const network = getXrplNetwork()
  const isTestnet = network === 'Testnet'

  return (
    <div
      className="network-chip inline-flex min-h-9 items-center gap-2 whitespace-nowrap px-2.5 font-mono text-[0.58rem] uppercase tracking-[0.14em] text-muted-foreground"
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
