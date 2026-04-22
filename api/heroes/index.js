import prisma from '../../lib/prisma';

export default async function handler(req, res) {
  const { method } = req;

  try {
    if (method === 'GET') {
      const heroes = await prisma.hero.findMany({
        orderBy: [
          { points: 'desc' },
          { heroName: 'asc' }
        ]
      });
      return res.status(200).json(heroes);
    }

    if (method === 'POST') {
      const { realName, heroName, course, specialPower, username, password, avatar } = req.body;
      const newHero = await prisma.hero.create({
        data: {
          realName,
          heroName,
          courseCode: course,
          specialPower,
          username,
          password,
          avatar: avatar || '🦸'
        }
      });
      return res.status(201).json({ id: newHero.id, message: 'Creado' });
    }

    res.status(405).end();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
