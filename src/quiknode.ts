import { JsonRpcProvider } from "@ethersproject/providers"

const rpc = `https://special-wiser-pond.discover.quiknode.pro/${process.env.QUIKNODE_KEY}/`

export interface Asset {
  address: string
  name: string
  decimals: number
  symbol: string
  // logoURI: string
  chain: string
  network: string
  totalBalance: string
}

interface Page {
  result: any[]
  // owner: string
  totalPages: number
  totalItems: number
  pageNumber: number
}

export async function getBalances(address: string): Promise<Asset[]> {
  const { result: firstPage, totalPages } = await getBalancePage(address)

  const additionalPagePromises: Promise<Page>[] = []
  for (let i = 2; i < totalPages; i += 1) {
    additionalPagePromises.push(getBalancePage(address, i))
  }
  const additionalPageResults = await Promise.all(additionalPagePromises)

  return [...firstPage, ...additionalPageResults.map(page => page.result).flat()]
}

async function getBalancePage(address: string, page?: number): Promise<Page> {
  const qnRes = await fetch(rpc, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      id: 67,
      jsonrpc: "2.0",
      method: "qn_getWalletTokenBalance",
      params: [{
        wallet: address,
        perPage: 100,
        page,
      }],
    })
  });
  const result = await qnRes.json()

  if (result.error) {
    throw new Error(result.error.message)
  }

  return result.result
}

export const getETHBalance = (address: string) => new JsonRpcProvider(rpc).getBalance(address)
