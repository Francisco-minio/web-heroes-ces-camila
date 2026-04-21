import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  const { method } = req;
  const { id, action } = req.query;

  res.setHeader('Content-Type', 'application/json');

  // Función para mapear snake_case (DB) a camelCase (Frontend)
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
        if (id) {
          const { rows } = await sql`SELECT * FROM heroes WHERE id = ${id}`;
          if (rows[0]) {
            res.status(200).json(mapHero(rows[0]));
          } else {
            res.status(404).json({ error: 'Héroe no encontrado' });
          }
        } else {
          const { rows } = await sql`SELECT * FROM heroes ORDER BY points DESC, hero_name ASC`;
          res.status(200).json(rows.map(mapHero));
        }
        break;

      case 'POST':
        const body = req.body;
        if (id && action === 'points') {
          const points = parseInt(body.points);
          const reason = body.reason;
          const date = new Date().toISOString().split('T')[0];

          await sql`UPDATE heroes SET points = points + ${points} WHERE id = ${id}`;
          await sql`INSERT INTO points_history (hero_id, points, reason, date) VALUES (${id}, ${points}, ${reason}, ${date})`;
          
          res.status(200).json({ success: true, points_added: points });
        } else {
          const { realName, heroName, course, specialPower, username, password, avatar, points, streak } = body;
          
          const result = await sql`
            INSERT INTO heroes (real_name, hero_name, course_code, special_power, username, password, avatar, points, streak)
            VALUES (${realName}, ${heroName}, ${course}, ${specialPower}, ${username}, ${password}, ${avatar || '🦸'}, ${points || 0}, ${streak || 0})
            RETURNING id
          `;
          
          res.status(201).json({ id: result.rows[0].id, message: 'Héroe creado exitosamente' });
        }
        break;

      case 'PUT':
        if (!id) return res.status(400).json({ error: 'ID requerido' });
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
        
        res.status(200).json({ success: true, message: 'Héroe actualizado' });
        break;

      case 'DELETE':
        if (!id) return res.status(400).json({ error: 'ID requerido' });
        await sql`DELETE FROM heroes WHERE id = ${id}`;
        res.status(200).json({ success: true, message: 'Héroe eliminado' });
        break;

      default:
        res.status(405).end();
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Database Error', details: error.message });
  }
}
