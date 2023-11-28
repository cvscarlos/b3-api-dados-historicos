import fs from 'node:fs';
import decompress from 'decompress';
import axios from 'axios';
import { TXT_DIR } from './config';
import { logError, logInfo } from './logger';

const zipExtensionRegex = /\.zip$/i;

async function downloadFile(
  url: string,
  destinationFilePath: string,
  taskId: string,
) {
  logInfo(`[${taskId}] Downloading zip file...`);
  const response = await axios({ method: 'get', url, responseType: 'stream' });

  logInfo(`[${taskId}] Starting write stream...`);
  if (!(response?.data && isStream(response.data)))
    throw new Error(`Response data is not a stream`);

  const writer = fs.createWriteStream(destinationFilePath);
  response.data.pipe(writer);

  await new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });

  logInfo(`[${taskId}] Zip file downloaded successfully`);

  await decompress(destinationFilePath, TXT_DIR);
  fs.unlinkSync(destinationFilePath);

  const secondaryFilePath = destinationFilePath.replace(zipExtensionRegex, '');
  if (fs.existsSync(secondaryFilePath)) {
    await decompress(secondaryFilePath, TXT_DIR);
    fs.unlinkSync(secondaryFilePath);
  }

  logInfo(`[${taskId}] Zip file extracted successfully`);
}

function isStream(data: unknown): data is NodeJS.ReadableStream {
  return Boolean(
    data && typeof (data as Record<string, unknown>).pipe === 'function',
  );
}

function dontStopIfError(error: Error, date: string) {
  logError(`[${date}] ${String(error)}`);
}

export function downloader(tasks: {
  [taskId: string]: { url: string; destinationFilePath: string };
}) {
  Promise.all(
    Object.entries(tasks).map(([taskId, { url, destinationFilePath }]) =>
      downloadFile(url, destinationFilePath, taskId).catch((e) =>
        dontStopIfError(e, taskId),
      ),
    ),
  )
    .then(() => {
      logInfo('All files downloaded successfully');
      process.exit(0);
    })
    .catch((e) => {
      logError(e);
      process.exit(1);
    });
}
