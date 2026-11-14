# Ludo para 2 jogadores
 
Lógica de uma partida de Ludo para **dois jogadores**, escrita em JavaScript (CommonJS) e coberta por 40 casos de teste automatizados com o executor nativo do Node.js (`node:test`).
 
## Como rodar
 
Requisito: Node.js 18 ou mais novo. Não há dependências para instalar.
 
```bash
npm test
```
 
O comando executa os 40 casos de teste (CT01 a CT40). No `package.json`, o script de teste é:
 
```json
{
  "scripts": {
    "test": "node --test"
  }
}
```
 
## Estrutura
 
| Arquivo | Conteúdo |
|---|---|
| `ludo.js` | Regras da partida: criação, dado, movimentação, captura, chegada e vitória |
| `ludo.test.js` | Casos de teste automatizados (CT01 a CT40) |
| `package.json` | Configuração do projeto e script `npm test` |
 
## Regras implementadas
 
O desafio define apenas que a partida tem dois jogadores. Como o Ludo tem muitas variações, as regras abaixo são as adotadas aqui, para que os testes tenham resultados objetivos e reproduzíveis.
 
### Jogadores e peças
 
- Exatamente 2 jogadores, com 4 peças cada.
- Todas as peças começam na base, representada pelo progresso `-1`.
- O jogador de índice `0` começa a partida.
### Percurso
 
- O percurso compartilhado tem **52 casas**.
- Os jogadores saem de posições opostas: casa `0` e casa `26`.
- Depois de completar a volta, a peça entra na própria chegada, com **6 casas**.
- Uma peça está finalizada quando chega exatamente ao progresso `58`.
### Dado e movimentação
 
- O dado aceita inteiros de `1` a `6`.
- Só é possível sair da base com `6`. A peça entra na casa inicial do jogador.
- Peças no percurso avançam o número de casas do dado.
- A chegada exige o valor exato. Não é permitido ultrapassá-la.
- Peça finalizada não pode ser movida de novo.
- Mover uma peça com `6` dá nova jogada ao mesmo jogador. Com qualquer outro valor, a vez passa.
- Se nenhuma peça puder se mover, a vez passa direto para o adversário.
- Não é permitido lançar o dado de novo enquanto houver uma peça aguardando movimento.
### Capturas e casas seguras
 
- Casas seguras: `0`, `8`, `13`, `21`, `26`, `34`, `39` e `47`.
- Ao terminar o movimento em casa não segura ocupada por peça adversária, a peça adversária volta para a base.
- Peça em casa segura não é capturada.
- Peça que já entrou na chegada não é capturada.
- Não existe bloqueio. Se houver mais de uma peça adversária na mesma casa não segura, todas são capturadas.
- Capturar ou finalizar uma peça não dá jogada extra. Só o `6` repete a vez.
### Fim da partida
 
- Vence quem levar as 4 peças até a chegada.
- A partida passa para o status `encerrada` e o índice do vencedor é registrado.
- Depois disso, lançar o dado ou mover peças é rejeitado.
## Uso
 
```js
const { criarPartida, lancarDado, moverPeca } = require('./ludo');
 
const partida = criarPartida(['Ana', 'Bia']);
 
const movimentos = lancarDado(partida, 6); // [0, 1, 2, 3]
moverPeca(partida, 0, movimentos[0]);      // peça 0 sai da base
```
 
O valor do dado pode ser passado direto em `lancarDado(partida, valor)`, o que permite cenários controlados nos testes. Sem o segundo argumento, o valor é sorteado.
 
### Funções exportadas
 
| Função | O que faz |
|---|---|
| `criarPartida(nomes)` | Cria a partida. Sem argumento, usa `Jogador 1` e `Jogador 2` |
| `lancarDado(partida, valor)` | Lança o dado e retorna as peças que podem se mover. Passa a vez se não houver nenhuma |
| `moverPeca(partida, jogador, idPeca)` | Move a peça, aplica capturas, registra o histórico e atualiza vez e status |
| `obterMovimentosPossiveis(partida, jogador, dado)` | Retorna os ids das peças que podem se mover com aquele valor |
| `obterPosicaoNaPista(jogador, progresso)` | Converte o progresso na casa do percurso, ou `null` se a peça estiver na chegada |
| `ehCasaSegura(posicao)` | Indica se a casa é segura |
| `verificarVitoria(partida, jogador)` | Indica se o jogador tem as 4 peças na chegada |
 
Também são exportadas as constantes `QUANTIDADE_JOGADORES`, `PECAS_POR_JOGADOR`, `CASAS_PISTA`, `CASAS_CHEGADA`, `PROGRESSO_FINAL`, `CASAS_SEGURAS` e `POSICOES_INICIAIS`.
 
### Estado da partida
 
| Campo | Descrição |
|---|---|
| `jogadores` | Lista com `id`, `nome` e as `pecas` (`id` e `progresso`) |
| `jogadorDaVez` | Índice do jogador que joga |
| `dado` | Valor lançado aguardando movimento, ou `null` |
| `ultimoDado` | Último valor lançado |
| `movimentosPossiveis` | Ids das peças que podem se mover com o dado atual |
| `status` | `jogando` ou `encerrada` |
| `vencedor` | Índice do vencedor, ou `null` |
| `historico` | Lista de movimentos com `jogador`, `peca`, `dado`, `progressoAnterior`, `progressoNovo` e `capturadas` |
 
## Casos de teste
 
Usam `node:test` e `node:assert/strict`.
 
### Criação da partida para dois jogadores
 
| Nº | Caso | Resultado esperado |
|---|---|---|
| CT01 | Criar partida | Dois jogadores cadastrados |
| CT02 | Quantidade de peças | Cada jogador possui quatro peças |
| CT03 | Nomes personalizados | Os nomes informados são armazenados |
| CT04 | Quantidade inválida de jogadores | Criação rejeitada |
| CT05 | Nomes vazios ou inválidos | Criação rejeitada |
| CT06 | Estado inicial das peças | Todas as peças começam na base |
| CT07 | Jogador inicial e status | O jogador de índice 0 começa e a partida fica ativa |
 
### Tabuleiro e casas seguras
 
| Nº | Caso | Resultado esperado |
|---|---|---|
| CT08 | Tamanho do percurso | O percurso possui 52 casas |
| CT09 | Posições iniciais | Os jogadores começam em posições opostas |
| CT10 | Posição do primeiro jogador | A posição é calculada corretamente |
| CT11 | Posição do segundo jogador | A posição é calculada corretamente |
| CT12 | Volta pelo percurso | A posição permanece dentro dos limites do percurso |
| CT13 | Peça na chegada | Peças na chegada não ocupam o percurso comum |
| CT14 | Casas seguras | As casas seguras são identificadas corretamente |
| CT15 | Jogador ou progresso inválido | O cálculo rejeita os parâmetros inválidos |
 
### Lançamento do dado e entrada das peças
 
| Nº | Caso | Resultado esperado |
|---|---|---|
| CT16 | Resultados válidos do dado | Valores de 1 a 6 são aceitos |
| CT17 | Resultados inválidos do dado | Valores fora do intervalo ou não inteiros são rejeitados |
| CT18 | Tirar 6 com peça na base | Uma peça pode sair da base |
| CT19 | Tirar valor diferente de 6 com peças na base | Nenhuma peça sai da base e a vez passa |
| CT20 | Nenhuma peça pode ser movimentada | A vez passa para o adversário |
| CT21 | Lançar novamente antes de mover | O segundo lançamento é rejeitado |
 
### Movimentação das peças
 
| Nº | Caso | Resultado esperado |
|---|---|---|
| CT22 | Avançar pelo valor do dado | A peça avança a quantidade correta de casas |
| CT23 | Movimento sem tirar 6 | A vez passa para o outro jogador |
| CT24 | Movimento após tirar 6 | O mesmo jogador recebe outra jogada |
| CT25 | Jogar fora da vez | A movimentação é rejeitada |
| CT26 | Mover antes de lançar o dado | A movimentação é rejeitada |
| CT27 | Selecionar peça inexistente | A movimentação é rejeitada |
| CT28 | Selecionar peça indisponível | A movimentação é rejeitada |
| CT29 | Ultrapassar a chegada | O movimento não é permitido |
| CT30 | Valor exato para chegar | A peça só pode finalizar com o valor exato |
| CT31 | Alcançar exatamente a chegada | A peça é marcada como finalizada |
| CT32 | Mover peça já finalizada | A peça finalizada não aparece entre os movimentos possíveis |
 
### Capturas e proteção das casas seguras
 
| Nº | Caso | Resultado esperado |
|---|---|---|
| CT33 | Capturar em casa desprotegida | A peça adversária volta à base |
| CT34 | Registrar captura | A captura aparece no histórico da partida |
| CT35 | Pousar em casa segura | A peça adversária não é capturada |
| CT36 | Encontrar peça na chegada | A peça que já entrou na chegada não é capturada |
 
### Vitória e encerramento
 
| Nº | Caso | Resultado esperado |
|---|---|---|
| CT37 | Verificar quatro peças na chegada | A vitória é identificada corretamente |
| CT38 | Finalizar a última peça | A partida é encerrada e o vencedor é registrado |
| CT39 | Lançar dado após o encerramento | A operação é rejeitada |
| CT40 | Mover peça após o encerramento | A operação é rejeitada |
 
## Colaboradores
 
Gabriel Felipe Martins, RA 26005039-2
