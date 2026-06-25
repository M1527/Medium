import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1782293336320 implements MigrationInterface {
    name = 'Migration1782293336320'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`attachments\` (\`id\` varchar(36) NOT NULL, \`filename\` varchar(255) NOT NULL, \`path\` varchar(255) NOT NULL, \`contentType\` varchar(255) NOT NULL, \`size\` int NOT NULL, \`objectType\` varchar(255) NOT NULL, \`objectId\` varchar(255) NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE \`attachments\``);
    }

}
