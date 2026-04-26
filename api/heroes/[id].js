import prisma from '../../lib/prisma';

export default async function handler(req, res) {
  const { method } = req;
  const { id } = req.query;
  const heroId = parseInt(id);

  try {
    switch (method) {
      case 'GET':
        const hero = await prisma.hero.findUnique({
          where: { id: heroId },
          include: { pointsHistory: true }
        });
        if (hero) return res.status(200).json(hero);
        return res.status(404).json({ error: 'Not found' });

      case 'PUT':
        const { realName, heroName, course, specialPower, points, streak, emojis, medals } = req.body;
        await prisma.hero.update({
          where: { id: heroId },
          data: {
            realName,
            heroName,
            courseCode: course,
            specialPower,
            points,
            streak,
            emojis: emojis || undefined,
            medals: medals || undefined,
            pointsHistory: req.body.pointsHistory
          }
        });
        return res.status(200).json({ success: true });

      case 'DELETE':
        await prisma.hero.delete({
          where: { id: heroId }
        });
        return res.status(200).json({ success: true });

      default:
        res.status(405).end();
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
