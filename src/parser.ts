import { readFileSync, readdirSync, renameSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { DOCS_DIR } from './config';
import { logError, logInfo } from './logger';

type TickerCashApi = {
  codNeg: string;
  nomeCurto: string;
  especPapel: string;
  dataMax: number;
  dataMin: number;
};
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

type ApiBody = {
  [key: string]: Record<string, unknown>;
};

function parseFile() {
  const { txtFilePath, filename } = getFirstAvailabeTxtFile();
  if (!txtFilePath) {
    logInfo('No more txt files to parse');
    return false;
  }
  const txtFile = readFileSync(txtFilePath, 'utf8');

  const tickersCashApi: TickersCashApi = {};
  const dataToLog = [];

  const txtLines = txtFile.split('\n');
  for (let i = 0, l = txtLines.length; i < l; i++) {
    const line = txtLines[i];

    const recordType = line.slice(0, 2);
    if (recordType !== '01') continue; // only quote records

    const parsedTxtLine = parseTxtLine(line);

    if (parsedTxtLine.tipoMercado === 10)
      getTickerFileData(parsedTxtLine, tickersCashApi);

    dataToLog.push(parsedTxtLine);
  }

  writeToFile<TickersCashApi>(
    '/api/v1/tickers-cash-market.json',
    tickersCashApi,
  );

  renameSync(
    txtFilePath,
    path.join(DOCS_DIR, `/b3-txt-files/parsed-files`, String(filename)),
  );

  logInfo('File parsed successfully');
  return true;
}

function getFirstAvailabeTxtFile() {
  const files = readdirSync(path.join(DOCS_DIR, '/b3-txt-files'));
  const txtFile = files.find((file) => file.endsWith('.TXT'));
  const filePath = txtFile
    ? path.join(DOCS_DIR, '/b3-txt-files', txtFile)
    : null;
  return { txtFilePath: filePath, filename: txtFile };
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

  // eslint-disable-next-line no-param-reassign
  tickersObject[txtFileLine.codNegociacao] = {
    codNeg: txtFileLine.codNegociacao,
    nomeCurto: txtFileLine.nomeResumido,
    especPapel: txtFileLine.especificacaoPapel,
    dataMax: Math.max(currentTickerData?.dataMax || 0, txtFileLine.data),
    dataMin: Math.min(
      currentTickerData?.dataMin || Number.POSITIVE_INFINITY,
      txtFileLine.data,
    ),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function writeToFile<T extends Record<string, Record<string, any>>>(
  filePath: string,
  newData: T,
) {
  const currentApiData = jsonParse(
    readFileSync(path.join(DOCS_DIR, filePath), 'utf8'),
  );

  const data = currentApiData.data as T;
  Object.keys(newData).forEach((key) => {
    const newItem = newData[key];
    const item = data[key] || newItem;
    item.dataMax = Math.max(item?.dataMax || 0, newItem.dataMax);
    item.dataMin = Math.min(item?.dataMin || 0, newItem.dataMin);
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

while (parseFile()) {
  logInfo('Parsing next file...');
}
