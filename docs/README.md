<div align="center"><img alt="B3 Logo" src="https://upload.wikimedia.org/wikipedia/commons/d/d7/B3_logo.png" width="160" /></div>

<h1 align="center">B3 Historical Quote Data API</h1>
<p align="center">A JSON file based API for historical stock quote data from the <a href="http://www.b3.com.br/en_us/" target="_blank">B3 Brazilian Stock Exchange</a>.</p>

---

**Grátis, customizável e simples.**

Essa API fornece dos dados disponibilizados pela B3 para download em formato de API!

Os dados não tratados podem ser baixados diretamento no site da B3 em: https://www.b3.com.br/pt_br/market-data-e-indices/servicos-de-dados/market-data/historico/mercado-a-vista/series-historicas/

Essa API possui dados de 2010 até dias atuais.

## Endpoints

### Lista de ativos do mercado à vista
**GET:** https://cvscarlos.github.io/b3-api-dados-historicos/api/v1/tickers-cash-market.json

Exemplo de resposta:
```jsonc
{
  "data": {
    "PETR4": { // Código de negociação do ativo
      "codNeg": "PETR4", // Código de negociação do ativo
      "nomeCurto": "PETROBRAS", // Nome curto do ativo
      "especPapel": "PN N2", // Especificação do ativo
      // Datas no formato YYYYMMDD
      "dataMax": 20231124, // Maior data existente nos dados tratados p/ esse ativo. 
      "dataMin": 20100104 // Menor data existente nos dados tratados p/ esse ativo
    }
  }
}
```
