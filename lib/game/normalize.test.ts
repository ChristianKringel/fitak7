import { describe, expect, it } from "vitest";

import {
  areConfusableTitles,
  displayTitle,
  foldName,
  hasVersionMarker,
  isMedley,
  isVersionAlbumTitle,
  normalizeTitle,
  slugify,
} from "./normalize";

describe("normalizeTitle", () => {
  it.each([
    // Live versions
    ["Infinita Highway (Ao Vivo)", "infinita highway"],
    ["Infinita Highway - Ao Vivo", "infinita highway"],
    ["Será (Ao Vivo No Rock In Rio)", "sera"],
    ["Óculos [Ao Vivo]", "oculos"],
    ["Lanterna dos Afogados - Live", "lanterna dos afogados"],
    ["Camila, Camila - Live at Theatro São Pedro", "camila camila"],
    // Acoustic versions
    ["Epitáfio (Acústico)", "epitafio"],
    [
      "Era Um Garoto Que Como Eu Amava Os Beatles E Os Rolling Stones (Acústico MTV)",
      "era um garoto que como eu amava os beatles e os rolling stones",
    ],
    ["Pra Dizer Adeus (Ao Vivo / Acústico)", "pra dizer adeus"],
    ["Pra Dizer Adeus - Versão Acústica", "pra dizer adeus"],
    // Remasters
    ["Pra Ser Sincero (Remasterizado)", "pra ser sincero"],
    ["Tempo Perdido - Remasterizado", "tempo perdido"],
    ["Faroeste Caboclo (Remastered 2003)", "faroeste caboclo"],
    ["Ainda É Cedo - 2004 Remaster", "ainda e cedo"],
    ["Ainda É Cedo - Remasterizado em 2004", "ainda e cedo"],
    // Other versions
    ["Toda Forma de Poder (Versão Single)", "toda forma de poder"],
    ["Toda Forma de Poder (Radio Edit)", "toda forma de poder"],
    ["Toda Forma de Poder [Demo]", "toda forma de poder"],
    // Featuring
    ["Lanterna dos Afogados (feat. Maria Gadú)", "lanterna dos afogados"],
    ["Lanterna dos Afogados feat. Maria Gadú", "lanterna dos afogados"],
    ["Lanterna dos Afogados (Ft. Maria Gadú)", "lanterna dos afogados"],
    ["Céu de Santo Amaro (Participação Especial de Fulano)", "ceu de santo amaro"],
    ["Céu de Santo Amaro (Part. Fulano)", "ceu de santo amaro"],
    // Bare suffixes, as Deezer often writes them
    ["Pra Ser Sincero Ao Vivo", "pra ser sincero"],
    ["Que País é Esse? Ao Vivo", "que pais e esse"],
    ["Flores em Você versão acústica", "flores em voce"],
    ["Fogo Versão Sem Público", "fogo"],
    ["Terra de Gigantes Ao Vivo em Porto Alegre", "terra de gigantes"],
    // Other markers seen in real data
    ["Camila, Camila (Bônus 1)", "camila camila"],
    ["Go Back (Em Espanhol)", "go back"],
    ["Por Enquanto (Outtake)", "por enquanto"],
    ["Ainda É Cedo (Take 9)", "ainda e cedo"],
    ["Química (Mixagem 2023)", "quimica"],
    ["Sonífera Ilha (Microfonado)", "sonifera ilha"],
    ["Bichos Escrotos (Vinheta)", "bichos escrotos"],
    ["Santa Felicidade (Orquestrada)", "santa felicidade"],
    ["Depois da Meia Noite (Voz e violão)", "depois da meia noite"],
    ["O Bagulho É um Veneno (Dub)", "o bagulho e um veneno"],
    ["Mensagem de Amor (Smoke Beat)", "mensagem de amor"],
    // Several markers at once
    ["Óculos (Ao Vivo) [Remastered]", "oculos"],
    ["Óculos (feat. Fulano) - Ao Vivo", "oculos"],
    // Accents, case and punctuation
    ["Coração de Luto", "coracao de luto"],
    ["CORAÇÃO DE LUTO", "coracao de luto"],
    ["Que País É Esse?", "que pais e esse"],
    ["Eduardo & Mônica", "eduardo e monica"],
    ["  Sonífera   Ilha ", "sonifera ilha"],
  ])("%s -> %s", (input, expected) => {
    expect(normalizeTitle(input)).toBe(expected);
  });

  it("keeps parentheses that are part of the song title", () => {
    expect(normalizeTitle("Mais Uma Vez (Parte 2)")).toBe("mais uma vez parte 2");
    expect(normalizeTitle("Chuva de Prata (Tema de Amor)")).toBe(
      "chuva de prata tema de amor",
    );
  });

  it("keeps dash suffixes that are not version markers", () => {
    expect(normalizeTitle("Lugar Nenhum - Parte 2")).toBe("lugar nenhum parte 2");
  });

  it("does not strip marker words that are part of the title itself", () => {
    expect(normalizeTitle("Transmissão ao Vivo da Tragédia")).toBe(
      "transmissao ao vivo da tragedia",
    );
    expect(normalizeTitle("A Melhor Versão de Mim")).toBe("a melhor versao de mim");
    expect(normalizeTitle("O Poeta Está Vivo")).toBe("o poeta esta vivo");
    expect(normalizeTitle("Live and Let Die")).toBe("live and let die");
    expect(normalizeTitle("Partido Alto")).toBe("partido alto");
  });

  it("does not reduce a title to nothing", () => {
    expect(normalizeTitle("Live")).toBe("live");
    expect(normalizeTitle("(Ao Vivo)")).toBe("ao vivo");
  });

  it("groups all versions of a song under the same key", () => {
    const versions = [
      "Infinita Highway",
      "Infinita Highway (Ao Vivo)",
      "Infinita Highway - Ao Vivo",
      "Infinita Highway (Acústico MTV)",
      "Infinita Highway - Remasterizado",
      "INFINITA HIGHWAY [Live]",
    ];
    expect(new Set(versions.map(normalizeTitle)).size).toBe(1);
  });
});

describe("displayTitle", () => {
  it("removes markers but keeps casing and accents", () => {
    expect(displayTitle("Infinita Highway (Ao Vivo)")).toBe("Infinita Highway");
    expect(displayTitle("Pra Ser Sincero - Remasterizado")).toBe("Pra Ser Sincero");
    expect(displayTitle("Céu de Santo Amaro (feat. Fulano)")).toBe(
      "Céu de Santo Amaro",
    );
    expect(displayTitle("Que País É Esse?")).toBe("Que País É Esse?");
    expect(displayTitle("Mais Uma Vez (Parte 2)")).toBe("Mais Uma Vez (Parte 2)");
  });
});

describe("hasVersionMarker", () => {
  it("detects marked titles only", () => {
    expect(hasVersionMarker("Óculos (Ao Vivo)")).toBe(true);
    expect(hasVersionMarker("Óculos - Remasterizado")).toBe(true);
    expect(hasVersionMarker("Óculos")).toBe(false);
    expect(hasVersionMarker("Mais Uma Vez (Parte 2)")).toBe(false);
  });
});

describe("isVersionAlbumTitle", () => {
  it.each([
    ["Acústico MTV", true],
    ["Ao Vivo no Opinião", true],
    ["Filmes de Guerra, Canções de Amor (Ao Vivo)", true],
    ["Live in Porto Alegre", true],
    ["O Papa É Pop", false],
    ["A Revolta dos Dândis", false],
  ])("%s -> %s", (title, expected) => {
    expect(isVersionAlbumTitle(title)).toBe(expected);
  });
});

describe("isMedley", () => {
  it.each([
    ["Medley: Coração de Luto / Gaúcho de Passo Fundo", true],
    ["Pot-Pourri Gaúcho", true],
    ["Potpourri de Vanerões", true],
    ["Pot Pourri", true],
    ["Índios / Faroeste Caboclo", true],
    ["Soldados/Blues Da Piedade/Faz Parte Do Meu Show", true],
    ["24/7", false],
    ["Coração de Luto", false],
  ])("%s -> %s", (title, expected) => {
    expect(isMedley(title)).toBe(expected);
  });
});

describe("foldName", () => {
  it("ignores case, accents and extra spaces but keeps punctuation", () => {
    expect(foldName("Bidê ou Balde")).toBe(foldName("BIDE OU  BALDE"));
    expect(foldName("Ira!")).toBe("ira!");
    expect(foldName("Ira!")).not.toBe(foldName("Ira"));
  });
});

describe("slugify", () => {
  it("produces URL-safe slugs", () => {
    expect(slugify("Bidê ou Balde")).toBe("bide-ou-balde");
    expect(slugify("Ira!")).toBe("ira");
    expect(slugify("Comunidade Nin-Jitsu")).toBe("comunidade-nin-jitsu");
    expect(slugify("Eduardo & Mônica")).toBe("eduardo-e-monica");
  });
});

describe("areConfusableTitles", () => {
  it.each([
    ["Porque Eu Sei Que É Amor", "Por que eu sei que é amor"],
    ["Bete Balanço", "Beth balan?o"],
    ["Marvin", "Marvin (Patches)"],
    ["Toda Molhada", "Toda Molhada (Casa do Sol 2025)"],
    ["Eu Caminhava", "Eu Caminhava Cathedral Mix"],
    ["Cowboy", "Cowboy 26"],
    ["Ninguém Mais Lembra de Você", "Ningém Mais Lembra de Você"],
    ["Um Girassol da Cor do Seu Cabelo", "Um Girassol da Cor de Seu Cabelo"],
    ["Que País É Este", "Que Pais É Esse"],
    ["Falar de Amor Não é Amar", "Falar De Amor N¦o É Amar"],
    ["Amazônia X Colômbia", "AMAZONIA VS COLOMBIA"],
    ["Infinita Highway", "Infinita Highway (Ao Vivo)"],
  ])("%s ~ %s", (a, b) => {
    expect(areConfusableTitles(a, b)).toBe(true);
    expect(areConfusableTitles(b, a)).toBe(true);
  });

  it.each([
    ["Julia", "Luzia"],
    ["Desejo", "Deserto"],
    ["Culpa", "Julia"],
    ["Infinita Highway", "Pra Ser Sincero"],
    ["Um", "Dois"],
  ])("%s ≁ %s", (a, b) => {
    expect(areConfusableTitles(a, b)).toBe(false);
  });
});
