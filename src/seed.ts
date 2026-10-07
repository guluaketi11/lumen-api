import bcrypt from 'bcryptjs';
import { InferCreationAttributes } from 'sequelize';
import { config } from './config';
import { sequelize } from './db';
import { Title } from './models/Title';
import { User } from './models/User';
import titles from './data/titles.json';

export const seed = async () => {
  if ((await User.count()) === 0) {
    await User.create({
      name: 'Demo Admin',
      email: config.adminEmail,
      passwordHash: await bcrypt.hash(config.adminPassword, 10),
      role: 'admin',
    });
  }
  if ((await Title.count()) === 0) {
    await Title.bulkCreate(titles as InferCreationAttributes<Title>[]);
  }
};

if (require.main === module) {
  sequelize
    .sync({ force: process.argv.includes('--reset') })
    .then(seed)
    .then(() => {
      console.log('Database seeded');
      return sequelize.close();
    });
}
