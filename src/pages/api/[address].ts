import { getBalances } from '@/quiknode'
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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Portfolio>
) {
  const balances = await getBalances(req.query.address as string)

  const queries = balances.map((asset: any) => `ethereum:${asset.address}`)

  const priceReq = await fetch(`https://coins.llama.fi/prices/current/${queries}`)
  const prices = await priceReq.json()

  const holdings: Holding[] = []
  let netValue = 0
  const tokensByAddress = new Set<string>()

  for (const asset of balances) {
    if (!tokensByAddress.has(asset.address)) {
      tokensByAddress.add(asset.address)

      const amount = parseInt(asset.amount) / (10 ** asset.decimals)
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

  res.status(200).json({
    holdings,
    netValue,
  })
}
