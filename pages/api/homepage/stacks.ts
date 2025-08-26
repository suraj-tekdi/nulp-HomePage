import type { NextApiRequest, NextApiResponse } from 'next';

const CMS_API_BASE_URL = process.env.CMS_API_BASE_URL;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    const upstream = await fetch(`${CMS_API_BASE_URL}/api/v1/homepage/stacks`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    const text = await upstream.text();

    res.status(upstream.status);
    try {
      const json = JSON.parse(text);
      return res.json(json);
    } catch {
      res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json');
      return res.send(text);
    }
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error?.message || 'Internal Server Error' });
  }
} 