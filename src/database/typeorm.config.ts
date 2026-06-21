import { join } from 'path';
import { type DataSourceOptions } from 'typeorm';
import { User } from '../users/entities/user.entitiy';

export function createTypeOrmOptions(): DataSourceOptions {
  return {
    type: 'mysql',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    entities: [User],
    migrations: [join(__dirname, 'migrations/*{.ts,.js}')],
    synchronize: false,
    migrationsRun: false,
  };
}
