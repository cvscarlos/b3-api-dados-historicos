import path from 'node:path';
import { RAW_FILES_DIR } from './config';
import { downloader } from './downloader';

const dateNow = Date.now();
const last5DaysArray = Array.from({ length: 5 }, (_, i) => {
  const date = new Date(dateNow);
  date.setDate(date.getDate() - i);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `D${day}${month}${year}`;
});

const tasks = Object.fromEntries(
  last5DaysArray.map((date) => {
    const url = `https://bvmf.bmfbovespa.com.br/InstDados/SerHist/COTAHIST_${date}.ZIP`;
    const destinationFilePath = path.join(
      RAW_FILES_DIR,
      `COTAHIST_${date}.ZIP`,
    );
    return [date, { url, destinationFilePath }];
  }),
);
downloader(tasks);
