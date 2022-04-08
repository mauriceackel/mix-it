import { XMLParser } from 'fast-xml-parser';
import fs from 'fs/promises';
import PlistParser from 'plist';
import { v4 as uuid } from 'uuid';

import type Playlist from '@models/Playlist';
import Track from '@models/Track';

async function parseITunesPlaylist(data: Buffer): Promise<Playlist[]> {
  const parser = PlistParser;
  const rawFile = parser.parse(data.toString()) as any;

  if (rawFile.Playlists.length === 0) {
    throw new Error('No playlists in file');
  }

  const parsedTracks: Record<string, Track> = Object.entries<any>(
    rawFile.Tracks,
  ).reduce<Record<string, Track>>((tracks, [key, rawTrack]) => {
    const parsedTrack: Track = {
      title: rawTrack.Name,
      artist: rawTrack.Artist,
    };

    return {
      ...tracks,
      [key]: parsedTrack,
    };
  }, {});

  const parsedPlaylists: Playlist[] = rawFile.Playlists.map(
    (rawPlaylist: any) => {
      const parsedPlaylist: Playlist = {
        id: uuid(),
        name: rawPlaylist.Name,
        tracks: rawPlaylist['Playlist Items'].map(
          (item: any) => parsedTracks[item['Track ID']],
        ),
      };

      return parsedPlaylist;
    },
  );

  return parsedPlaylists;
}

async function parseTraktorPlaylist(data: Buffer): Promise<Playlist[]> {
  const parser = new XMLParser({
    ignoreAttributes: false,
  });
  const rawFile = parser.parse(data.toString());

  const parsedTracks: Record<string, Track> = (
    rawFile.NML.COLLECTION.ENTRY as Array<any>
  ).reduce<Record<string, Track>>((tracks, rawTrack) => {
    const key = `${rawTrack.LOCATION['@_VOLUME']}${rawTrack.LOCATION['@_DIR']}${rawTrack.LOCATION['@_FILE']}`;
    const parsedTrack: Track = {
      title: rawTrack['@_TITLE'],
      artist: rawTrack['@_ARTIST'],
    };

    return {
      ...tracks,
      [key]: parsedTrack,
    };
  }, {});

  const parsedPlaylists: Playlist[] = parseTraktorPlaylistNode(
    rawFile.NML.PLAYLISTS.NODE,
    parsedTracks,
  );

  return parsedPlaylists;
}

function parseTraktorPlaylistNode(
  NODE: any,
  parsedTracks: Record<string, Track>,
): Playlist[] {
  switch (NODE['@_TYPE']) {
    case 'PLAYLIST': {
      // Handle playlist
      const rawPlaylist = NODE;
      const parsedPlaylist: Playlist = {
        id: uuid(),
        name: rawPlaylist['@_NAME'],
        tracks: rawPlaylist.PLAYLIST.ENTRY.map(
          (item: any) => parsedTracks[item.PRIMARYKEY['@_KEY']],
        ),
      };

      return [parsedPlaylist];
    }
    case 'FOLDER': {
      const SUBNODES: Array<any> = Array.isArray(NODE.SUBNODES.NODE)
        ? NODE.SUBNODES.NODE
        : [NODE.SUBNODES.NODE];
      return SUBNODES.flatMap((SUBNODE: any) =>
        parseTraktorPlaylistNode(SUBNODE, parsedTracks),
      );
    }
    default: {
      return [];
    }
  }
}

async function parsePlaylist(filePath: string): Promise<Playlist[]> {
  const data = await fs.readFile(filePath);

  if (filePath.endsWith('xml')) {
    return parseITunesPlaylist(data);
  } else if (filePath.endsWith('nml')) {
    return parseTraktorPlaylist(data);
  } else {
    throw new Error('Unknown file type');
  }
}

export default {
  parsePlaylist,
};
