# CLAUDE.md

Jogo web de adivinhar músicas, inspirado no Musicle (musicle.app), focado em categorias de nicho que os jogos existentes não cobrem: rock gaúcho, música gaúcha/nativista, bandinhas, rock brasileiro etc. O jogador ouve um trecho de uma música e escolhe o título certo entre 4 opções.

## Stack

- Next.js (App Router) + TypeScript (strict) + Tailwind CSS
- Deploy na Vercel
- pnpm como gerenciador de pacotes
- Vitest para testes da lógica do jogo
- Sem banco de dados no MVP. Catálogo em JSON versionado no repositório; estado do jogador em localStorage.

## Comandos

```bash
pnpm dev              # servidor local
pnpm build            # build de produção
pnpm test             # testes (Vitest)
pnpm lint             # ESLint
pnpm typecheck        # tsc --noEmit
pnpm catalog:resolve  # preenche deezerId dos artistas novos do catálogo
pnpm pool:build       # gera os pools de músicas a partir do catálogo
pnpm schedule:build   # gera a agenda dos desafios diários
```

## Regras do jogo

**Rodada:** toca um trecho do preview de 30s do Deezer. O jogador escolhe 1 entre 4 opções. Erro ou acerto, a rodada termina e a resposta é revelada (título, artista, álbum, capa, link do Deezer).

**Opções:** durante o palpite, cada opção mostra o título da música com o artista embaixo. Composição das 3 opções erradas: 2 do mesmo artista da resposta + 1 de outro artista da mesma categoria. Se o artista não tiver músicas suficientes, completar com outros artistas da categoria. Nenhuma opção pode ser outra versão da resposta (ao vivo, remaster etc.) nem ter título igual ao de outra opção.

**Respostas:** só os 10% mais populares de cada artista (pelo rank do Deezer, mínimo de 3 músicas) podem ser a resposta, com mais peso para as mais tocadas. As outras músicas só aparecem como opções erradas. Ajustável em `lib/game/config.ts` (`TOP_SHARE_PER_ARTIST`, `MIN_TOP_SONGS_PER_ARTIST`).

**Modos:**
- **Desafio diário:** 5 músicas por categoria por dia, iguais para todos. Vira à meia-noite de `America/Sao_Paulo`. Cada categoria tem o seu. Não pode rejogar o dia. Resultado final X/5 com texto compartilhável (ex.: `🟩🟥🟩🟩🟩`).
- **Infinito/treino:** músicas aleatórias da categoria, sem fim, com contagem de sequência de acertos. Não repetir músicas dentro da sessão.
- **Modo difícil:** toggle global que vale para os dois modos. Trecho de 5s em vez da duração normal.

Durações ficam em `lib/game/config.ts` (`NORMAL_CLIP_SECONDS = 15`, `HARD_CLIP_SECONDS = 5`), fáceis de ajustar.

## Fonte de dados: API do Deezer

- Base: `https://api.deezer.com`. Pública, sem autenticação.
- Endpoints usados: `/search/artist?q=`, `/artist/{id}`, `/artist/{id}/albums`, `/album/{id}/tracks`, `/track/{id}`.
- **As URLs de preview expiram.** Nunca persistir URL de preview. Persistir só IDs de faixa e buscar `/track/{id}` na hora de tocar.
- **Sem CORS para o navegador.** Toda chamada ao Deezer acontece no servidor (route handlers) ou nos scripts. O código do cliente do Deezer fica em `lib/deezer/` com `import "server-only"`.
- Limite aproximado de 50 requisições a cada 5s. O cliente deve ter fila/throttle e retry com backoff.
- O Deezer pode devolver erro com HTTP 200 e um objeto `{ "error": { ... } }` no corpo. Tratar isso como erro.
- Listas são paginadas (`index`, `limit`, campo `next`). Sempre percorrer até o fim.
- Algumas faixas vêm com `preview` vazio. Essas são descartadas.

## Dados

```
data/
  catalog.json                    # CURADO À MÃO. Categorias e artistas.
  generated/
    pools/{categoria}.json        # GERADO por pool:build. Não editar à mão.
    schedules/{categoria}.json    # GERADO por schedule:build. Não editar à mão.
```

**`catalog.json`** é a fonte da verdade da curadoria:

```json
{
  "categories": [
    { "slug": "rock-gaucho", "name": "Rock Gaúcho", "description": "..." }
  ],
  "artists": [
    {
      "name": "Engenheiros do Hawaii",
      "deezerId": null,
      "categories": ["rock-gaucho", "rock-br"],
      "excludeAlbumIds": [],
      "excludeTrackIds": [],
      "notes": ""
    }
  ]
}
```

Um artista pode estar em várias categorias. `deezerId: null` significa "ainda não resolvido".

**`catalog:resolve`** busca no Deezer os artistas com `deezerId: null`. Só grava o ID automaticamente quando há correspondência exata de nome e o candidato é claramente o mais popular (`nb_fan`). Nos casos ambíguos, imprime os 3 melhores candidatos (nome, fãs, link) e não grava nada. Nunca chutar.

**`pool:build`** monta, por categoria, a lista de músicas jogáveis:
- Percorre álbuns e faixas de cada artista, respeitando as exclusões do catálogo.
- **Deduplica versões da mesma música.** Normaliza o título (minúsculas, sem acento, removendo marcadores como "Ao Vivo", "Live", "Acústico", "Remaster", "Versão", "feat.", conteúdo entre parênteses/colchetes desse tipo). Mantém uma entrada por música, preferindo a versão de estúdio de álbum (`record_type: "album"`) mais antiga; as outras versões ficam em `altTrackIds`.
- Descarta faixas sem preview e faixas muito curtas (vinhetas, intros: < 60s).
- Cada música tem um `id` estável derivado de artista + título normalizado (não do ID do Deezer).
- Ao final, imprime um resumo por categoria e avisa se alguma tiver poucas músicas para sustentar o desafio diário.

**`schedule:build`** gera a agenda dos próximos N dias (padrão 60) por categoria, sem sobrescrever dias passados nem o dia atual. Cada dia guarda as 5 músicas **e as opções de cada rodada já embaralhadas**, para todo mundo ver exatamente o mesmo desafio. Evitar repetir música dentro de 90 dias e evitar dois artistas iguais no mesmo dia quando possível.

## Arquitetura e anti-trapaça

A resposta nunca vai para o cliente antes do palpite. O cliente não recebe IDs do Deezer nem IDs de música durante a rodada; as opções são identificadas só pela posição (0 a 3).

- **Diário:**
  - `GET /api/daily/[category]` devolve as 5 rodadas do dia de hoje (só títulos das opções).
  - `GET /api/daily/[category]/[index]/audio` resolve a faixa no servidor, busca o preview fresco e redireciona (302). Nunca servir datas futuras.
  - `POST /api/daily/[category]/[index]/guess` recebe a posição escolhida e devolve se acertou + a resposta completa.
- **Infinito:** o servidor sorteia a música, monta as opções e devolve um **token criptografado** (AES-256-GCM, segredo em `ROUND_SECRET`) que contém a resposta. Atenção: token só assinado (base64 legível) vazaria a resposta. Áudio e palpite recebem esse token. Para não repetir na sessão, o cliente envia os tokens recentes e o servidor exclui essas músicas.
- Cachear a resposta de `/track/{id}` por poucos minutos para não martelar o Deezer.

## Estado do cliente (localStorage)

Chave versionada (ex.: `game:v1`). Guarda: progresso do diário por categoria e data, estatísticas por categoria e modo (jogos, acertos, sequência atual e máxima, distribuição de acertos no diário), e preferências (modo difícil). Ler com fallback seguro se a chave estiver ausente ou corrompida.

## Estrutura de pastas

```
app/
  page.tsx                          # escolha de categoria
  [category]/page.tsx               # desafio diário
  [category]/infinito/page.tsx      # modo infinito
  api/...                           # route handlers acima
components/
lib/
  deezer/       # cliente server-only, throttle, retry, tipos
  game/         # lógica pura: normalização, opções, agenda, pontuação, texto de compartilhar
  rounds/       # tokens criptografados do modo infinito
  storage/      # leitura/escrita do localStorage
data/
scripts/        # catalog-resolve.ts, build-pool.ts, build-schedule.ts
```

## Convenções

- Código, nomes e comentários em inglês. Textos da interface em português do Brasil.
- TypeScript strict, sem `any`. Tipos do Deezer em `lib/deezer/types.ts`.
- Lógica do jogo em `lib/game/` é pura (sem I/O, sem data atual implícita: receber a data como parâmetro) e tem testes. Normalização de títulos e montagem de opções são as partes mais importantes de testar.
- Mobile-first. Áudio só começa com gesto do usuário (restrição do iOS). Suporte a tema claro e escuro.
- Perguntar antes de adicionar dependências novas.
- Nunca editar arquivos em `data/generated/` à mão: corrigir o catálogo ou o script e regenerar.
- Segredos só em `.env.local` (e `.env.example` com os nomes, sem valores).

## Fora do escopo do MVP

Login, ranking, banco de dados, sugestão de artistas pelos usuários, YouTube como fonte alternativa, monetização. Não implementar sem pedido explícito, mas não tomar decisões que tornem isso difícil depois.

@AGENTS.md
