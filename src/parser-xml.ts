import { createReadStream, renameSync } from 'node:fs';
import { parseStringPromise } from 'xml2js';
import path from 'node:path';
import { logError, logInfo } from './logger';
import { getFirstAvailabeFile, writeToFile } from './parser-utils';
import { PARSED_RAW_FILES_DIR } from './config';
import { TickerDateRange } from './types';

// O boletim de instrumentos cresce a cada ano: 200 MB em 2021, 241 MB em 2023,
// 634 MB em 2026. Ler o arquivo inteiro em memória não é mais possível — o
// limite de string do Node é 512 MB — e montar a árvore do XML todo custaria
// vários GB de heap. Então o arquivo é varrido em blocos <Instrm>…</Instrm> e
// somente os poucos que interessam (ETFs de renda fixa: uma dezena de blocos
// em ~180 mil) são entregues ao xml2js.
type FixedIncomeInstrument = {
  Instrm?: {
    FinInstrmAttrCmon?: Array<{ Mkt?: string[]; Desc?: string[] }>;
    InstrmInf?: Array<{
      FxdIncmInf?: Array<{
        TckrSymb?: string[];
        TradgStartDt?: string[];
        TradgEndDt?: string[];
      }>;
    }>;
  };
};

type ETF_API = {
  codNeg: string;
  nome: string;
} & TickerDateRange;
type ETFsAPI = Record<string, ETF_API>;

const INSTRUMENT_OPEN_TAG = '<Instrm>';
const INSTRUMENT_CLOSE_TAG = '</Instrm>';
// ETFs de renda fixa vivem no mercado 5, descritos dentro de <FxdIncmInf>.
// Filtro barato no texto do bloco, reconferido depois no XML já parseado.
const FIXED_INCOME_MARKET = 'Mkt>5<';
const FIXED_INCOME_TAG = '<FxdIncmInf>';
const MAX_TICKER_LENGTH = 6;

async function collectFixedIncomeBlocks(filePath: string): Promise<string[]> {
  const blocks: string[] = [];
  let buffer = '';
  let instrumentsScanned = 0;

  const stream = createReadStream(filePath, { encoding: 'utf8' });
  for await (const chunk of stream) {
    buffer += chunk;

    let openTagIndex = buffer.indexOf(INSTRUMENT_OPEN_TAG);
    while (openTagIndex !== -1) {
      const closeTagIndex = buffer.indexOf(INSTRUMENT_CLOSE_TAG, openTagIndex);
      if (closeTagIndex === -1) break;

      const blockEnd = closeTagIndex + INSTRUMENT_CLOSE_TAG.length;
      const block = buffer.slice(openTagIndex, blockEnd);
      buffer = buffer.slice(blockEnd);
      instrumentsScanned++;

      if (
        block.includes(FIXED_INCOME_MARKET) &&
        block.includes(FIXED_INCOME_TAG)
      ) {
        blocks.push(block);
      }

      openTagIndex = buffer.indexOf(INSTRUMENT_OPEN_TAG);
    }

    // Descarta o que já foi varrido. Sem nenhuma tag de abertura pendente,
    // guarda só o suficiente para uma tag partida entre dois chunks.
    buffer =
      openTagIndex === -1
        ? buffer.slice(-INSTRUMENT_OPEN_TAG.length)
        : buffer.slice(openTagIndex);
  }

  logInfo(
    `Instruments scanned: ${instrumentsScanned} | fixed income: ${blocks.length}`,
  );
  return blocks;
}

const spacesRegex = /\s+/g;
async function parseInstrument(block: string): Promise<ETF_API | null> {
  const parsedBlock = (await parseStringPromise(block, {
    ignoreAttrs: true,
  })) as FixedIncomeInstrument;

  const attributes = parsedBlock.Instrm?.FinInstrmAttrCmon?.[0];
  const fixedIncome = parsedBlock.Instrm?.InstrmInf?.[0]?.FxdIncmInf?.[0];
  if (!attributes || !fixedIncome) return null;
  if (attributes.Mkt?.[0] !== '5') return null;

  const codNeg = fixedIncome.TckrSymb?.[0];
  const nome = attributes.Desc?.[0];
  const tradingStartDate = fixedIncome.TradgStartDt?.[0];
  const tradingEndDate = fixedIncome.TradgEndDt?.[0];
  if (!codNeg || !nome || !tradingStartDate || !tradingEndDate) return null;

  // Ticker longo é instrumento que não é negociado por código de 11 (ex.: séries
  // de debêntures); data de início em 9999 é instrumento apenas cadastrado.
  if (codNeg.length > MAX_TICKER_LENGTH) return null;
  if (tradingStartDate.startsWith('9999-')) return null;

  return {
    codNeg,
    nome: nome.replaceAll(spacesRegex, ' '),
    dataMax: Number(tradingEndDate.replaceAll('-', '')),
    dataMin: Number(tradingStartDate.replaceAll('-', '')),
  };
}

async function parseFile(): Promise<boolean> {
  const { filePath, filename } = getFirstAvailabeFile('.xml');
  if (!filePath) {
    logInfo('No more xml files to parse');
    return false;
  }
  logInfo(`Parsing ${filename}...`);

  const blocks = await collectFixedIncomeBlocks(filePath);

  const itemByTicker: ETFsAPI = {};
  for (const block of blocks) {
    const parsedItem = await parseInstrument(block);
    if (!parsedItem) continue;

    const key = `${parsedItem.codNeg}-${parsedItem.nome}`;
    itemByTicker[key] = parsedItem;
  }
  logInfo(`Tickers found: ${Object.keys(itemByTicker).length}`);

  writeToFile<ETFsAPI>('/api/v1/tickers-ETF.json', itemByTicker);

  renameSync(filePath, path.join(PARSED_RAW_FILES_DIR, String(filename)));

  return true;
}

async function recursivePromise() {
  const hasFile = await parseFile();
  if (hasFile) await recursivePromise();
}
recursivePromise().catch((e) => {
  logError(e);
});
