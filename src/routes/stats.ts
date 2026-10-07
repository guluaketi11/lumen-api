import { Router } from 'express';
import { fn, col } from 'sequelize';
import { Title } from '../models/Title';

export const statsRouter = Router();

statsRouter.get('/', async (_req, res) => {
  const [byGenre, byStatus, totals] = await Promise.all([
    Title.findAll({
      attributes: ['genre', [fn('COUNT', col('id')), 'titles'], [fn('SUM', col('views')), 'views']],
      group: ['genre'],
      order: [[fn('SUM', col('views')), 'DESC']],
      raw: true,
    }),
    Title.findAll({
      attributes: ['status', [fn('COUNT', col('id')), 'titles']],
      group: ['status'],
      raw: true,
    }),
    Title.findOne({
      attributes: [
        [fn('COUNT', col('id')), 'titles'],
        [fn('SUM', col('views')), 'views'],
      ],
      raw: true,
    }),
  ]);

  const toNumber = (value: unknown) => Number(value ?? 0);
  const total = totals as unknown as { titles: unknown; views: unknown } | null;

  res.json({
    data: {
      titles: toNumber(total?.titles),
      views: toNumber(total?.views),
      byGenre: (byGenre as unknown as Record<string, unknown>[]).map((row) => ({
        genre: row.genre,
        titles: toNumber(row.titles),
        views: toNumber(row.views),
      })),
      byStatus: (byStatus as unknown as Record<string, unknown>[]).map((row) => ({
        status: row.status,
        titles: toNumber(row.titles),
      })),
    },
  });
});
