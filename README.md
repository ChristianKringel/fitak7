# Musicle RS

Jogo de adivinhar músicas pelo trecho, focado em categorias de nicho: rock gaúcho, música gaúcha/nativista, bandinhas e rock brasileiro. O jogador ouve um trecho do preview do Deezer e escolhe o título certo entre 4 opções.

- **Desafio diário:** 5 músicas por categoria, iguais para todo mundo, que mudam à meia-noite (horário de Brasília).
- **Modo infinito:** músicas aleatórias sem fim, com contagem de acertos seguidos.
- **Modo difícil:** trecho de 5s em vez de 15s, nos dois modos.

As regras completas e as decisões de arquitetura estão no [`CLAUDE.md`](CLAUDE.md).

## Requisitos

- Node.js 24 ou mais recente
- pnpm (`corepack enable` ou `npm install -g pnpm`)

## Rodando localmente

```bash
# 1. Instalar as dependências
pnpm install

# 2. Criar o .env.local com o segredo dos tokens do modo infinito
#    (gera um valor aleatório; nunca sobrescreve um segredo já preenchido)
pnpm env:setup

# 3. Subir o servidor de desenvolvimento
pnpm dev
```

Abra http://localhost:3000.

Os dados (`data/catalog.json` e `data/generated/`) já estão no repositório, então o jogo funciona sem rodar nenhum script. Só regenere quando mudar o catálogo (veja abaixo).

### Testando no celular

Com o celular na mesma rede Wi-Fi do computador:

```bash
pnpm dev --hostname 0.0.0.0
```

e abra `http://<ip-do-computador>:3000` no celular. O IP aparece com `hostname -I` (Linux) ou `ipconfig` (Windows).

### Testando o build de produção

```bash
pnpm build
pnpm start
```

## Comandos

| Comando | O que faz |
|---|---|
| `pnpm dev` | Servidor de desenvolvimento |
| `pnpm build` / `pnpm start` | Build e servidor de produção |
| `pnpm test` | Testes (Vitest) |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | Checagem de tipos |
| `pnpm env:setup` | Cria o `.env.local` com um `ROUND_SECRET` aleatório |
| `pnpm catalog:resolve` | Busca no Deezer o `deezerId` dos artistas novos do catálogo |
| `pnpm pool:build` | Gera a lista de músicas jogáveis de cada categoria |
| `pnpm schedule:build` | Gera a agenda dos desafios diários (próximos 60 dias) |

## Editando o catálogo

Toda a curadoria fica em `data/catalog.json`. Nunca edite `data/generated/` à mão: esses arquivos são gerados pelos scripts.

### Adicionar um artista

1. Adicione o artista em `artists`, com `"deezerId": null` e as categorias dele:

   ```json
   {
     "name": "Nome do Artista",
     "deezerId": null,
     "categories": ["rock-gaucho"],
     "excludeAlbumIds": [],
     "excludeTrackIds": [],
     "notes": ""
   }
   ```

2. Rode `pnpm catalog:resolve`. Ele só grava o ID quando a correspondência é clara. Nos casos ambíguos, mostra os 3 melhores candidatos com link, e você copia o ID certo para o catálogo.
3. Regenere os dados:

   ```bash
   pnpm pool:build
   pnpm schedule:build
   ```

### Remover músicas ou álbuns

- **Música ruim** (versão estranha, título errado, música que não deveria estar lá): coloque o ID de qualquer versão dela em `excludeTrackIds`. A música inteira sai, com todas as versões.
- **Álbum inteiro** (coletânea bagunçada, álbum em espanhol, etc.): coloque o ID do álbum em `excludeAlbumIds`.

O ID aparece no link do Deezer: `deezer.com/track/123` → `123`; `deezer.com/album/456` → `456`. Para ver como as versões foram agrupadas, rode `pnpm pool:build --sample=rock-gaucho`.

Depois de editar, rode `pnpm pool:build` e `pnpm schedule:build`.

### Agenda do desafio diário

`pnpm schedule:build` mantém os dias passados e o dia de hoje, e refaz os dias seguintes a partir do pool atual. Assim, exclusões no catálogo valem a partir de amanhã. A agenda cobre os próximos 60 dias (`--days=N` muda isso). Ela precisa ser regenerada e publicada antes de acabar, senão o diário fica sem desafio.

## Estrutura

```
app/                    páginas e rotas de API (Next.js App Router)
components/             componentes da interface
lib/deezer/             cliente do Deezer (só servidor): throttle, retry, cache
lib/game/               lógica pura do jogo, com testes
lib/rounds/             tokens criptografados do modo infinito
lib/server/             leitura dos dados e helpers das rotas
lib/storage/            estado do jogador no localStorage
data/catalog.json       curadoria (editada à mão)
data/generated/         pools e agendas (gerados pelos scripts)
scripts/                catalog-resolve, build-pool, build-schedule
```

## Observações

- Todas as chamadas ao Deezer passam pelo servidor. As URLs de preview expiram, então o servidor busca uma nova a cada vez que o trecho toca.
- O progresso e as estatísticas ficam no navegador (localStorage). Limpar os dados do site zera tudo.
- O áudio só começa com um toque do usuário, por exigência do iOS.
