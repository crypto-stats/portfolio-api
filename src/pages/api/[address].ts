import { getBalances, getETHBalance } from '@/quiknode'
import { wrapHandler } from '@/requests'
import type { NextApiRequest, NextApiResponse } from 'next'


interface Portfolio {
  netValue: number
  holdings: Holding[]
}

interface Holding {
  address: string
  name: string
  symbol: string
  amount: number
  price: number
  value: number
}

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Portfolio>
) {
  const balances = await getBalances(req.query.address as string)
  const ethBalance = await getETHBalance(req.query.address as string)

  if (ethBalance.toString() !== '0') {
    balances.push({
      address: '0x0000000000000000000000000000000000000000',
      name: 'Ether',
      decimals: 18,
      symbol: 'ETH',
      chain: 'ETH',
      network: 'mainnet',
      totalBalance: ethBalance.toString()
    })
  }

  const queries = balances.map((asset: any) => `ethereum:${asset.address}`)

  const priceReq = await fetch(`https://coins.llama.fi/prices/current/${queries}`)
  const prices = await priceReq.json()

  const holdings: Holding[] = []
  let netValue = 0
  const tokensByAddress = new Set<string>()

  for (const asset of balances) {
    if (!tokensByAddress.has(asset.address)) {
      tokensByAddress.add(asset.address)

      const amount = parseInt(asset.totalBalance) / (10 ** asset.decimals)
      const price = prices.coins[`ethereum:${asset.address}`]?.price
      if (price) {
        const value = amount * price
        holdings.push({
          address: asset.address,
          name: asset.name,
          symbol: asset.symbol,
          amount,
          price,
          value
        })
        netValue += value
      }
    }
  }

  res.json({
    holdings,
    netValue,
  })
}

export default wrapHandler(handler, { cacheLength: 60 * 60 })
