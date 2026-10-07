// Shapes of the Deezer public API responses we rely on.
// Only the fields the app uses are declared; Deezer returns more.

export interface DeezerErrorBody {
  error: {
    type: string;
    message: string;
    code?: number;
  };
}

export interface DeezerPage<T> {
  data: T[];
  total?: number;
  prev?: string;
  next?: string;
}

export interface DeezerArtistSummary {
  id: number;
  name: string;
  link: string;
  picture_medium?: string;
  nb_album?: number;
  nb_fan: number;
}

export interface DeezerArtist extends DeezerArtistSummary {
  nb_album: number;
}

export type DeezerRecordType = "album" | "single" | "ep" | "compile";

export interface DeezerAlbumSummary {
  id: number;
  title: string;
  link: string;
  cover_medium?: string;
  release_date: string; // YYYY-MM-DD
  // Deezer may add new values; keep the known ones for autocomplete.
  record_type: DeezerRecordType | (string & {});
}

export interface DeezerTrackArtist {
  id: number;
  name: string;
}

export interface DeezerAlbumTrack {
  id: number;
  readable: boolean;
  title: string;
  title_short: string;
  title_version?: string;
  link: string;
  duration: number; // seconds
  preview: string; // empty string when unavailable
  artist: DeezerTrackArtist;
}

export interface DeezerTrack extends DeezerAlbumTrack {
  release_date?: string;
  contributors?: DeezerTrackArtist[];
  album: {
    id: number;
    title: string;
    link?: string;
    cover_medium?: string;
    cover_big?: string;
    release_date?: string;
  };
}
