import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  const { method } = req;
  const { id } = req.query;
  const heroId = parseInt(id);

  if (method === 'POST') {
    const { points, reason } = req.body;
    try {
      // 1. Actualizar puntos del héroe
      const updatedHero = await prisma.hero.update({
        where: { id: heroId },
        data: {
          points: { increment: points },
          streak: { increment: 1 }
        }
      });

      // 2. Registrar en el historial
      await prisma.pointHistory.create({
        data: {
          heroId: heroId,
          points: points,
          reason: reason,
          date: new Date()
        }
      });

      return res.status(200).json({ success: true, points_added: points });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  res.status(405).end();
}
