import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsersFavoriteArticlesTable1782465821873 implements MigrationInterface {
  name = 'CreateUsersFavoriteArticlesTable1782465821873';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`users_favorite_articles\` (\`userId\` int NOT NULL, \`articleId\` int NOT NULL, INDEX \`IDX_users_favorite_articles_user\` (\`userId\`), INDEX \`IDX_users_favorite_articles_article\` (\`articleId\`), PRIMARY KEY (\`userId\`, \`articleId\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`users_favorite_articles\` ADD CONSTRAINT \`FK_users_favorite_articles_user\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE \`users_favorite_articles\` ADD CONSTRAINT \`FK_users_favorite_articles_article\` FOREIGN KEY (\`articleId\`) REFERENCES \`articles\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`users_favorite_articles\` DROP FOREIGN KEY \`FK_users_favorite_articles_article\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`users_favorite_articles\` DROP FOREIGN KEY \`FK_users_favorite_articles_user\``,
    );
    await queryRunner.query(`DROP TABLE \`users_favorite_articles\``);
  }
}
