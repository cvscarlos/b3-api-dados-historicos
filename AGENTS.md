# AGENTS.md

Instruções para agentes de IA e para quem mantém este repositório.

Ele gera a [B3 Historical Quote Data API](https://cvscarlos.github.io/b3-api-dados-historicos/) — arquivos JSON estáticos com a lista de ativos da B3, publicados via GitHub Pages a partir da pasta `docs/`.

**O único README do repositório é o `docs/README.md`, e ele é a página HTML publicada** em https://cvscarlos.github.io/b3-api-dados-historicos/ — é a vitrine da API, escrita para quem vai consumi-la. Não coloque detalhe técnico, instrução de manutenção nem nota de implementação lá; esse conteúdo vive aqui. Não crie um `README.md` na raiz.

## Como funciona

Dois pipelines independentes, cada um com sua fonte na B3 e seu arquivo de saída:

| Pipeline        | Fonte B3                                  | Comandos                                     | Saída                                  |
| --------------- | ----------------------------------------- | -------------------------------------------- | -------------------------------------- |
| Mercado à vista | COTAHIST (TXT de largura fixa, por dia)   | `npm run download` → `npm run parse`         | `docs/api/v1/tickers-cash-market.json` |
| Renda fixa      | Boletim de instrumentos BVBG.028.02 (XML) | `npm run download-xml` → `npm run parse-xml` | `docs/api/v1/tickers-ETF.json`         |

O GitHub Action (`.github/workflows/deploy.yaml`) roda os quatro comandos todo dia à 01:18 UTC e commita o resultado no `main`.

Os dois parsers são **acumulativos**: `writeToFile` (em `src/parser-utils.ts`) mescla o resultado no JSON existente e só expande `dataMin`/`dataMax`. Ativo que sai de negociação nunca é removido — e por isso reprocessar um arquivo antigo é sempre seguro.

Os arquivos crús baixados ficam em `docs/b3-raw-files/` (gitignorada); depois de processados são movidos para `docs/b3-raw-files/parsed-files/`.

## Cuidados ao mexer nos parsers

- **Nunca leia o XML de instrumentos inteiro na memória.** Ele cresce todo ano — 200 MB em 2021, 241 MB em 2023, **634 MB em 2026**, dois arquivos por pregão — e já passou do limite de string do Node (512 MB), então `readFileSync(path, 'utf8')` estoura. O `src/parser-xml.ts` varre o arquivo em blocos `<Instrm>…</Instrm>` e entrega ao `xml2js` apenas os poucos que interessam (~285 de ~184 mil blocos), com uso de memória constante: os dois arquivos de um pregão são processados em ~1,5 s.
- **Data sem pregão não devolve erro.** A B3 responde HTTP 200 com um zip válido e **vazio** (22 bytes). É por isso que `downloadFile` trata "zip sem entradas" como falha: sem isso, a opção `stopOnFirstSuccess` pararia na primeira tentativa e nunca baixaria nada.
- **`stopOnFirstSuccess` existe para não desperdiçar disco.** O boletim de instrumentos é um retrato completo do dia (`UpdTp COMP`), então um pregão basta; baixar os 5 dias da janela custaria mais de 6 GB descompactados.
- **ETFs de renda fixa não estão no COTAHIST.** Nenhum deles — nem `IMAB11`, nem `FIXA11`, nem `LFTS11`. A B3 os classifica como instrumentos de renda fixa (`Mkt=5`, `Sgmt=3`, `SctyCtgy=71`, dentro de `<FxdIncmInf>`), e é exatamente por isso que existe o segundo pipeline. Se um `…F11` está faltando na API, o problema é o pipeline do XML, não o filtro `tipoMercado === 10` do COTAHIST.

## Reprocessando à mão

O download automático do COTAHIST pode falhar (a B3 já colocou captcha na página de séries históricas). Para reprocessar manualmente:

1. Baixe o arquivo desejado na [página de séries históricas](https://www.b3.com.br/pt_br/market-data-e-indices/servicos-de-dados/market-data/historico/mercado-a-vista/series-historicas/) — "Séries Anuais", por exemplo (às vezes é necessário usar VPN). Também vale tentar direto: `https://bvmf.bmfbovespa.com.br/InstDados/SerHist/COTAHIST_A2025.ZIP`
2. Coloque o zip em `docs/b3-raw-files/`
3. `npm run unzip && npm run parse`

Para o boletim de instrumentos, o download direto aceita a data no formato `IN` + `AAMMDD`:
`https://www.b3.com.br/pesquisapregao/download?filelist=IN260724.zip,`

Os layouts oficiais dos dois formatos estão em `docs/b3-docs/`.

## Desenvolvimento

```bash
npm install
npm run lint       # eslint
npm run lint:fix
npx tsc --noEmit   # type check
```

Node 24 (`.nvmrc`). Os scripts rodam via `ts-node -T` (sem build).
