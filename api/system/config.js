import prisma from '../../lib/prisma';

export default async function handler(req, res) {
  const { method } = req;

  try {
    if (method === 'GET') {
      let config = await prisma.systemConfig.findFirst({
        where: { id: 1 }
      });
      
      // Si no existe, crearlo con valores por defecto
      if (!config) {
        config = await prisma.systemConfig.create({
          data: { id: 1 }
        });
      }
      
      return res.status(200).json(config);
    }

    if (method === 'POST' || method === 'PUT') {
      const { cronAmount, cronHour, cronBonus } = req.body;
      
      if (cronAmount === undefined || cronHour === undefined) {
        return res.status(400).json({ error: 'Faltan campos obligatorios' });
      }

      const config = await prisma.systemConfig.upsert({
        where: { id: 1 },
        update: {
          cronAmount: Number(cronAmount),
          cronHour: Number(cronHour),
          cronBonus: Number(cronBonus || 0)
        },
        create: {
          id: 1,
          cronAmount: Number(cronAmount),
          cronHour: Number(cronHour),
          cronBonus: Number(cronBonus || 0)
        }
      });
      
      return res.status(200).json(config);
    }

    res.status(405).end();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
