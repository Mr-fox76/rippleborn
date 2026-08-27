'use client'

import { useState } from 'react'
import { Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * UI only. No wallet SDK is wired up yet, so this just reflects intent
 * and tells the user to paste an address for now.
 */
export function ConnectWalletButton() {
  const [notice, setNotice] = useState(false)

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setNotice(true)}
        className="border-primary/40 bg-transparent text-primary hover:bg-primary/10 hover:text-primary"
      >
        <Wallet className="size-4" aria-hidden="true" />
        Connect wallet
      </Button>

      {notice ? (
        <p role="status" className="font-mono text-xs text-muted-foreground">
          Coming soon — paste your address below.
        </p>
      ) : null}
    </div>
  )
}
