import { Sequelize } from 'sequelize';
import { config } from './config';

export const sequelize = config.databaseUrl
  ? new Sequelize(config.databaseUrl, {
      dialect: 'postgres',
      logging: false,
      dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
    })
  : new Sequelize({ dialect: 'sqlite', storage: config.sqliteStorage, logging: false });
