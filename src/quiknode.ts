export interface Asset {
  address: string
  name: string
  decimals: number
  symbol: string
  logoURI: string
  chain: string
  network: string
  amount: string
}

interface Page {
  assets: any[]
  owner: string
  totalPages: number
  totalItems: number
  pageNumber: number
}

export async function getBalances(address: string): Promise<Asset[]> {
  const { assets: firstPage, totalPages } = await getBalancePage(address)

  const additionalPagePromises: Promise<Page>[] = []
  for (let i = 2; i < totalPages; i += 1) {
    additionalPagePromises.push(getBalancePage(address, i))
  }
  const additionalPageResults = await Promise.all(additionalPagePromises)

  return [...firstPage, ...additionalPageResults.map(page => page.assets).flat()]
}

async function getBalancePage(address: string, page?: number): Promise<Page> {
  const qnRes = await fetch(`https://special-wiser-pond.discover.quiknode.pro/${process.env.QUIKNODE_KEY}/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      id: 67,
      jsonrpc: "2.0",
      method: "qn_getWalletTokenBalance",
      params: {
        wallet: address,
        perPage: 100,
        page,
      },
    })
  });
  const result = await qnRes.json()

  return result.result
}
