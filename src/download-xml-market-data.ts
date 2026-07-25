import path from 'node:path';
import { RAW_FILES_DIR } from './config';
import { downloader } from './downloader';

// Dados originados de:
// https://www.b3.com.br/pt_br/market-data-e-indices/servicos-de-dados/market-data/historico/boletins-diarios/pesquisa-por-pregao/pesquisa-por-pregao/

// O boletim de instrumentos é um retrato completo (UpdTp COMP) do dia, então um
// único arquivo já traz todos os instrumentos listados — não há necessidade de
// acumular vários dias. Como só existe boletim em dia de pregão, tentamos os
// últimos dias e paramos no primeiro que realmente vier com conteúdo.
const LOOKBACK_DAYS = 5;

const dateNow = Date.now();
const lastDaysArray = Array.from({ length: LOOKBACK_DAYS }, (_, i) => {
  const date = new Date(dateNow);
  date.setDate(date.getDate() - i);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear().toString().slice(-2);
  return `IN${year}${month}${day}`;
});

const tasks = Object.fromEntries(
  lastDaysArray.map((fileKey) => {
    const url = `https://www.b3.com.br/pesquisapregao/download?filelist=${fileKey}.zip,`;
    const destinationFilePath = path.join(RAW_FILES_DIR, `${fileKey}.zip.zip`);
    return [fileKey, { url, destinationFilePath }];
  }),
);
downloader(tasks, { stopOnFirstSuccess: true });
