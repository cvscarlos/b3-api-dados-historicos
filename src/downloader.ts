import fs from 'node:fs';
import decompress from 'decompress';
import axios from 'axios';
import { RAW_FILES_DIR } from './config';
import { logError, logInfo } from './logger';

const zipExtensionRegex = /\.zip$/i;

async function downloadFile(
  url: string,
  destinationFilePath: string,
  taskId: string,
) {
  logInfo(`[${taskId}] Downloading zip file...`, url);
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

  await decompress(destinationFilePath, RAW_FILES_DIR);
  fs.unlinkSync(destinationFilePath);

  const secondaryFilePath = destinationFilePath.replace(zipExtensionRegex, '');
  if (fs.existsSync(secondaryFilePath)) {
    await decompress(secondaryFilePath, RAW_FILES_DIR);
    fs.unlinkSync(secondaryFilePath);
  }

  const thirdFilePath = secondaryFilePath.replace(zipExtensionRegex, '');
  if (
    fs.existsSync(thirdFilePath) &&
    fs.lstatSync(thirdFilePath).isDirectory()
  ) {
    fs.readdirSync(thirdFilePath).forEach((file) => {
      fs.renameSync(`${thirdFilePath}/${file}`, `${RAW_FILES_DIR}/${file}`);
    });
    fs.rmdirSync(thirdFilePath);
  }

  logInfo(`[${taskId}] Zip file extracted successfully`);
}

function isStream(data: unknown): data is NodeJS.ReadableStream {
  return Boolean(
    data && typeof (data as Record<string, unknown>).pipe === 'function',
  );
}

function doNotStopIfError(error: Error, date: string) {
  logError(`[${date}] ${String(error)}`);
}

export function downloader(tasks: {
  [taskId: string]: { url: string; destinationFilePath: string };
}) {
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  (async () => {
    try {
      // eslint-disable-next-line no-restricted-syntax
      for await (const task of Object.entries(tasks)) {
        const [taskId, { url, destinationFilePath }] = task;
        await downloadFile(url, destinationFilePath, taskId).catch((e) =>
          doNotStopIfError(e, taskId),
        );
      }
    } catch (error) {
      logError(error);
    } finally {
      process.exit(0);
    }
  })();
}
