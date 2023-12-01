import path from 'node:path';
import { RAW_FILES_DIR } from './config';
import { downloader } from './downloader';

const xyz = ['IN231128'];

const tasks = Object.fromEntries(
  xyz.map((fileKey) => {
    const url = `https://www.b3.com.br/pesquisapregao/download?filelist=${fileKey}.zip,`;
    const destinationFilePath = path.join(RAW_FILES_DIR, `${fileKey}.zip.zip`);
    return [fileKey, { url, destinationFilePath }];
  }),
);
downloader(tasks);
