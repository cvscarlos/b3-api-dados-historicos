<div align="center"><img alt="B3 Logo" src="https://upload.wikimedia.org/wikipedia/commons/d/d7/B3_logo.png" width="160" /></div>

<h1 align="center">B3 Historical Quote Data API</h1>
<p align="center"><strong>A lista completa de ativos da <a href="http://www.b3.com.br/pt_br/" target="_blank">B3</a> em JSON. Grátis, sem cadastro, sem chave, sem limite de requisições.</strong></p>

---

Precisa saber quais ativos existem na bolsa brasileira, desde quando cada um é negociado e qual o nome que aparece na sua nota de corretagem? A B3 publica esses dados, mas em arquivos de texto de largura fixa e XMLs de centenas de megabytes. Esta API faz esse trabalho todos os dias e entrega o resultado em JSON.

- **Grátis e sem autenticação** — nenhum cadastro, nenhuma chave, nenhum limite de requisições
- **Atualizada todo dia** de madrugada, automaticamente, direto dos arquivos oficiais da B3
- **Histórico desde 2010** — inclusive ativos que não existem mais (`KROT3`, `CIEL3`, `AMBV10`…)
- **Pronta para o navegador** — servida via GitHub Pages com `Access-Control-Allow-Origin: *`, sem proxy e sem dor de cabeça com CORS
- **Ações, FIIs, ETFs, BDRs, UNITs, recibos e direitos** — quase 4 mil ativos do mercado à vista, mais 60+ ETFs de renda fixa

```bash
curl https://cvscarlos.github.io/b3-api-dados-historicos/api/v1/tickers-cash-market.json
```

## Endpoints

Base: `https://cvscarlos.github.io/b3-api-dados-historicos/api/v1`

| Endpoint                                                       | O que traz                                                                    | Tamanho |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------- | ------- |
| [`/tickers-cash-market.json`](api/v1/tickers-cash-market.json) | Ativos do mercado à vista (ações, FIIs, ETFs, BDRs, UNITs, recibos, direitos) | ~620 KB |
| [`/tickers-ETF.json`](api/v1/tickers-ETF.json)                 | ETFs de renda fixa (Tesouro, IPCA, Selic, CDI, debêntures)                    | ~9 KB   |
| [`/ping.json`](api/v1/ping.json)                               | Health check — responde `["pong"]`                                            | 9 B     |

Os dois endpoints de ativos têm o mesmo formato: um objeto `data` indexado por chave, para você acessar o ativo direto, sem varrer array.

### `/tickers-cash-market.json` — mercado à vista

Indexado pelo **código de negociação**. Fonte: arquivos COTAHIST (séries históricas), de 2010 até o último pregão.

<!-- prettier-ignore -->
```jsonc
{
  "data": {
    "PETR4": {
      "codNeg": "PETR4",         // código de negociação
      "nomeCurto": "PETROBRAS",  // nome resumido, como aparece na nota de corretagem
      "especPapel": "PN N2",     // especificação do papel (tipo + segmento de listagem)
      "dataMax": 20260724,       // último pregão em que o ativo foi negociado (YYYYMMDD)
      "dataMin": 20100104        // primeiro pregão presente nos dados (YYYYMMDD)
    }
  }
}
```

Alguns exemplos do que você encontra aqui:

| Chave    | `nomeCurto`    | `especPapel` | O que é           |
| -------- | -------------- | ------------ | ----------------- |
| `PETR4`  | `PETROBRAS`    | `PN N2`      | Ação preferencial |
| `BOVA11` | `ISHARES BOVA` | `CI`         | ETF de índice     |
| `MXRF11` | `FII MAXI REN` | `CI`         | Fundo imobiliário |
| `AAPL34` | `APPLE`        | `DRN`        | BDR               |
| `SANB11` | `SANTANDER BR` | `UNT`        | UNIT              |

**`dataMin` / `dataMax` são o superpoder deste endpoint.** Com eles você descobre se um ticker estava vivo em determinada data — essencial para reprocessar notas antigas, já que a B3 recicla códigos entre empresas diferentes ao longo dos anos.

### `/tickers-ETF.json` — ETFs de renda fixa

Indexado por `{codNeg}-{nome}`, porque um mesmo código pode ter mudado de nome ao longo da vida (troca de gestora, por exemplo) e os dois nomes seguem úteis para reconhecer o ativo na nota. Fonte: boletim diário de instrumentos da B3 (BVBG.028.02).

<!-- prettier-ignore -->
```jsonc
{
  "data": {
    "LTBX11-TREND CASH BF11": {
      "codNeg": "LTBX11",         // código de negociação
      "nome": "TREND CASH BF11",  // nome curto da B3 (15 caracteres, como sai na nota)
      "dataMax": 99991231,        // 99991231 = ainda listado, sem data de encerramento
      "dataMin": 20260327         // início de negociação (YYYYMMDD)
    }
  }
}
```

Esses ativos **não aparecem** no arquivo COTAHIST, e por isso não estão no endpoint do mercado à vista: a B3 os classifica como instrumentos de renda fixa. Se você procura `IMAB11`, `FIXA11`, `LFTS11`, `IRFM11` ou qualquer outro `…F11`, é aqui.

## Como usar

```js
const BASE = 'https://cvscarlos.github.io/b3-api-dados-historicos/api/v1';

const { data } = await fetch(`${BASE}/tickers-cash-market.json`).then((r) =>
  r.json(),
);

// O ativo era negociado nesta data?
const negociadoEm = (ticker, aaaammdd) =>
  Boolean(data[ticker]) &&
  aaaammdd >= data[ticker].dataMin &&
  aaaammdd <= data[ticker].dataMax;

negociadoEm('PETR4', 20150612); // true
negociadoEm('KROT3', 20240101); // false — a Kroton virou Cogna em 2019

// Do nome da nota de corretagem para o código de negociação
const porNome = Object.values(data).filter(
  (ativo) => ativo.nomeCurto === 'PETROBRAS',
);
// [{ codNeg: 'PETR3', ... }, { codNeg: 'PETR4', ... }]
```

Os arquivos são estáticos e pequenos — carregue uma vez e guarde em memória, em vez de fazer uma requisição por ativo. O GitHub Pages responde com `Cache-Control: max-age=600`.

## Atualização dos dados

Um GitHub Action roda **todos os dias à 01:18 UTC**: baixa os arquivos oficiais da B3, converte para JSON e publica. Os dados são acumulativos — um ativo que sai de negociação continua na API, com o `dataMax` congelado no seu último pregão.

Fontes oficiais, se você quiser conferir ou reprocessar por conta própria:

- [Séries históricas (COTAHIST)](https://www.b3.com.br/pt_br/market-data-e-indices/servicos-de-dados/market-data/historico/mercado-a-vista/series-historicas/)
- [Boletim diário — pesquisa por pregão (instrumentos)](https://www.b3.com.br/pt_br/market-data-e-indices/servicos-de-dados/market-data/historico/boletins-diarios/pesquisa-por-pregao/pesquisa-por-pregao/)

## Aviso

Projeto independente, sem qualquer vínculo com a B3. Os dados são republicados como vêm da fonte oficial, sem garantia de exatidão ou de disponibilidade — não use como única fonte para decisão de investimento. Código aberto sob licença MIT: [github.com/cvscarlos/b3-api-dados-historicos](https://github.com/cvscarlos/b3-api-dados-historicos).

Achou um ativo faltando ou um dado errado? [Abra uma issue](https://github.com/cvscarlos/b3-api-dados-historicos/issues).
