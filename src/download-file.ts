import fs from 'node:fs';
import path from 'node:path';
import unzipper from 'unzipper';
import axios from 'axios';
import { TXT_DIR } from './config';
import { logError, logInfo } from './logger';

async function downloadFile(date: string) {
  const url = `https://bvmf.bmfbovespa.com.br/InstDados/SerHist/COTAHIST_${date}.ZIP`;

  const downloadedFile = path.join(TXT_DIR, `COTAHIST_${date}.ZIP`);

  let response = null;
  try {
    logInfo(`[${date}] Downloading zip file...`);
    response = await axios({ method: 'get', url, responseType: 'stream' });
  } catch (error) {
    logError(`[${date}] ${String(error)}`);
    return;
  }

  logInfo(`[${date}] Starting write stream...`);
  if (!(response?.data && isStream(response.data)))
    throw new Error(`[${date}] Response data is not a stream`);

  const writer = fs.createWriteStream(downloadedFile);
  response.data.pipe(writer);

  await new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });

  logInfo(`[${date}] Zip file downloaded successfully`);

  const unzipPath = path.join(TXT_DIR);
  await fs
    .createReadStream(downloadedFile)
    .pipe(unzipper.Extract({ path: unzipPath }))
    .promise();
  logInfo(`[${date}] Zip file extracted successfully`);

  fs.unlinkSync(downloadedFile);
}

function isStream(data: unknown): data is NodeJS.ReadableStream {
  return Boolean(
    data && typeof (data as Record<string, unknown>).pipe === 'function',
  );
}

const dateNow = Date.now();
const last60DaysArray = Array.from({ length: 60 }, (_, i) => {
  const date = new Date(dateNow);
  date.setDate(date.getDate() - i);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `D${day}${month}${year}`;
});

Promise.all(last60DaysArray.map((d) => downloadFile(d))).catch((error) => {
  logError(String(error));
  process.exit(1);
});
