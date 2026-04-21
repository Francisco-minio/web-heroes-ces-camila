import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  const { method } = req;
  const { id } = req.query;

  const mapHero = (hero) => ({
    id: hero.id,
    realName: hero.real_name,
    heroName: hero.hero_name,
    course: hero.course_code,
    specialPower: hero.special_power,
    username: hero.username,
    password: hero.password,
    avatar: hero.avatar,
    points: hero.points,
    streak: hero.streak,
    emojis: hero.emojis || [],
    medals: hero.medals || [],
    missions: hero.missions || []
  });

  try {
    switch (method) {
      case 'GET':
        const { rows } = await sql`SELECT * FROM heroes WHERE id = ${id}`;
        if (rows[0]) return res.status(200).json(mapHero(rows[0]));
        return res.status(404).json({ error: 'Not found' });

      case 'PUT':
        const updateData = req.body;
        await sql`
          UPDATE heroes 
          SET real_name = ${updateData.realName}, 
              hero_name = ${updateData.heroName}, 
              course_code = ${updateData.course}, 
              special_power = ${updateData.specialPower},
              points = ${updateData.points},
              streak = ${updateData.streak},
              emojis = ${JSON.stringify(updateData.emojis || [])},
              medals = ${JSON.stringify(updateData.medals || [])}
          WHERE id = ${id}
        `;
        return res.status(200).json({ success: true });

      case 'DELETE':
        await sql`DELETE FROM heroes WHERE id = ${id}`;
        return res.status(200).json({ success: true });

      default:
        res.status(405).end();
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
