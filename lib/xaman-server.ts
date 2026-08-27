import 'server-only'

import { XummSdk } from 'xumm-sdk'

function requiredEnvironmentValue(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`${name} is not configured.`)
  return value
}

export function getXamanSdk(): XummSdk {
  return new XummSdk(
    requiredEnvironmentValue('XAMAN_API_KEY'),
    requiredEnvironmentValue('XAMAN_API_SECRET'),
  )
}

export function isHex256(value: unknown): value is string {
  return typeof value === 'string' && /^[A-Fa-f0-9]{64}$/.test(value)
}
