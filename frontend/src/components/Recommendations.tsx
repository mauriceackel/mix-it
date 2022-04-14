import classNames from 'classnames';
import MiniSearch from 'minisearch';
import objectHash from 'object-hash';
import React, {
  ReactElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { v4 as uuid } from 'uuid';

import ConfigContext from 'services/config';
import PlaylistContext from 'services/playlists';
import SongContext from 'services/songs';

import Track from 'models/Track';

import Autocomplete from './Autocomplete';
import Checkbox from './Checkbox';

type IndexedTrack = {
  id: string; // = <playlistId>-<trackIndex>
  playlistId: string;
  trackIndex: number;
};

type RecommendationsProps = {
  className?: string;
};
function Recommendations(props: RecommendationsProps): ReactElement {
  const { className } = props;

  const { currentSong, serverRunning } = useContext(SongContext);
  const { selectedPlaylists } = useContext(PlaylistContext);
  const {
    trackCount,
    autoUpdate,
    dispatch: dispatchConfig,
  } = useContext(ConfigContext);

  const [searchText, setSearchText] = useState<string>('');

  useEffect(() => {
    if (serverRunning && autoUpdate && currentSong) {
      const text =  `${currentSong.title ?? ''} ${currentSong.artist ?? ''}`.trim(); // prettier-ignore
      setSearchText(text);
    }
  }, [serverRunning, autoUpdate, currentSong]);

  const searchDb = useMemo(() => {
    const searchIdx = new MiniSearch<Track & IndexedTrack>({
      fields: ['title', 'artist'],
      storeFields: ['playlistId', 'trackIndex'],
      searchOptions: { prefix: true },
    });

    const allTracks: (Track & IndexedTrack)[] = selectedPlaylists.flatMap(
      (playlist) => {
        return playlist.tracks.map((track, trackIndex) => {
          return {
            ...track,
            id: `${playlist.id}-${trackIndex}`,
            playlistId: playlist.id,
            trackIndex,
          };
        });
      },
    );
    searchIdx.addAll(allTracks);

    return searchIdx;
  }, [selectedPlaylists]);

  const rowData = useMemo(() => {
    const rowCount = 2 * trackCount + 1;

    if (rowCount <= 0 || Number.isNaN(rowCount)) {
      return [];
    }

    // Prepare rows
    const rows: RowDataModel[] = new Array(rowCount)
      .fill(undefined)
      .map((_, index) => ({
        id: uuid(),
        heat: Math.min(1, 1 / (Math.abs(index - trackCount) + 1)),
        tracks: [],
      }));

    // Perform full text search on all tracks
    const results = searchDb.search(searchText) as unknown as IndexedTrack[];

    // Fill rows based on matched tracks in selected playlists
    results.forEach((result) => {
      // Get actual playlist
      const playlist = selectedPlaylists.find(
        (p) => p.id === result.playlistId,
      );

      if (playlist === undefined) return;

        for (let i = 0; i < rowCount; i += 1) {
        const surroundingTrack =
          playlist.tracks[result.trackIndex + i - trackCount];
          if (surroundingTrack) {
          rows[i].tracks.push(surroundingTrack);
          }
        }
    });

    return rows;
  }, [searchText, searchDb, selectedPlaylists, trackCount]);

  const handleTrackCountChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) =>
      dispatchConfig({
        type: 'SET_TRACK_COUNT',
        trackCount: Math.min(
          10,
          Math.max(1, event.currentTarget.valueAsNumber),
        ),
      }),
    [dispatchConfig],
  );

  const handleTrackCountBlur = useCallback(() => {
    if (!Number.isSafeInteger(trackCount)) {
      dispatchConfig({
        type: 'SET_TRACK_COUNT',
        trackCount: 1,
      });
    }
  }, [dispatchConfig, trackCount]);

  const toggleAutoUpdate = useCallback(
    () =>
      dispatchConfig({
        type: 'SET_AUTO_UPDATE',
        autoUpdate: !autoUpdate,
      }),
    [dispatchConfig, autoUpdate],
  );

  const getSuggestions = useCallback(
    (text: string) => {
      return searchDb
        .autoSuggest(text, { fuzzy: true })
        .map((result) => result.suggestion);
    },
    [searchDb],
  );

  return (
    <div className={className}>
      <div className="flex flex-col w-full h-full p-2 bg-gray-600 text-white overflow-hidden">
        <header className="flex items-center justify-between mb-2">
          <input
            type="number"
            min={1}
            max={10}
            className="w-16 p-2 mr-2 rounded bg-gray-800 outline-pink-600"
            value={trackCount}
            onChange={handleTrackCountChange}
            onBlur={handleTrackCountBlur}
          />

          <Autocomplete
            value={searchText}
            onChange={setSearchText}
            suggestions={getSuggestions}
          />

          <Checkbox checked={autoUpdate} onChange={toggleAutoUpdate}>
            <p className="select-none text-sm">Auto</p>
          </Checkbox>
        </header>

        <div className="grid grid-cols-1 auto-rows-fr gap-2 overflow-hidden">
          {rowData.map((data) => (
            <Row key={data.id} rowData={data} />
          ))}
        </div>
      </div>
    </div>
  );
}

interface RowProps {
  rowData: RowDataModel;
}
function Row(props: RowProps): ReactElement {
  const { rowData } = props;

  return (
    <div
      style={{ '--tw-bg-opacity': rowData.heat } as any}
      className="flex flex-col overflow-y-auto bg-pink-600 rounded"
    >
      {rowData.tracks.map((track, i) => (
        <div
          key={objectHash(track)}
          className={classNames(
            'p-1 bg-white',
            i % 2 === 0 ? 'bg-opacity-0' : 'bg-opacity-5',
          )}
        >
          {track.title ?? 'n.a.'} - {track.artist ?? 'n.a.'}
        </div>
      ))}
    </div>
  );
}

interface RowDataModel {
  id: string;
  heat: number;
  tracks: Track[];
}

export default Recommendations;
