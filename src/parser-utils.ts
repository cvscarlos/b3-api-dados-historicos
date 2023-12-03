import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { DOCS_DIR } from './config';
import { logError } from './logger';
import { ApiBody, TickerDateRange } from './types';

export function getFirstAvailabeFile(filterBy: string) {
  const dir = path.join(DOCS_DIR, '/b3-raw-files');
  const files = readdirSync(dir);
  const foundFile = files.find((file) => file.endsWith(filterBy));
  const filePath = foundFile ? path.join(dir, foundFile) : null;
  return { filePath, filename: foundFile };
}

export function writeToFile<
  T extends Record<string, TickerDateRange & Record<string, unknown>>,
>(filePath: string, newData: T) {
  const currentApiData = jsonParse(
    readFileSync(path.join(DOCS_DIR, filePath), 'utf8'),
  );

  const data = currentApiData.data as T;
  Object.keys(newData).forEach((key) => {
    const newItem = newData[key];
    if (!data[key]) (data as Record<string, unknown>)[key] = newItem;

    const item = data[key];
    item.dataMax = Math.max(item?.dataMax || 0, newItem.dataMax);
    item.dataMin = Math.min(item?.dataMin || 99_999_999, newItem.dataMin);
  });

  const sorted = Object.entries(data).sort();
  const sortedData = Object.fromEntries(sorted);

  writeFileSync(
    path.join(DOCS_DIR, filePath),
    JSON.stringify({ data: sortedData }, null, 2),
  );
}

function jsonParse(data: string): ApiBody {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const json = JSON.parse(data) as Record<string, any>;
    if (!json.data) json.data = {};
    return json;
  } catch (error) {
    logError(error);
    return { data: {} };
  }
}
