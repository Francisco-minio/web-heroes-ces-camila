import prisma from '../../lib/prisma';

export default async function handler(req, res) {
  try {
    const today = new Date();
    const currentHour = today.getHours();
    
    // 1. Obtener configuración dinámica
    let config = await prisma.systemConfig.findFirst({
      where: { id: 1 }
    });
    
    if (!config) {
      config = await prisma.systemConfig.create({ data: { id: 1 } });
    }

    // 2. Verificar si es la hora configurada (o si es una llamada manual)
    const isManual = req.headers['x-manual-trigger'] === 'true';
    
    if (!isManual) {
      if (currentHour !== config.cronHour) {
        return res.status(200).json({ skip: true, reason: 'No es la hora configurada' });
      }

      // 3. Verificar si ya se ejecutó hoy
      if (config.lastCronRun) {
        const lastRun = new Date(config.lastCronRun);
        if (lastRun.toDateString() === today.toDateString()) {
          return res.status(200).json({ skip: true, reason: 'Ya se ejecutó el día de hoy' });
        }
      }
    }

    const isSunday = today.getDay() === 0;
    
    // Cantidad desde configuración
    let amount = config.cronAmount;
    let reason = 'Asignación diaria automática (⚡)';

    if (isSunday) {
      amount += config.cronBonus;
      reason = 'Asignación semanal (⚡) + Diaria';
    }

    console.log(`Iniciando asignación automática de ${amount} rayos...`);

    const heroes = await prisma.hero.findMany();

    // Actualizar héroes e historial
    const updates = heroes.map(hero => {
      return prisma.hero.update({
        where: { id: hero.id },
        data: { 
          points: { increment: amount },
          streak: { increment: 1 },
          pointsHistory: {
            create: {
              points: amount,
              reason: reason,
              date: today
            }
          }
        }
      });
    });

    await Promise.all(updates);

    // Actualizar fecha de última ejecución
    await prisma.systemConfig.update({
      where: { id: 1 },
      data: { lastCronRun: today }
    });

    return res.status(200).json({ 
      success: true, 
      message: `Proceso completado: ${amount} rayos asignados a ${heroes.length} héroes.`,
      config
    });
  } catch (error) {
    console.error('Error en el proceso cron:', error);
    return res.status(500).json({ error: error.message });
  }
}
