import path from 'node:path';
import { TXT_DIR } from './config';
import { downloader } from './downloader';

const xyz = ['SPRE231127'];

const tasks = Object.fromEntries(
  xyz.map((date) => {
    const url = `https://www.b3.com.br/pesquisapregao/download?filelist=${date}.zip,`;
    const destinationFilePath = path.join(TXT_DIR, `${date}.zip.zip`);
    return [date, { url, destinationFilePath }];
  }),
);
downloader(tasks);
