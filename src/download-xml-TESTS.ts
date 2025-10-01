/* eslint-disable */

import path from 'node:path';
import axios from 'axios';
import { RAW_FILES_DIR } from './config';
import { downloader } from './downloader';

// Dados originados de:
// https://www.b3.com.br/pt_br/market-data-e-indices/servicos-de-dados/market-data/historico/boletins-diarios/pesquisa-por-pregao/pesquisa-por-pregao/

const filterDates = ['IN250801', 'IN250801'];

async function main() {
  // console log HTML page
  const { data } = await axios.get<string>(
    'https://www.b3.com.br/pt_br/market-data-e-indices/servicos-de-dados/market-data/historico/boletins-diarios/pesquisa-por-pregao/pesquisa-por-pregao/',
  );
  // console.log(data.match(/SPRE{YYMMDD}\.zip/g));
  // console.log(data.match(/name='[\dA-Z]+\.date']"\)\.val\('(\d+\/\d+\/\d+)'/g));

  const fieldId = data.match(
    /id="([\dA-Z]+)" name="[\dA-Z]+" value="SPRE{YYMMDD}\.zip/,
  )?.[1];
  const dateRegex = new RegExp(
    String.raw`name='${fieldId}\.date']"\)\.val\('(\d+\/\d+\/\d+)'`,
  );

  // console.log(dateRegex, data.match(dateRegex)[1]);
}

main()
  .then(() => console.info('Done'))
  .catch((error) => console.error(error));

// const tasks = Object.fromEntries(
//   filterDates.map((fileKey) => {
//     const url = `https://www.b3.com.br/pesquisapregao/download?filelist=${fileKey}.zip,`;
//     const destinationFilePath = path.join(RAW_FILES_DIR, `${fileKey}.zip.zip`);
//     return [fileKey, { url, destinationFilePath }];
//   }),
// );
// downloader(tasks);
