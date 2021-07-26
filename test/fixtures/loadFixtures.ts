import { Connection } from 'typeorm';

import * as fs from 'fs';
import * as path from 'path';

export default async (connectionObject: Connection, filename: string) => {
  const file = fs.readFileSync(path.join(__dirname, filename), 'utf-8');

  const queryRunner = connectionObject.driver.createQueryRunner('master');

  for (const line of file.split(';')) {
    await queryRunner.query(line);
  }
};
