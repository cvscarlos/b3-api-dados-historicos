import path from 'node:path';
import { RAW_FILES_DIR } from './config';
import { downloader } from './downloader';

// Dados originados de:
// https://www.b3.com.br/pt_br/market-data-e-indices/servicos-de-dados/market-data/historico/boletins-diarios/pesquisa-por-pregao/pesquisa-por-pregao/

const filterDates = ['IN211202', 'IN231128'];

const tasks = Object.fromEntries(
  filterDates.map((fileKey) => {
    const url = `https://www.b3.com.br/pesquisapregao/download?filelist=${fileKey}.zip,`;
    const destinationFilePath = path.join(RAW_FILES_DIR, `${fileKey}.zip.zip`);
    return [fileKey, { url, destinationFilePath }];
  }),
);
downloader(tasks);
