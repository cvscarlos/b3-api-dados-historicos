import path from 'node:path';

export const DOCS_DIR = path.resolve(__dirname, '../docs');
export const RAW_FILES_DIR = path.join(DOCS_DIR, '/b3-raw-files');
export const PARSED_RAW_FILES_DIR = path.join(
  DOCS_DIR,
  '/b3-raw-files/parsed-files',
);
