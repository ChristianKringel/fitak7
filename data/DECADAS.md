# Décadas

Artistas das categorias por década, espelhando `data/catalog.json`. Ao adicionar, remover ou mover artistas dessas categorias no catálogo, atualizar este arquivo junto.

## Como funcionam

- Só música brasileira.
- Cada década é uma **lista de hits** (`years` na categoria do catálogo). Só entram artistas relevantes na década, cada um com um limite de músicas: **7** para os ícones da década, **3** por padrão e **1** para hit único (`hits` do artista no catálogo). Entram as músicas mais populares do artista no Deezer lançadas na década, até o limite, e as listadas em `include` entram sempre. As regras ficam em `lib/game/config.ts` e `lib/game/hits.ts`.
- No desafio diário e no Hardcore nunca caem duas músicas do mesmo artista no mesmo dia.
- Cada artista tem um gênero (`genre` no catálogo), usado no modo Hardcore. Ver "Gêneros" no fim deste arquivo.
- Todas as músicas da lista podem ser resposta, e as opções erradas também saem dela.
- O ano de lançamento vem do MusicBrainz. Quando ele errar ou não achar, corrigir no `songYears` do artista no catálogo.
- Um artista pode estar em várias décadas. Músicas de fora da década são filtradas, então incluir um artista a mais não prejudica o pool: se ele não tiver hit na década, simplesmente não entra.

## Níveis (proposta em revisão)

Cada década lista os artistas por nível. O número entre parênteses é quantas músicas do artista se qualificaram na década no último build (lançadas na década, entre as 40 mais populares dele e acima do rank mínimo), antes do limite. Um ícone com menos de 7 entra com as que tiver.

Os níveis ainda não estão no catálogo: hoje todos usam o padrão de 3. Depois da revisão, viram `hits` no `catalog.json`, e os artistas da lista "tirar" saem da década.

## Resumo

| Categoria | Slug | Anos | Artistas |
|---|---|---|---|
| Anos 70 | `anos-70` | 1970–1979 | 89 |
| Anos 80 | `anos-80` | 1980–1989 | 124 |
| Anos 90 | `anos-90` | 1990–1999 | 128 |
| Anos 2000 | `anos-2000` | 2000–2009 | 98 |
| Anos 2010 | `anos-2010` | 2010–2019 | 109 |
| Anos 2020 | `anos-2020` | 2020–2029 | 100 |

## Anos 70 (`anos-70`)

Sucessos brasileiros lançados entre 1970 e 1979.

### Ícones: 7 músicas

- Belchior (27)
- Caetano Veloso (9)
- Chico Buarque (24)
- Clara Nunes (9)
- Elis Regina (25)
- Gal Costa (12)
- Gilberto Gil (11)
- Milton Nascimento (20)
- Raul Seixas (29)
- Rita Lee (12)
- Roberto Carlos (17)
- Tim Maia (20)

### Padrão: 3 músicas

- Alcione (7)
- Amado Batista (2)
- Antonio Carlos Jobim (6)
- Benito di Paula (5)
- Beth Carvalho (7)
- Beto Guedes (5)
- Cartola (8)
- Djavan (4)
- Erasmo Carlos (7)
- Fagner (6)
- Fernando Mendes (8)
- Gonzaguinha (6)
- Guilherme Arantes (4)
- Ivan Lins (6)
- João Bosco (4)
- Jorge Ben Jor (6)
- Luiz Melodia (6)
- Maria Bethânia (10)
- Martinho da Vila (4)
- Milionário & José Rico (7)
- Ney Matogrosso (5)
- Novos Baianos (11)
- Originais do Samba (7)
- Paulinho da Viola (5)
- Secos & Molhados (9)
- Sérgio Reis (2)
- Sidney Magal (2)
- Simone (3)
- Toquinho (13)
- Zé Ramalho (9)

### Hit único: 1 música

- 14 Bis (1)
- A Cor do Som (1)
- Alceu Valença (1)
- Antônio Marcos (2)
- Banda Black Rio (2)
- Casa das Máquinas (1)
- Cassiano (3)
- Ednardo (2)
- Evaldo Braga (2)
- Gretchen (1)
- Hyldon (3)
- Lindomar Castilho (1)
- Nelson Ned (1)
- Os Mutantes (2)
- Peninha (1)
- Reginaldo Rossi (1)
- Roberto Ribeiro (1)
- Sérgio Sampaio (1)
- Teixeirinha (1)
- Vanusa (2)
- Wando (1)

### Sem nenhum hit no último build

Manter e corrigir: o sucesso é da década, mas ficou de fora por falta de ano no MusicBrainz ou por rank baixo no Deezer. Precisa de `songYears` ou `include` no catálogo.

- As Frenéticas
- Baby do Brasil
- Dona Ivone Lara
- Léo Canhoto & Robertinho
- Moraes Moreira
- O Terço
- Odair José
- Sá, Rodrix & Guarabyra
- Taiguara
- Waldick Soriano
- Wilson Simonal

Sugestão: tirar da década (sucessos de outra época, ou artista periférico).

- Agepê
- Agnaldo Timóteo
- Carlos Dafé
- Dalto
- Fábio Jr.
- Fafá de Belém
- Jair Rodrigues
- Jessé
- Made in Brazil
- Pena Branca & Xavantinho
- Pepeu Gomes
- Tião Carreiro & Pardinho
- Tonico & Tinoco
- Trio Parada Dura
- Vinicius de Moraes

## Anos 80 (`anos-80`)

Sucessos brasileiros lançados entre 1980 e 1989.

### Ícones: 7 músicas

- Barão Vermelho (6)
- Cazuza (21)
- Djavan (16)
- Gilberto Gil (15)
- Kid Abelha (15)
- Legião Urbana (25)
- Lulu Santos (18)
- Os Paralamas do Sucesso (19)
- Rita Lee (13)
- Roupa Nova (19)
- RPM (10)
- Titãs (22)
- Ultraje a Rigor (10)

### Padrão: 3 músicas

- 14 Bis (5)
- A Turma do Balão Mágico (3)
- Alceu Valença (8)
- Alcione (8)
- Almir Guineto (7)
- Amado Batista (5)
- Beth Carvalho (5)
- Bezerra da Silva (14)
- Biquini Cavadão (5)
- Blitz (7)
- Caetano Veloso (10)
- Camisa de Vênus (5)
- Capital Inicial (7)
- Chiclete com Banana (2)
- Chico Buarque (8)
- Chitãozinho & Xororó (5)
- Chrystian & Ralf (9)
- Clara Nunes (2)
- Ed Motta (2)
- Elba Ramalho (3)
- Engenheiros do Hawaii (7)
- Erasmo Carlos (4)
- Fábio Jr. (2)
- Fafá de Belém (3)
- Fagner (12)
- Fundo de Quintal (11)
- Gal Costa (13)
- Gonzaguinha (9)
- Guilherme Arantes (9)
- Ira! (8)
- Ivan Lins (4)
- Joanna (3)
- Jorge Aragão (4)
- Jorge Ben Jor (6)
- José Augusto (8)
- Leandro & Leonardo (2)
- Leci Brandão (4)
- Léo Jaime (4)
- Lobão (10)
- Luiz Caldas (3)
- Maria Bethânia (5)
- Marina Lima (11)
- Marisa Monte (3)
- Milionário & José Rico (10)
- Milton Nascimento (9)
- Nenhum de Nós (2)
- Ney Matogrosso (7)
- Oswaldo Montenegro (4)
- Pepeu Gomes (4)
- Raul Seixas (9)
- Reginaldo Rossi (11)
- Roberta Miranda (2)
- Roberto Carlos (4)
- Sandra de Sá (6)
- Sérgio Reis (3)
- Simone (2)
- Tim Maia (6)
- Toquinho (4)
- Trem da Alegria (10)
- Trio Parada Dura (2)
- Wando (3)
- Xuxa (8)
- Zé Ramalho (10)
- Zeca Pagodinho (10)

### Hit único: 1 música

- Absyntho (1)
- Baby do Brasil (1)
- Dalto (3)
- Eduardo Dusek (1)
- Emílio Santiago (1)
- Gretchen (1)
- Hanói-Hanói (1)
- Heróis da Resistência (3)
- Herva Doce (1)
- Inimigos do Rei (1)
- João Penca e Seus Miquinhos Amestrados (2)
- Jovelina Pérola Negra (1)
- Kaoma (3)
- Kiko Zambianchi (2)
- Martinho da Vila (1)
- Metrô (3)
- Moraes Moreira (1)
- Pena Branca & Xavantinho (1)
- Rádio Táxi (2)
- Ritchie (6)
- Rosana (3)
- Sempre Livre (2)
- Tunai (1)
- Uns e Outros (2)

### Sem nenhum hit no último build

Manter e corrigir: o sucesso é da década, mas ficou de fora por falta de ano no MusicBrainz ou por rank baixo no Deezer. Precisa de `songYears` ou `include` no catálogo.

- Agepê
- Ângela Rô Rô
- Angélica
- Banda Mel
- Beto Barbosa
- Dr. Silvana & Cia
- Gang 90 & Absurdettes
- Magazine
- Plebe Rude
- Polegar
- Sarajane
- Sidney Magal
- Yahoo
- Zizi Possi

Sugestão: tirar da década (sucessos de outra época, ou artista periférico).

- Agnaldo Timóteo
- Fernando Mendes
- Jessé
- Nelson Ned
- Peninha
- Rionegro & Solimões
- Roberto Ribeiro
- Tonico & Tinoco
- Vinicius de Moraes

## Anos 90 (`anos-90`)

Sucessos brasileiros lançados entre 1990 e 1999.

### Ícones: 7 músicas

- Cássia Eller (18)
- Chitãozinho & Xororó (21)
- Leandro & Leonardo (36)
- Legião Urbana (14)
- Mamonas Assassinas (13)
- Marisa Monte (13)
- O Rappa (15)
- Raça Negra (24)
- Raimundos (33)
- Skank (18)
- Só Pra Contrariar (28)
- Zezé Di Camargo & Luciano (26)

### Padrão: 3 músicas

- Adriana Calcanhotto (8)
- Ana Carolina (4)
- Ara Ketu (11)
- Art Popular (18)
- Asa de Águia (5)
- Banda Eva (11)
- Barão Vermelho (15)
- Biquini Cavadão (15)
- Bruno & Marrone (6)
- Caetano Veloso (8)
- Capital Inicial (7)
- Charlie Brown Jr. (6)
- Chiclete com Banana (8)
- Chico César (3)
- Chico Science & Nação Zumbi (15)
- Chrystian & Ralf (15)
- Cidade Negra (16)
- Claudinho & Buchecha (10)
- Daniel (4)
- Daniela Mercury (5)
- Djavan (12)
- É o Tchan (9)
- Ed Motta (2)
- Engenheiros do Hawaii (16)
- Exaltasamba (11)
- Fábio Jr. (12)
- Fernanda Abreu (4)
- Fundo de Quintal (11)
- Gabriel o Pensador (11)
- Gal Costa (6)
- Gian & Giovani (16)
- Gilberto Gil (2)
- Grupo Malícia (4)
- Grupo Raça (6)
- Harmonia do Samba (4)
- João Mineiro & Marciano (9)
- João Paulo & Daniel (28)
- Jorge Ben Jor (5)
- Jota Quest (6)
- Karametade (7)
- Katinguelê (6)
- Kid Abelha (12)
- Latino (2)
- Lenine (6)
- Leonardo (4)
- Los Hermanos (10)
- Lulu Santos (8)
- Maria Bethânia (12)
- Marina Lima (8)
- MC Marcinho (3)
- Milionário & José Rico (5)
- Milton Nascimento (3)
- Molejo (8)
- Natiruts (4)
- Negritude Júnior (7)
- Nenhum de Nós (7)
- Netinho (4)
- Ney Matogrosso (7)
- Olodum (5)
- Os Paralamas do Sucesso (14)
- Os Travessos (4)
- Pato Fu (5)
- Pique Novo (3)
- Planet Hemp (12)
- Rick & Renner (13)
- Rionegro & Solimões (11)
- Rita Lee (4)
- Roberta Miranda (6)
- Roberto Carlos (4)
- Roupa Nova (9)
- Sampa Crew (3)
- Sérgio Reis (4)
- Soweto (27)
- Terra Samba (4)
- Timbalada (11)
- Titãs (9)
- Ultraje a Rigor (4)
- Wando (2)
- Zeca Baleiro (6)
- Zeca Pagodinho (11)
- Zélia Duncan (5)

### Hit único: 1 música

- As Meninas (1)
- Banda Beijo (1)
- Banda Calypso (1)
- Cheiro de Amor (1)
- Chico Buarque (1)
- Companhia do Pagode (1)
- Edson & Hudson (1)
- Ivete Sangalo (1)
- Kiloucura (2)
- Maurício Manieri (2)
- Nando Reis (1)
- Os Morenos (2)
- Patrícia Marx (2)
- Tianastácia (3)
- Vanessa Rangel (1)
- Virgulóides (1)

### Sem nenhum hit no último build

Manter e corrigir: o sucesso é da década, mas ficou de fora por falta de ano no MusicBrainz ou por rank baixo no Deezer. Precisa de `songYears` ou `include` no catálogo.

- A Zorra
- Carrapicho
- Cor da Pele
- Maskavo Roots
- Penélope
- Racionais MC's
- Ronaldo e os Barcellos
- Sandy & Junior
- Swing & Simpatia

Sugestão: tirar da década (sucessos de outra época, ou artista periférico).

- Alexandre Pires
- Banda Mel
- Bell Marques
- Belo
- Bokaloka
- Grupo Revelação
- Kelly Key
- Kiko Zambianchi
- Pixote
- Turma do Pagode

## Anos 2000 (`anos-2000`)

Sucessos brasileiros lançados entre 2000 e 2009.

### Ícones: 7 músicas

- Ana Carolina (24)
- Bruno & Marrone (19)
- Calcinha Preta (27)
- Charlie Brown Jr. (25)
- CPM 22 (31)
- Grupo Revelação (32)
- Ivete Sangalo (16)
- Los Hermanos (29)
- NX Zero (20)
- Pitty (22)
- Sandy & Junior (22)
- Victor & Leo (28)

### Padrão: 3 músicas

- Armandinho (24)
- Aviões do Forró (19)
- Babado Novo (7)
- Banda Calypso (2)
- Belo (30)
- Biquini Cavadão (3)
- Cachorro Grande (3)
- Capital Inicial (16)
- Cássia Eller (14)
- César Menotti & Fabiano (14)
- Chiclete com Banana (10)
- Chimarruts (14)
- Claudia Leitte (4)
- Claudinho & Buchecha (4)
- Daniel (16)
- Diogo Nogueira (5)
- Djavan (2)
- Edson & Hudson (17)
- Engenheiros do Hawaii (14)
- Exaltasamba (15)
- Falamansa (18)
- Forfun (17)
- Frejat (7)
- Fresno (10)
- Gabriel o Pensador (5)
- Ira! (8)
- Jeito Moleque (26)
- João Bosco & Vinícius (7)
- Jorge & Mateus (5)
- Jota Quest (4)
- Kelly Key (10)
- KLB (13)
- Latino (3)
- Leonardo (11)
- Leoni (12)
- Marcelo D2 (5)
- Maria Rita (17)
- Marisa Monte (14)
- MC Marcinho (12)
- Nando Reis (19)
- Natiruts (15)
- O Rappa (16)
- Os Paralamas do Sucesso (4)
- Parangolé (4)
- Paula Fernandes (8)
- Pedro Mariano (3)
- Pixote (8)
- Raimundos (2)
- Restart (5)
- Rionegro & Solimões (7)
- Roberta Sá (6)
- Rodriguinho (5)
- Rouge (12)
- Seu Jorge (15)
- Skank (15)
- Só Pra Contrariar (4)
- Sorriso Maroto (19)
- Swing & Simpatia (3)
- Tihuana (8)
- Titãs (7)
- Tribalistas (13)
- Vanessa da Mata (14)
- Wanessa Camargo (14)
- Zeca Pagodinho (12)
- Zélia Duncan (4)
- Zezé Di Camargo & Luciano (11)

### Hit único: 1 música

- Bonde do Tigrão (1)
- Dibob (1)
- Fat Family (3)
- Felipe Dylon (1)
- O Surto (3)
- Perlla (4)
- Psirico (1)
- Strike (4)
- Tati Quebra Barraco (1)

### Sem nenhum hit no último build

Manter e corrigir: o sucesso é da década, mas ficou de fora por falta de ano no MusicBrainz ou por rank baixo no Deezer. Precisa de `songYears` ou `include` no catálogo.

- Bom Gosto
- Br'oz
- Cine
- Detonautas
- Luka
- Turma do Pagode

Sugestão: tirar da década (sucessos de outra época, ou artista periférico).

- Bonde do Rolê
- Di Propósito
- Hateen
- Rogério Flausino
- Sandy

## Anos 2010 (`anos-2010`)

Sucessos brasileiros lançados entre 2010 e 2019.

### Ícones: 7 músicas

- Anitta (4)
- Cristiano Araújo (31)
- Gusttavo Lima (15)
- Henrique & Juliano (14)
- Jorge & Mateus (23)
- Luan Santana (22)
- Maiara & Maraisa (20)
- Marília Mendonça (23)
- Matheus & Kauan (17)
- Simone & Simaria (26)
- Thiaguinho (17)
- Wesley Safadão (13)
- Zé Neto & Cristiano (13)

### Padrão: 3 músicas

- Alok (8)
- Anavitória (22)
- Atitude 67 (13)
- Aviões do Forró (11)
- Belo (8)
- BK' (10)
- Bruninho & Davi (10)
- Bruno & Marrone (6)
- Clarice Falcão (15)
- Claudia Leitte (3)
- Criolo (29)
- Dilsinho (13)
- Djonga (14)
- Emicida (26)
- Exaltasamba (14)
- Fernando & Sorocaba (21)
- Ferrugem (15)
- Filipe Ret (12)
- Fresno (16)
- Gloria Groove (7)
- Guilherme & Santiago (7)
- Haikaiss (11)
- Henrique & Diego (14)
- Humberto & Ronaldo (13)
- Imaginasamba (3)
- Israel & Rodolffo (7)
- Israel Novaes (5)
- Ivete Sangalo (6)
- Iza (14)
- Jads & Jadson (12)
- Jão (6)
- João Neto & Frederico (17)
- Lagum (16)
- Léo Santana (9)
- Lexa (7)
- Lucas Lucco (12)
- Ludmilla (9)
- Malta (16)
- Marcelo Falcão (12)
- Marcos & Belutti (20)
- Maria Gadú (11)
- MC Carol (3)
- MC Kekel (3)
- MC Kevinho (6)
- MC Livinho (4)
- Melim (17)
- Michel Teló (14)
- Mumuzinho (14)
- Munhoz & Mariano (7)
- Naiara Azevedo (7)
- Nego do Borel (5)
- Pabllo Vittar (9)
- Paula Fernandes (23)
- Péricles (15)
- Pixote (8)
- Projota (27)
- Psirico (3)
- Rael (7)
- Restart (3)
- Scalene (3)
- Silva (27)
- Solange Almeida (4)
- Sorriso Maroto (14)
- Supercombo (7)
- Thaeme & Thiago (11)
- Tiago Iorc (23)
- Tiê (4)
- Turma do Pagode (21)
- Victor & Leo (11)
- Vintage Culture (9)
- Vitor Kley (5)
- Xand Avião (5)

### Hit único: 1 música

- Banda Uó (1)
- Delano (2)
- Dennis DJ (1)
- Gaab (2)
- Liniker (1)
- Mano Walter (2)
- Maria Cecília & Rodolfo (1)
- MC Guimê (2)
- MC João (1)
- MC K9 (1)
- MC Loma e as Gêmeas Lacração (3)
- Naldo Benny (2)
- Pocah (1)
- Valesca Popozuda (3)

### Sem nenhum hit no último build

Manter e corrigir: o sucesso é da década, mas ficou de fora por falta de ano no MusicBrainz ou por rank baixo no Deezer. Precisa de `songYears` ou `include` no catálogo.

- Kevin o Chris
- MC Romântico
- Pikeno & Menor
- Tati Zaqui

Sugestão: tirar da década (sucessos de outra época, ou artista periférico).

- Fred & Gustavo
- Harmonia do Samba
- MC Brinquedo
- MC Hariel
- Mr. Catra
- Zé Henrique & Gabriel

## Anos 2020 (`anos-2020`)

Sucessos brasileiros lançados entre 2020 e 2026.

### Ícones: 7 músicas

- Ana Castela (24)
- Anitta (36)
- Henrique & Juliano (26)
- Jão (34)
- João Gomes (38)
- Ludmilla (31)
- Luísa Sonza (33)
- Marília Mendonça (14)
- Marina Sena (36)
- Matuê (33)
- Os Barões da Pisadinha (22)
- Veigh (38)
- Zé Neto & Cristiano (22)

### Padrão: 3 músicas

- Alok (31)
- Ana Gabriela (5)
- Anavitória (18)
- Baco Exu do Blues (31)
- BK' (26)
- Clayton & Romário (6)
- Diego & Victor Hugo (10)
- Dilsinho (3)
- Djonga (23)
- Duda Beat (11)
- Felipe Amorim (32)
- Felipe Araújo (5)
- Ferrugem (11)
- Filipe Ret (23)
- George Henrique & Rodrigo (3)
- Gloria Groove (32)
- Guilherme & Benuto (11)
- Gustavo Mioto (5)
- Gusttavo Lima (9)
- Hugo & Guilherme (16)
- Israel & Rodolffo (16)
- Ivete Sangalo (16)
- Iza (13)
- Jorge & Mateus (9)
- Kayblack (21)
- L7nnon (31)
- Lagum (22)
- Lauana Prado (8)
- Léo Foguete (32)
- Léo Santana (25)
- Liniker (25)
- Luan Santana (12)
- Maiara & Maraisa (2)
- Mari Fernandez (29)
- Matheus & Kauan (7)
- MC Cabelinho (13)
- MC Hariel (4)
- MC Ryan SP (1)
- Melim (22)
- Mumuzinho (15)
- Murilo Huff (7)
- Nattan (17)
- Orochi (10)
- Os Garotin (27)
- Pabllo Vittar (27)
- Pedro Sampaio (29)
- Péricles (19)
- Pixote (13)
- Priscilla (5)
- Simone Mendes (9)
- Teto (31)
- Thiago Pantaleão (6)
- Thiaguinho (21)
- Turma do Pagode (15)
- Vintage Culture (24)
- Vitor Kley (7)
- Wesley Safadão (13)
- Xamã (21)
- Zé Felipe (18)
- Zé Vaqueiro (5)

### Hit único: 1 música

- Gaab (1)
- Grupo Revelação (1)
- Jeninho (1)
- Leonardo (2)
- MC Daniel (1)
- Sorriso Maroto (1)
- Tarcísio do Acordeon (2)
- Tz da Coronel (2)
- Vitor Fernandes (1)

### Sem nenhum hit no último build

Manter e corrigir: o sucesso é da década, mas ficou de fora por falta de ano no MusicBrainz ou por rank baixo no Deezer. Precisa de `songYears` ou `include` no catálogo.

- Danilo & Davi
- Dennis DJ
- DJ Japa NK
- Felipe & Rodrigo
- Henry Freitas
- Hungria Hip Hop
- João Gustavo & Murilo
- Júnior & Cézar
- Kaique & Felipe
- Kevin o Chris
- Luan Pereira
- Manu Bahtidão
- MC Lele JP
- Menos É Mais

Sugestão: tirar da década (sucessos de outra época, ou artista periférico).

- Belo
- Bom Gosto
- Racionais MC's
- Tribalistas

## Gêneros (modo Hardcore)

No modo Hardcore, a primeira etapa mostra 4 artistas da década, de preferência do mesmo gênero (`genre` do artista no catálogo). Se o gênero tiver menos de 4 artistas na década, completa com os gêneros vizinhos e, por último, com qualquer artista da década. Os gêneros e vizinhos ficam em `lib/game/genres.ts`. Entre parênteses, as décadas do artista.

### Rock (`rock`)

Vizinhos: Pop, Reggae.

- Barão Vermelho (80, 90)
- Biquini Cavadão (80, 90, 2000)
- Blitz (80)
- Cachorro Grande (2000)
- Camisa de Vênus (80)
- Capital Inicial (80, 90, 2000)
- Casa das Máquinas (70)
- Cazuza (80)
- Charlie Brown Jr. (90, 2000)
- Chico Science & Nação Zumbi (90)
- CPM 22 (2000)
- Cássia Eller (90, 2000)
- Detonautas (2000)
- Dibob (2000)
- Eduardo Dusek (80)
- Engenheiros do Hawaii (80, 90, 2000)
- Erasmo Carlos (70, 80)
- Forfun (2000)
- Frejat (2000)
- Fresno (2000, 2010)
- Hanói-Hanói (80)
- Hateen (2000)
- Herva Doce (80)
- Heróis da Resistência (80)
- Ira! (80, 2000)
- João Penca e Seus Miquinhos Amestrados (80)
- Kid Abelha (80, 90)
- Kiko Zambianchi (80, 90)
- Legião Urbana (80, 90)
- Leoni (2000)
- Lobão (80)
- Los Hermanos (90, 2000)
- Léo Jaime (80)
- Made in Brazil (70)
- Magazine (80)
- Malta (2010)
- Mamonas Assassinas (90)
- Marcelo Falcão (2010)
- Nando Reis (90, 2000)
- Nenhum de Nós (80, 90)
- NX Zero (2000)
- O Rappa (90, 2000)
- O Surto (2000)
- O Terço (70)
- Os Mutantes (70)
- Os Paralamas do Sucesso (80, 90, 2000)
- Pato Fu (90)
- Penélope (90)
- Pepeu Gomes (70, 80)
- Pitty (2000)
- Plebe Rude (80)
- Raimundos (90, 2000)
- Raul Seixas (70, 80)
- Rita Lee (70, 80, 90)
- RPM (80)
- Rádio Táxi (80)
- Scalene (2010)
- Secos & Molhados (70)
- Sempre Livre (80)
- Skank (90, 2000)
- Strike (2000)
- Supercombo (2010)
- Sá, Rodrix & Guarabyra (70)
- Tianastácia (90)
- Tihuana (2000)
- Titãs (80, 90, 2000)
- Ultraje a Rigor (80, 90)
- Uns e Outros (80)
- Virgulóides (90)
- Yahoo (80)

### Pop (`pop`)

Vizinhos: Rock, Reggae.

- 14 Bis (70, 80)
- A Cor do Som (70)
- Absyntho (80)
- Ana Gabriela (2020)
- Anavitória (2010, 2020)
- Anitta (2010, 2020)
- As Frenéticas (70)
- Banda Uó (2010)
- Br'oz (2000)
- Cine (2000)
- Clarice Falcão (2010)
- Dalto (70, 80)
- Dr. Silvana & Cia (80)
- Duda Beat (2020)
- Felipe Dylon (2000)
- Fernanda Abreu (90)
- Gang 90 & Absurdettes (80)
- Gloria Groove (2010, 2020)
- Gretchen (70, 80)
- Guilherme Arantes (70, 80)
- Inimigos do Rei (80)
- Iza (2010, 2020)
- Jota Quest (90, 2000)
- Jão (2010, 2020)
- Kelly Key (90, 2000)
- KLB (2000)
- Lagum (2010, 2020)
- Latino (90, 2000)
- Lexa (2010)
- Luka (2000)
- Lulu Santos (80, 90)
- Luísa Sonza (2020)
- Marina Lima (80, 90)
- Marina Sena (2020)
- Maurício Manieri (90)
- Melim (2010, 2020)
- Metrô (80)
- Pabllo Vittar (2010, 2020)
- Patrícia Marx (90)
- Polegar (80)
- Priscilla (2020)
- Restart (2000, 2010)
- Ritchie (80)
- Rogério Flausino (2000)
- Ronaldo e os Barcellos (90)
- Rouge (2000)
- Roupa Nova (80, 90)
- Sandy & Junior (90, 2000)
- Sandy (2000)
- Silva (2010)
- Thiago Pantaleão (2020)
- Tiago Iorc (2010)
- Tiê (2010)
- Vanessa Rangel (90)
- Vitor Kley (2010, 2020)
- Wanessa Camargo (2000)

### MPB (`mpb`)

Vizinhos: Soul e black music, Samba e pagode, Romântica e brega.

- Adriana Calcanhotto (90)
- Alceu Valença (70, 80)
- Ana Carolina (90, 2000)
- Antonio Carlos Jobim (70)
- Baby do Brasil (70, 80)
- Belchior (70)
- Beto Guedes (70)
- Caetano Veloso (70, 80, 90)
- Chico Buarque (70, 80, 90)
- Chico César (90)
- Djavan (70, 80, 90, 2000)
- Ednardo (70)
- Elis Regina (70)
- Emílio Santiago (80)
- Fafá de Belém (70, 80)
- Fagner (70, 80)
- Gal Costa (70, 80, 90)
- Gilberto Gil (70, 80, 90)
- Gonzaguinha (70, 80)
- Ivan Lins (70, 80)
- João Bosco (70)
- Lenine (90)
- Luiz Melodia (70)
- Maria Bethânia (70, 80, 90)
- Maria Gadú (2010)
- Maria Rita (2000)
- Marisa Monte (80, 90, 2000)
- Milton Nascimento (70, 80, 90)
- Moraes Moreira (70, 80)
- Ney Matogrosso (70, 80, 90)
- Novos Baianos (70)
- Oswaldo Montenegro (80)
- Pedro Mariano (2000)
- Roberta Sá (2000)
- Seu Jorge (2000)
- Simone (70, 80)
- Sérgio Sampaio (70)
- Taiguara (70)
- Toquinho (70, 80)
- Tribalistas (2000, 2020)
- Tunai (80)
- Vanessa da Mata (2000)
- Vinicius de Moraes (70, 80)
- Zeca Baleiro (90)
- Zizi Possi (80)
- Zé Ramalho (70, 80)
- Zélia Duncan (90, 2000)
- Ângela Rô Rô (80)

### Soul e black music (`soul`)

Vizinhos: MPB, Pop.

- Banda Black Rio (70)
- Carlos Dafé (70)
- Cassiano (70)
- Ed Motta (80, 90)
- Fat Family (2000)
- Hyldon (70)
- Jorge Ben Jor (70, 80, 90)
- Liniker (2010, 2020)
- Os Garotin (2020)
- Sandra de Sá (80)
- Tim Maia (70, 80)
- Wilson Simonal (70)

### Samba e pagode (`samba`)

Vizinhos: Axé e música baiana, Soul e black music.

- Agepê (70, 80)
- Alcione (70, 80)
- Alexandre Pires (90)
- Almir Guineto (80)
- Art Popular (90)
- Atitude 67 (2010)
- Belo (90, 2000, 2010, 2020)
- Benito di Paula (70)
- Beth Carvalho (70, 80)
- Bezerra da Silva (80)
- Bokaloka (90)
- Bom Gosto (2000, 2020)
- Cartola (70)
- Clara Nunes (70, 80)
- Cor da Pele (90)
- Di Propósito (2000)
- Dilsinho (2010, 2020)
- Diogo Nogueira (2000)
- Dona Ivone Lara (70)
- Exaltasamba (90, 2000, 2010)
- Ferrugem (2010, 2020)
- Fundo de Quintal (80, 90)
- Gaab (2010, 2020)
- Grupo Malícia (90)
- Grupo Raça (90)
- Grupo Revelação (90, 2000, 2020)
- Imaginasamba (2010)
- Jair Rodrigues (70)
- Jeito Moleque (2000)
- Jorge Aragão (80)
- Jovelina Pérola Negra (80)
- Karametade (90)
- Katinguelê (90)
- Kiloucura (90)
- Leci Brandão (80)
- Martinho da Vila (70, 80)
- Menos É Mais (2020)
- Molejo (90)
- Mumuzinho (2010, 2020)
- Negritude Júnior (90)
- Originais do Samba (70)
- Os Morenos (90)
- Os Travessos (90)
- Paulinho da Viola (70)
- Pique Novo (90)
- Pixote (90, 2000, 2010, 2020)
- Péricles (2010, 2020)
- Raça Negra (90)
- Roberto Ribeiro (70, 80)
- Rodriguinho (2000)
- Sorriso Maroto (2000, 2010, 2020)
- Soweto (90)
- Swing & Simpatia (90, 2000)
- Só Pra Contrariar (90, 2000)
- Thiaguinho (2010, 2020)
- Turma do Pagode (90, 2000, 2010, 2020)
- Zeca Pagodinho (80, 90, 2000)

### Axé e música baiana (`axe`)

Vizinhos: Samba e pagode, Forró e piseiro.

- A Zorra (90)
- Ara Ketu (90)
- As Meninas (90)
- Asa de Águia (90)
- Babado Novo (2000)
- Banda Beijo (90)
- Banda Eva (90)
- Banda Mel (80, 90)
- Bell Marques (90)
- Beto Barbosa (80)
- Carrapicho (90)
- Cheiro de Amor (90)
- Chiclete com Banana (80, 90, 2000)
- Claudia Leitte (2000, 2010)
- Companhia do Pagode (90)
- Daniela Mercury (90)
- Harmonia do Samba (90, 2010)
- Ivete Sangalo (90, 2000, 2010, 2020)
- Kaoma (80)
- Luiz Caldas (80)
- Léo Santana (2010, 2020)
- Netinho (90)
- Olodum (90)
- Parangolé (2000)
- Psirico (2000, 2010)
- Sarajane (80)
- Terra Samba (90)
- Timbalada (90)
- É o Tchan (90)

### Sertanejo (`sertanejo`)

Vizinhos: Forró e piseiro, Romântica e brega.

- Ana Castela (2020)
- Bruninho & Davi (2010)
- Bruno & Marrone (90, 2000, 2010)
- Chitãozinho & Xororó (80, 90)
- Chrystian & Ralf (80, 90)
- Clayton & Romário (2020)
- Cristiano Araújo (2010)
- César Menotti & Fabiano (2000)
- Daniel (90, 2000)
- Danilo & Davi (2020)
- Diego & Victor Hugo (2020)
- Edson & Hudson (90, 2000)
- Felipe & Rodrigo (2020)
- Felipe Araújo (2020)
- Fernando & Sorocaba (2010)
- Fred & Gustavo (2010)
- George Henrique & Rodrigo (2020)
- Gian & Giovani (90)
- Guilherme & Benuto (2020)
- Guilherme & Santiago (2010)
- Gustavo Mioto (2020)
- Gusttavo Lima (2010, 2020)
- Henrique & Diego (2010)
- Henrique & Juliano (2010, 2020)
- Hugo & Guilherme (2020)
- Humberto & Ronaldo (2010)
- Israel & Rodolffo (2010, 2020)
- Israel Novaes (2010)
- Jads & Jadson (2010)
- Jorge & Mateus (2000, 2010, 2020)
- João Bosco & Vinícius (2000)
- João Gustavo & Murilo (2020)
- João Mineiro & Marciano (90)
- João Neto & Frederico (2010)
- João Paulo & Daniel (90)
- Júnior & Cézar (2020)
- Kaique & Felipe (2020)
- Lauana Prado (2020)
- Leandro & Leonardo (80, 90)
- Leonardo (90, 2000, 2020)
- Luan Pereira (2020)
- Luan Santana (2010, 2020)
- Lucas Lucco (2010)
- Léo Canhoto & Robertinho (70)
- Maiara & Maraisa (2010, 2020)
- Marcos & Belutti (2010)
- Maria Cecília & Rodolfo (2010)
- Marília Mendonça (2010, 2020)
- Matheus & Kauan (2010, 2020)
- Michel Teló (2010)
- Milionário & José Rico (70, 80, 90)
- Munhoz & Mariano (2010)
- Murilo Huff (2020)
- Naiara Azevedo (2010)
- Paula Fernandes (2000, 2010)
- Pena Branca & Xavantinho (70, 80)
- Rick & Renner (90)
- Rionegro & Solimões (80, 90, 2000)
- Roberta Miranda (80, 90)
- Simone & Simaria (2010)
- Simone Mendes (2020)
- Sérgio Reis (70, 80, 90)
- Teixeirinha (70)
- Thaeme & Thiago (2010)
- Tião Carreiro & Pardinho (70)
- Tonico & Tinoco (70, 80)
- Trio Parada Dura (70, 80)
- Victor & Leo (2000, 2010)
- Zezé Di Camargo & Luciano (90, 2000)
- Zé Felipe (2020)
- Zé Henrique & Gabriel (2010)
- Zé Neto & Cristiano (2010, 2020)

### Forró e piseiro (`forro`)

Vizinhos: Sertanejo, Axé e música baiana.

- Aviões do Forró (2000, 2010)
- Banda Calypso (90, 2000)
- Calcinha Preta (2000)
- Elba Ramalho (80)
- Falamansa (2000)
- Felipe Amorim (2020)
- Henry Freitas (2020)
- João Gomes (2020)
- Léo Foguete (2020)
- Mano Walter (2010)
- Manu Bahtidão (2020)
- Mari Fernandez (2020)
- Nattan (2020)
- Os Barões da Pisadinha (2020)
- Solange Almeida (2010)
- Tarcísio do Acordeon (2020)
- Vitor Fernandes (2020)
- Wesley Safadão (2010, 2020)
- Xand Avião (2010)
- Zé Vaqueiro (2020)

### Romântica e brega (`romantica`)

Vizinhos: Sertanejo, MPB.

- Agnaldo Timóteo (70, 80)
- Amado Batista (70, 80)
- Antônio Marcos (70)
- Evaldo Braga (70)
- Fernando Mendes (70, 80)
- Fábio Jr. (70, 80, 90)
- Jessé (70, 80)
- Joanna (80)
- José Augusto (80)
- Lindomar Castilho (70)
- Nelson Ned (70, 80)
- Odair José (70)
- Peninha (70, 80)
- Reginaldo Rossi (70, 80)
- Roberto Carlos (70, 80, 90)
- Rosana (80)
- Sidney Magal (70, 80)
- Vanusa (70)
- Waldick Soriano (70)
- Wando (70, 80, 90)

### Funk (`funk`)

Vizinhos: Rap e trap, Eletrônica, Pop.

- Bonde do Rolê (2000)
- Bonde do Tigrão (2000)
- Claudinho & Buchecha (90, 2000)
- Delano (2010)
- Dennis DJ (2010, 2020)
- DJ Japa NK (2020)
- Kevin o Chris (2010, 2020)
- Ludmilla (2010, 2020)
- MC Brinquedo (2010)
- MC Cabelinho (2020)
- MC Carol (2010)
- MC Daniel (2020)
- MC Guimê (2010)
- MC Hariel (2010, 2020)
- MC João (2010)
- MC K9 (2010)
- MC Kekel (2010)
- MC Kevinho (2010)
- MC Lele JP (2020)
- MC Livinho (2010)
- MC Loma e as Gêmeas Lacração (2010)
- MC Marcinho (90, 2000)
- MC Romântico (2010)
- MC Ryan SP (2020)
- Mr. Catra (2010)
- Naldo Benny (2010)
- Nego do Borel (2010)
- Pedro Sampaio (2020)
- Perlla (2000)
- Pikeno & Menor (2010)
- Pocah (2010)
- Tati Quebra Barraco (2000)
- Tati Zaqui (2010)
- Valesca Popozuda (2010)

### Rap e trap (`rap`)

Vizinhos: Funk, Soul e black music.

- Baco Exu do Blues (2020)
- BK' (2010, 2020)
- Criolo (2010)
- Djonga (2010, 2020)
- Emicida (2010)
- Filipe Ret (2010, 2020)
- Gabriel o Pensador (90, 2000)
- Haikaiss (2010)
- Hungria Hip Hop (2020)
- Jeninho (2020)
- Kayblack (2020)
- L7nnon (2020)
- Marcelo D2 (2000)
- Matuê (2020)
- Orochi (2020)
- Planet Hemp (90)
- Projota (2010)
- Racionais MC's (90, 2020)
- Rael (2010)
- Sampa Crew (90)
- Teto (2020)
- Tz da Coronel (2020)
- Veigh (2020)
- Xamã (2020)

### Eletrônica (`eletronica`)

Vizinhos: Funk, Pop.

- Alok (2010, 2020)
- Vintage Culture (2010, 2020)

### Reggae (`reggae`)

Vizinhos: Pop, Rock.

- Armandinho (2000)
- Chimarruts (2000)
- Cidade Negra (90)
- Maskavo Roots (90)
- Natiruts (90, 2000)

### Infantil (`infantil`)

Vizinhos: Pop.

- A Turma do Balão Mágico (80)
- Angélica (80)
- Trem da Alegria (80)
- Xuxa (80)
