// Subset of the MusicBrainz web service (ws/2) JSON responses we use.

export interface MusicBrainzArtistCredit {
  name: string;
  artist: { id: string; name: string };
}

export interface MusicBrainzRecording {
  id: string;
  title: string;
  /** "YYYY", "YYYY-MM" or "YYYY-MM-DD"; missing when unknown. */
  "first-release-date"?: string;
  "artist-credit"?: MusicBrainzArtistCredit[];
}

export interface MusicBrainzRecordingSearch {
  count: number;
  recordings: MusicBrainzRecording[];
}
