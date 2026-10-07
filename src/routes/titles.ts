import { Router } from 'express';
import { Op, WhereOptions } from 'sequelize';
import { notFound } from '../errors';
import { requireAuth, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { sequelize } from '../db';
import { Title } from '../models/Title';
import { titleQuerySchema, titleSchema, titleUpdateSchema } from '../schemas';

export const titlesRouter = Router();

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_-]+/g, '-');

const findTitle = async (id: unknown) => {
  const title = await Title.findByPk(Number(id));
  if (!title) throw notFound('Title');
  return title;
};

titlesRouter.get('/', validate(titleQuerySchema, 'query'), async (_req, res) => {
  const { search, genre, status, sort, page, limit } = res.locals.query;
  const like = sequelize.getDialect() === 'postgres' ? Op.iLike : Op.like;

  const where: WhereOptions<Title> = {
    ...(genre && { genre }),
    ...(status && { status }),
    ...(search && {
      [Op.or]: [{ title: { [like]: `%${search}%` } }, { description: { [like]: `%${search}%` } }],
    }),
  };

  const field = sort.replace('-', '');
  const direction = sort.startsWith('-') ? 'DESC' : 'ASC';

  const { rows, count } = await Title.findAndCountAll({
    where,
    order: [[field, direction]],
    limit,
    offset: (page - 1) * limit,
  });

  res.json({ data: rows, meta: { page, limit, total: count, pages: Math.ceil(count / limit) } });
});

titlesRouter.get('/:id', async (req, res) => {
  res.json({ data: await findTitle(req.params.id) });
});

titlesRouter.post('/', requireAuth, validate(titleSchema), async (req, res) => {
  const title = await Title.create({ ...req.body, slug: slugify(req.body.title) });
  res.status(201).json({ data: title });
});

titlesRouter.patch('/:id', requireAuth, validate(titleUpdateSchema), async (req, res) => {
  const title = await findTitle(req.params.id);
  const changes = req.body.title ? { ...req.body, slug: slugify(req.body.title) } : req.body;
  await title.update(changes);
  res.json({ data: title });
});

titlesRouter.delete('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  const title = await findTitle(req.params.id);
  await title.destroy();
  res.status(204).end();
});
