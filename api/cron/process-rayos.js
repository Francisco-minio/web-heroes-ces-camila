import prisma from '../../lib/prisma';

export default async function handler(req, res) {
  // Opcional: Verificar secreto para que solo Vercel pueda llamarlo
  // const authHeader = req.headers.authorization;
  // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  //   return res.status(401).json({ error: 'Unauthorized' });
  // }

  try {
    const today = new Date();
    const isSunday = today.getDay() === 0; // 0 is Sunday
    
    // Cantidad base: 1 rayo diario
    let amount = 1;
    let reason = 'Asignación diaria automática (⚡)';

    // Si es domingo, sumar 3 más
    if (isSunday) {
      amount += 3;
      reason = 'Asignación semanal (⚡) + Diaria';
    }

    console.log(`Iniciando asignación automática de ${amount} rayos...`);

    // Obtener todos los héroes
    const heroes = await prisma.hero.findMany();

    // Realizar actualizaciones en una transacción
    const updates = heroes.map(hero => {
      return prisma.$transaction([
        prisma.hero.update({
          where: { id: hero.id },
          data: { 
            points: { increment: amount },
            streak: { increment: 1 }
          }
        }),
        prisma.pointHistory.create({
          data: {
            heroId: hero.id,
            points: amount,
            reason: reason,
            date: today
          }
        })
      ]);
    });

    await Promise.all(updates);

    return res.status(200).json({ 
      success: true, 
      message: `Proceso completado: ${amount} rayos asignados a ${heroes.length} héroes.`,
      isSunday
    });
  } catch (error) {
    console.error('Error en el proceso cron:', error);
    return res.status(500).json({ error: error.message });
  }
}
