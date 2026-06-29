import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUsersFollowingUsersTable1782694501753 implements MigrationInterface {
    name = 'CreateUsersFollowingUsersTable1782694501753'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`users_following_users\` (\`followerId\` int NOT NULL, \`followingId\` int NOT NULL, INDEX \`IDX_a091881d922dd727e9a7a09f8c\` (\`followerId\`), INDEX \`IDX_046fdb1e8073fb66eb46478636\` (\`followingId\`), PRIMARY KEY (\`followerId\`, \`followingId\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`users_following_users\` ADD CONSTRAINT \`FK_a091881d922dd727e9a7a09f8c8\` FOREIGN KEY (\`followerId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`users_following_users\` ADD CONSTRAINT \`FK_046fdb1e8073fb66eb46478636e\` FOREIGN KEY (\`followingId\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`users_following_users\` DROP FOREIGN KEY \`FK_046fdb1e8073fb66eb46478636e\``);
        await queryRunner.query(`ALTER TABLE \`users_following_users\` DROP FOREIGN KEY \`FK_a091881d922dd727e9a7a09f8c8\``);
        await queryRunner.query(`DROP INDEX \`IDX_046fdb1e8073fb66eb46478636\` ON \`users_following_users\``);
        await queryRunner.query(`DROP INDEX \`IDX_a091881d922dd727e9a7a09f8c\` ON \`users_following_users\``);
        await queryRunner.query(`DROP TABLE \`users_following_users\``);
    }

}
