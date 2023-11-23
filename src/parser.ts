import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

type TickerFile = Record<string, {
  codNegociacao: string,
  nomeResumido: string,
  especificacaoPapel: string,
  dataMax: number,
  dataMin: number,
}>

type ParsedLine = {
  data: number,
  codBDI: number,
  codNegociacao: string,
  tipoMercado: number,
  nomeResumido: string,
  especificacaoPapel: string,
  prazoMercadoTermo: string,
  moeda: string,
  precoAbertura: number,
  precoMaximo: number,
  precoMinimo: number,
}

function parseFile() {
  const dtaFilePath = path.resolve(__dirname, '../docs/b3-txt-files/COTAHIST_M072023.TXT')
  const txtFile = readFileSync(dtaFilePath, 'utf-8')

  const tickersCashData: TickerFile = {}
  const dataToLog = []

  const txtLines = txtFile.split('\n')
  for (let i = 0, l = txtLines.length; i < l; i++) {
    const line = txtLines[i]

    const recordType = line.substring(0, 2)
    if (recordType !== '01') continue

    const parsedLine = parseLine(line)

    if (parsedLine.tipoMercado === 10) {
      getTickerFileData(tickersCashData, parsedLine)
    }

    dataToLog.push(parsedLine)
  }

  const lineFilePath = path.resolve(__dirname, '../docs/api/v1/tickers-cash-market.json')
  writeFileSync(lineFilePath, JSON.stringify(tickersCashData, null, 2))

  console.log(dataToLog)
}

const spacesRegex = /\s+/g
function parseLine(line: string): ParsedLine {
  return {
    data: Number(line.substring(2, 10)),
    codBDI: Number(line.substring(10, 12)),
    codNegociacao: line.substring(12, 24).trim(),
    tipoMercado: Number(line.substring(24, 27)),
    nomeResumido: line.substring(27, 39).replace(spacesRegex, ' ').trim(),
    especificacaoPapel: line.substring(39, 49).replace(spacesRegex, ' ').trim(),
    prazoMercadoTermo: line.substring(49, 52).trim(),
    moeda: line.substring(52, 56).trim(),
    precoAbertura: Number(line.substring(56, 69)),
    precoMaximo: Number(line.substring(69, 82)),
    precoMinimo: Number(line.substring(82, 95)),
  }
}

function getTickerFileData(tickersObject: TickerFile, parsedLine: ParsedLine): void {
  const previousTickerData = tickersObject[parsedLine.codNegociacao]

  tickersObject[parsedLine.codNegociacao] = {
    codNegociacao: parsedLine.codNegociacao,
    nomeResumido: parsedLine.nomeResumido,
    especificacaoPapel: parsedLine.especificacaoPapel,
    dataMax: Math.max(previousTickerData?.dataMax || 0, parsedLine.data),
    dataMin: Math.min(previousTickerData?.dataMin || Infinity, parsedLine.data),
  }
}

parseFile()
