import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDeletedAtToComments1782449000000 implements MigrationInterface {
  name = 'AddDeletedAtToComments1782449000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`comments\` ADD \`deletedAt\` datetime(6) NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`comments\` DROP COLUMN \`deletedAt\``,
    );
  }
}
