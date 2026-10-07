import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from 'sequelize';
import { sequelize } from '../db';

export class Title extends Model<InferAttributes<Title>, InferCreationAttributes<Title>> {
  declare id: CreationOptional<number>;
  declare slug: string;
  declare title: string;
  declare year: number;
  declare genre: string;
  declare durationMinutes: number;
  declare description: string;
  declare streamUrl: string;
  declare status: CreationOptional<'published' | 'draft' | 'archived'>;
  declare views: CreationOptional<number>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Title.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    slug: { type: DataTypes.STRING(120), allowNull: false, unique: true },
    title: { type: DataTypes.STRING(160), allowNull: false },
    year: { type: DataTypes.INTEGER, allowNull: false },
    genre: { type: DataTypes.STRING(60), allowNull: false },
    durationMinutes: { type: DataTypes.INTEGER, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false },
    streamUrl: { type: DataTypes.STRING(500), allowNull: false },
    status: { type: DataTypes.ENUM('published', 'draft', 'archived'), allowNull: false, defaultValue: 'draft' },
    views: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  { sequelize, tableName: 'titles', indexes: [{ fields: ['genre'] }, { fields: ['status'] }] },
);
