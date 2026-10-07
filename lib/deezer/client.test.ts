import { describe, expect, it, vi } from "vitest";

import { createDeezerClient, DeezerError } from "./client";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function setup(responses: Array<Response | Error>) {
  const calls: string[] = [];
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    calls.push(String(input));
    const next = responses.shift();
    if (!next) throw new Error("No more mocked responses");
    if (next instanceof Error) throw next;
    return next;
  });
  const sleeps: number[] = [];
  const client = createDeezerClient({
    fetch: fetchMock as unknown as typeof fetch,
    sleep: async (ms) => {
      sleeps.push(ms);
    },
  });
  return { client, calls, sleeps };
}

describe("createDeezerClient", () => {
  it("treats an error object in an HTTP 200 body as an error", async () => {
    const { client } = setup([
      jsonResponse({
        error: { type: "DataException", message: "no data", code: 800 },
      }),
    ]);
    await expect(client.getTrack(1)).rejects.toMatchObject({
      name: "DeezerError",
      code: 800,
      retryable: false,
    });
  });

  it("retries quota errors and then succeeds", async () => {
    const { client, calls, sleeps } = setup([
      jsonResponse({
        error: { type: "Exception", message: "Quota limit exceeded", code: 4 },
      }),
      jsonResponse({ id: 1, name: "Engenheiros do Hawaii", nb_fan: 10 }),
    ]);
    const artist = await client.getArtist(1);
    expect(artist.name).toBe("Engenheiros do Hawaii");
    expect(calls).toHaveLength(2);
    expect(sleeps[0]).toBeGreaterThanOrEqual(5000);
  });

  it("retries HTTP 5xx and network errors", async () => {
    const { client, calls } = setup([
      new TypeError("fetch failed"),
      jsonResponse({}, 503),
      jsonResponse({ id: 2 }),
    ]);
    await expect(client.get("/track/2")).resolves.toEqual({ id: 2 });
    expect(calls).toHaveLength(3);
  });

  it("does not retry HTTP 404", async () => {
    const { client, calls } = setup([jsonResponse({}, 404)]);
    await expect(client.get("/track/3")).rejects.toBeInstanceOf(DeezerError);
    expect(calls).toHaveLength(1);
  });

  it("gives up after maxRetries", async () => {
    const { client, calls } = setup(
      Array.from({ length: 10 }, () => jsonResponse({}, 500)),
    );
    await expect(client.get("/track/4")).rejects.toBeInstanceOf(DeezerError);
    expect(calls).toHaveLength(6);
  });

  it("follows pagination until there is no next page", async () => {
    const { client, calls } = setup([
      jsonResponse({
        data: [{ id: 1 }, { id: 2 }],
        next: "https://api.deezer.com/artist/9/albums?limit=2&index=2",
      }),
      jsonResponse({
        data: [{ id: 3 }],
        prev: "https://api.deezer.com/artist/9/albums?limit=2&index=0",
      }),
    ]);
    const albums = await client.getArtistAlbums(9);
    expect(albums.map((a) => a.id)).toEqual([1, 2, 3]);
    expect(calls[0]).toContain("limit=100");
    expect(calls[1]).toContain("index=2");
  });

  it("refuses to follow pagination off the API host", async () => {
    const { client } = setup([
      jsonResponse({ data: [{ id: 1 }], next: "https://evil.example/x" }),
    ]);
    await expect(client.getArtistAlbums(9)).rejects.toThrow(
      /Unexpected pagination host/,
    );
  });
});
