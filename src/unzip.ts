import fs from 'node:fs';
import decompress from 'decompress';
import { RAW_FILES_DIR } from './config';
import { getFirstAvailabeFile } from './parser-utils';
import { logError, logInfo } from './logger';

async function unzip(): Promise<boolean> {
  const { filePath } = getFirstAvailabeFile('.ZIP');
  if (!filePath) return false;

  await decompress(filePath, RAW_FILES_DIR);
  fs.unlinkSync(filePath);
  logInfo(`Unzipped and removed file: ${filePath}`);
  return true;
}

function main() {
  unzip()
    .then((result) => {
      if (result) main();
      else process.exit(0);
    })
    .catch((error) => {
      logError('Error during unzipping:', error);
      process.exit(1);
    });
}

main();
