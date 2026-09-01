export const COLLECTION_REFRESH_EVENT = 'ledgerborn:collection-refresh'

export function requestCollectionRefresh(account: string) {
  window.dispatchEvent(
    new CustomEvent(COLLECTION_REFRESH_EVENT, {
      detail: { account },
    }),
  )
}
