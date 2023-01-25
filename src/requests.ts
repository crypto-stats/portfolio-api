import { NextApiRequest, NextApiResponse } from 'next'

export function wrapHandler(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>,
  { allowedMethods, cacheLength, serverCacheLength }: { allowedMethods?: string[], cacheLength?: number, serverCacheLength?: number } = {}
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept, Authorization'
      )
      if (req.method == 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE, GET')
        return res.status(200).json({})
      }

      if (allowedMethods && allowedMethods.indexOf(req.method!) === -1) {
        return res.status(400).json({ error: `Only ${allowedMethods.join(', ')} methods allowed`})
      }

      if (cacheLength) {
        res.setHeader('Cache-Control', `max-age=${cacheLength}, s-maxage=${serverCacheLength || cacheLength}, stale-while-revalidate`);
      }

      await handler(req, res)
    } catch (err: any) {
      res.status(500).json({ statusCode: 500, message: err.message })
    }
  }
}
