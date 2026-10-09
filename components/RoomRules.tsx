import { HARD_CLIP_SECONDS, NORMAL_CLIP_SECONDS } from "@/lib/game/config";
import { MAX_ROOM_PLAYERS, MAX_ROOM_ROUNDS, MIN_ROOM_ROUNDS, ROOM_TTL_MS } from "@/lib/game/room";

import { card } from "./styles";

const TTL_DAYS = Math.round(ROOM_TTL_MS / (24 * 60 * 60 * 1000));

/** How rooms work, for whoever creates and whoever joins. */
export function RoomRules({ open = false }: { open?: boolean }) {
  return (
    <details open={open} className={`${card} group`}>
      <summary className="eyebrow flex min-h-8 cursor-pointer list-none items-center justify-between text-accent">
        Como funciona
        <span aria-hidden className="transition-transform group-open:rotate-180">
          ▾
        </span>
      </summary>
      <div className="mt-3 flex flex-col gap-4 text-sm leading-relaxed">
        <section>
          <h3 className="font-extrabold">Quem cria a sala</h3>
          <ul className="mt-1 list-disc pl-5">
            <li>
              Escolhe a categoria, de {MIN_ROOM_ROUNDS} a {MAX_ROOM_ROUNDS} rodadas e o modo: normal (
              {NORMAL_CLIP_SECONDS}s) ou difícil ({HARD_CLIP_SECONDS}s).
            </li>
            <li>Recebe um código de 6 caracteres e o link para mandar à turma.</li>
            <li>Também joga, nas mesmas condições: não vê as músicas antes nem muda nada depois.</li>
          </ul>
        </section>
        <section>
          <h3 className="font-extrabold">Quem entra</h3>
          <ul className="mt-1 list-disc pl-5">
            <li>Abre o link ou digita o código e escolhe um apelido, que não pode repetir na sala.</li>
            <li>Joga quando quiser, sem precisar estar todo mundo online junto.</li>
          </ul>
        </section>
        <section>
          <h3 className="font-extrabold">Regras</h3>
          <ul className="mt-1 list-disc pl-5">
            <li>Todos ouvem as mesmas músicas, na mesma ordem e com as mesmas opções. Nenhuma se repete.</li>
            <li>Vale o modo escolhido na criação da sala, igual para todos.</li>
            <li>Um palpite por rodada, e cada um joga a sala uma vez só. Se sair no meio, continua de onde parou.</li>
            <li>
              O tempo de cada rodada conta do primeiro play até o palpite. Ouvir de novo pode, mas o tempo continua
              correndo.
            </li>
            <li>Ganha quem acertar mais. No empate, quem gastou menos tempo no total.</li>
            <li>
              Até {MAX_ROOM_PLAYERS} jogadores por sala. A sala expira {TTL_DAYS} dias depois de criada.
            </li>
            <li>Sem login: você é reconhecido por este navegador. Trocando de aparelho, não dá para continuar.</li>
          </ul>
        </section>
      </div>
    </details>
  );
}
