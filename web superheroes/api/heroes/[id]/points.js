import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  const { method } = req;
  const { id } = req.query;

  if (method !== 'POST') return res.status(405).end();

  try {
    const { points, reason } = req.body;
    const date = new Date().toISOString().split('T')[0];

    await sql`UPDATE heroes SET points = points + ${points} WHERE id = ${id}`;
    await sql`INSERT INTO points_history (hero_id, points, reason, date) VALUES (${id}, ${points}, ${reason}, ${date})`;
    
    res.status(200).json({ success: true, points_added: points });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
