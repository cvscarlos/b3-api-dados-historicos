import { createReadStream, renameSync } from 'node:fs';
import { createInterface } from 'node:readline';
import path from 'node:path';
import { PARSED_RAW_FILES_DIR } from './config';
import { logInfo } from './logger';
import { getFirstAvailabeFile, writeToFile } from './parser-utils';
import { TickerDateRange } from './types';

type TickerCashApi = {
  codNeg: string;
  nomeCurto: string;
  especPapel: string;
} & TickerDateRange;
type TickersCashApi = Record<string, TickerCashApi>;

type ParsedTxtLine = {
  data: number;
  codBDI: number;
  codNegociacao: string;
  tipoMercado: number;
  nomeResumido: string;
  especificacaoPapel: string;
  prazoMercadoTermo: string;
  moeda: string;
  precoAbertura: number;
  precoMaximo: number;
  precoMinimo: number;
};

async function parseFile(): Promise<boolean> {
  const { filePath, filename } = getFirstAvailabeFile('.TXT');
  if (!filePath) {
    logInfo('No more txt files to parse');
    return false;
  }

  const tickersCashApi: TickersCashApi = {};

  const fileStream = createReadStream(filePath, { encoding: 'utf8' });
  const rl = createInterface({
    input: fileStream,
    crlfDelay: Number.POSITIVE_INFINITY,
  });

  for await (const line of rl) {
    const recordType = line.slice(0, 2);
    if (recordType !== '01') continue; // only quote records

    const parsedTxtLine = parseTxtLine(line);

    if (parsedTxtLine.tipoMercado === 10)
      getTickerFileData(parsedTxtLine, tickersCashApi);
  }

  writeToFile<TickersCashApi>(
    '/api/v1/tickers-cash-market.json',
    tickersCashApi,
  );

  renameSync(filePath, path.join(PARSED_RAW_FILES_DIR, String(filename)));

  logInfo('File parsed successfully');
  return true;
}

const spacesRegex = /\s+/g;
function parseTxtLine(line: string): ParsedTxtLine {
  return {
    data: Number(line.slice(2, 10)),
    codBDI: Number(line.slice(10, 12)),
    codNegociacao: line.slice(12, 24).trim(),
    tipoMercado: Number(line.slice(24, 27)),
    nomeResumido: line.slice(27, 39).replaceAll(spacesRegex, ' ').trim(),
    especificacaoPapel: line.slice(39, 49).replaceAll(spacesRegex, ' ').trim(),
    prazoMercadoTermo: line.slice(49, 52).trim(),
    moeda: line.slice(52, 56).trim(),
    precoAbertura: Number(line.slice(56, 69)),
    precoMaximo: Number(line.slice(69, 82)),
    precoMinimo: Number(line.slice(82, 95)),
  };
}

function getTickerFileData(
  txtFileLine: ParsedTxtLine,
  tickersObject: TickersCashApi,
): void {
  const currentTickerData = tickersObject[txtFileLine.codNegociacao];

  tickersObject[txtFileLine.codNegociacao] = {
    codNeg: txtFileLine.codNegociacao,
    nomeCurto: txtFileLine.nomeResumido,
    especPapel: txtFileLine.especificacaoPapel,
    dataMax: Math.max(currentTickerData?.dataMax || 0, txtFileLine.data),
    dataMin: Math.min(
      currentTickerData?.dataMin || 99_999_999,
      txtFileLine.data,
    ),
  };
}

async function main() {
  while (await parseFile()) {
    logInfo('Parsing next file...');
  }
}

main().catch((error) => {
  console.error('Error during parsing:', error);
  process.exit(1);
});
