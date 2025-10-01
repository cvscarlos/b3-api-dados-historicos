import { readFileSync, renameSync } from 'node:fs';
import { parseStringPromise } from 'xml2js';
import path from 'node:path';
import { logError, logInfo } from './logger';
import { getFirstAvailabeFile, writeToFile } from './parser-utils';
import { PARSED_RAW_FILES_DIR } from './config';
import { TickerDateRange } from './types';

type InstrumentDocument = {
  Document: Array<{
    Instrm: Array<{
      FinInstrmAttrCmon: Array<{
        Asst: string[];
        AsstDesc: string[];
        Mkt: string[];
        Sgmt: string[];
        Desc: string[];
      }>;
      InstrmInf: Array<{
        FxdIncmInf: Array<{
          SctyCtgy: string[];
          ISIN: string[];
          TckrSymb: string[];
          TradgStartDt: string[];
          TradgEndDt: string[];
          TradgCcy: string[];
          PmtTp: string[];
          DaysToSttlm: string[];
          AllcnRndLot: string[];
          PricFctr: string[];
        }>;
      }>;
    }>;
  }>;
};

type ETF_API = {
  codNeg: string;
  nome: string;
} & TickerDateRange;
type ETFsAPI = Record<string, ETF_API>;

async function parseFile() {
  const { filePath, filename } = getFirstAvailabeFile('.xml');
  if (!filePath) {
    logInfo('No more xml files to parse');
    return false;
  }
  const xmlFileString = readFileSync(filePath, 'utf8');

  const xmlJson = await parseStringPromise(xmlFileString, {
    ignoreAttrs: true,
  });
  const instrumentDocument: InstrumentDocument[] =
    xmlJson?.Document?.BizFileHdr?.[0]?.Xchg?.[0]?.BizGrp;

  const forwardMarketList = instrumentDocument.filter((item) => {
    const { InstrmInf, FinInstrmAttrCmon } = item.Document[0].Instrm[0];
    return (
      FinInstrmAttrCmon[0].Mkt[0] === '5' &&
      InstrmInf &&
      InstrmInf[0].FxdIncmInf?.[0].TradgStartDt[0] &&
      !InstrmInf[0].FxdIncmInf[0].TradgStartDt[0].startsWith('9999-') &&
      InstrmInf[0].FxdIncmInf?.[0].TckrSymb[0].length <= 6
    );
  });

  const itemByTicker: ETFsAPI = {};
  for (let i = 0, l = forwardMarketList.length; i < l; i++) {
    const parsedItem = parseItem(forwardMarketList[i]);
    const key = `${parsedItem.codNeg}-${parsedItem.nome}`;
    itemByTicker[key] = parsedItem;
  }

  writeToFile<ETFsAPI>('/api/v1/tickers-ETF.json', itemByTicker);

  renameSync(filePath, path.join(PARSED_RAW_FILES_DIR, String(filename)));

  return true;
}

const spacesRegex = /\s+/g;
function parseItem(item: InstrumentDocument): ETF_API {
  return {
    codNeg: item.Document[0].Instrm[0].InstrmInf[0].FxdIncmInf[0].TckrSymb[0],
    nome: item.Document[0].Instrm[0].FinInstrmAttrCmon[0].Desc[0].replaceAll(
      spacesRegex,
      ' ',
    ),
    dataMax: Number(
      item.Document[0].Instrm[0].InstrmInf[0].FxdIncmInf[0].TradgEndDt[0].replaceAll(
        '-',
        '',
      ),
    ),
    dataMin: Number(
      item.Document[0].Instrm[0].InstrmInf[0].FxdIncmInf[0].TradgStartDt[0].replaceAll(
        '-',
        '',
      ),
    ),
  };
}

async function recursivePromise() {
  const hasFile = await parseFile();
  if (hasFile) await recursivePromise();
}
recursivePromise().catch((e) => {
  logError(e);
});
