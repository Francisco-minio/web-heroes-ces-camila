import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  const { method } = req;
  const { id } = req.query; // En caso de que se pase como query param

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
    if (method === 'GET') {
      if (id) {
        const { rows } = await sql`SELECT * FROM heroes WHERE id = ${id}`;
        if (rows[0]) return res.status(200).json(mapHero(rows[0]));
        return res.status(404).json({ error: 'Not found' });
      }
      const { rows } = await sql`SELECT * FROM heroes ORDER BY points DESC, hero_name ASC`;
      return res.status(200).json(rows.map(mapHero));
    }

    if (method === 'POST') {
      const { realName, heroName, course, specialPower, username, password, avatar } = req.body;
      const result = await sql`
        INSERT INTO heroes (real_name, hero_name, course_code, special_power, username, password, avatar)
        VALUES (${realName}, ${heroName}, ${course}, ${specialPower}, ${username}, ${password}, ${avatar || '遗传'})
        RETURNING id
      `;
      return res.status(201).json({ id: result.rows[0].id, message: 'Creado' });
    }

    res.status(405).end();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
