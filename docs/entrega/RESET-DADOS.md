# Zerar os dados de produção e semear perfis para a apresentação

Instrução para o agente do Julio (ou para o Julio, à mão). Pedido do Miguel: apagar os pets criados até
agora em https://quebra-gelo.julioakamine.com e deixar 14 perfis fictícios com encontros, para o telão
e o slide 8 (`/slides/#8`) terem números na hora de apresentar.

**Isso apaga de vez todos os pets reais.** Quem já estiver jogando volta para a tela de criação. Confirme
com o Julio antes do passo 2.

## Por que não basta reiniciar

Os pets ficam na memória do servidor e no arquivo `/data/mundo.json` (volume do contêiner). O servidor
regrava o arquivo a cada 5 s quando algo muda e **grava de novo ao receber SIGTERM**
(`src/server/index.ts`, fim do arquivo). Por isso apagar o arquivo e dar restart, ou só fazer redeploy,
traz os pets de volta. Tem de apagar o arquivo e matar o processo com **SIGKILL**, que não deixa gravar.

## Passos

1. Ver como está hoje: `curl -s https://quebra-gelo.julioakamine.com/api/stats`
2. No Dokploy, no app do Quebra-Gelo, abrir o **terminal do contêiner** (`sh`) e rodar:

   ```sh
   rm -f /data/mundo.json /data/mundo.json.tmp && kill -9 1
   ```

   O terminal cai; é esperado. O contêiner sobe de novo sozinho em 10 a 20 s. Se não subir, **Start** ou
   **Deploy** no Dokploy.
3. Conferir que zerou: `curl -s https://quebra-gelo.julioakamine.com/api/stats` deve mostrar
   `"pessoas":0` (os 7 pets de exemplo voltam sozinhos e não entram nessa conta).
4. Semear os perfis, da raiz do repositório (Node 18 ou mais novo, sem dependências):

   ```sh
   node scripts/repertorio.mjs https://quebra-gelo.julioakamine.com
   ```

   Leva uns 30 s (o servidor exige 5 s entre encontros de cada pessoa). No fim imprime o `/api/stats`;
   o esperado é por volta de **14 pessoas, 17 encontros e 6 finais**. Linhas "rodada N ... 4xx" são
   encontros que a regra recusou e podem ser ignoradas.
5. Abrir https://quebra-gelo.julioakamine.com/tela e conferir o telão com os números.

Rode o passo 4 **uma vez só**: rodar de novo cria mais 14 perfis.

## O que o script cria

14 pessoas com nomes e pets fictícios (Marina, Rafael, Júlia, Pedro, Camila, Lucas, Beatriz, Thiago,
Larissa, Gustavo, Fernanda, Rodrigo, Aline, Vinícius), áreas variadas e três estilos de conversa
(papo rápido, conversa funda e misto). Os encontros saem em 4 rodadas; a última repete pares da
primeira, porque a Missão 4 é reencontro. Ninguém tem LinkedIn: não usamos perfil que possa ser de
alguém real.
