<div align="center"><img alt="B3 Logo" src="https://upload.wikimedia.org/wikipedia/commons/d/d7/B3_logo.png" width="160" /></div>

<h1 align="center">B3 Historical Quote Data API</h1>
<p align="center">A JSON file based API for historical stock quote data from the <a href="http://www.b3.com.br/en_us/" target="_blank">B3 Brazilian Stock Exchange</a>.</p>

---

**Grátis, customizável e simples.**

Essa API fornece dos dados disponibilizados pela B3 para download em formato de API!

Os dados não tratados podem ser baixados diretamento no site da B3 em: [https://www.b3.com.br/.../series-historicas](https://www.b3.com.br/pt_br/market-data-e-indices/servicos-de-dados/market-data/historico/mercado-a-vista/series-historicas/)

Essa API possui dados de 2010 até dias atuais.

## Endpoints

### Lista de ativos do mercado à vista
**GET:** [https://cvscarlos.github.io/b3-api-dados-historicos/api/v1/tickers-cash-market.json](https://cvscarlos.github.io/b3-api-dados-historicos/api/v1/tickers-cash-market.json)

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

## Atualizando os dados da API

A B3 adicionou um captcha no download dos dados, então para atualizar os dados da API você precisa:
1. Acessar a página de [séries históricas da B3](https://www.b3.com.br/pt_br/market-data-e-indices/servicos-de-dados/market-data/historico/mercado-a-vista/series-historicas/);
2. Baixe o arquivo com a série de dados deseja, "[Séries Anuais](https://bvmf.bmfbovespa.com.br/pt-br/cotacoes-historicas/FormConsultaValida.asp?arq=COTAHIST_A2025.ZIP)" por exemplo (as vezes é necessário uso de VPN);
3. Coloque o arquivo na pasta `docs/b3-raw-files`;
4. Execute `npm run unzip && npm run parse`.

Outra opção é tentar baixar o arquivo zip diretamente: https://bvmf.bmfbovespa.com.br/InstDados/SerHist/COTAHIST_A2025.ZIP