import classNames from 'classnames';
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

import Checkbox from './Checkbox';

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

  const [searchText, setSearchText] = useState<string>();

  useEffect(() => {
    if (serverRunning && autoUpdate && currentSong) {
      const text =  `${currentSong.title ?? ''} ${currentSong.artist ?? ''}`.trim(); // prettier-ignore
      setSearchText(text);
    }
  }, [serverRunning, autoUpdate, currentSong]);

  const rows = useMemo(() => {
    const rowCount = 2 * trackCount + 1;

    if (rowCount <= 0 || Number.isNaN(rowCount)) {
      return [];
    }

    // Prepare rows
    const result: RowModel[] = new Array(rowCount)
      .fill(undefined)
      .map((_, index) => ({
        id: uuid(),
        heat: Math.min(1, 1 / (Math.abs(index - trackCount) + 1)),
        tracks: [],
      }));

    // Fill rows based on matched tracks in selected playlists
    selectedPlaylists.forEach((playlist) => {
      // Find song in playlist
      const matchedIndices = findAllIndices(playlist.tracks, (track) => {
        return isTrackMatch(track, searchText);
      });

      // Write all relevant surrounding tracks to rows
      matchedIndices.forEach((index) => {
        for (let i = 0; i < rowCount; i += 1) {
          const surroundingTrack = playlist.tracks[index + i - trackCount];
          if (surroundingTrack) {
            result[i].tracks.push(surroundingTrack);
          }
        }
      });
    });

    return result;
  }, [searchText, selectedPlaylists, trackCount]);

  const handleSearchTextChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setSearchText(event.currentTarget.value);
    },
    [],
  );

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

          <input
            type="text"
            className="min-w-0 p-2 mr-4 flex-grow rounded bg-gray-800 outline-pink-600"
            placeholder="Title or Artist"
            value={searchText}
            onChange={handleSearchTextChange}
          />

          <Checkbox checked={autoUpdate} onChange={toggleAutoUpdate}>
            <p className="select-none text-sm">Auto</p>
          </Checkbox>
        </header>

        <div className="grid grid-cols-1 auto-rows-fr gap-2 overflow-hidden">
          {rows.map((row) => (
            <Row key={row.id} row={row} />
          ))}
        </div>
      </div>
    </div>
  );
}

interface RowProps {
  row: RowModel;
}
function Row(props: RowProps): ReactElement {
  const { row } = props;

  return (
    <div
      style={{ '--tw-bg-opacity': row.heat } as any}
      className="flex flex-col overflow-y-auto bg-pink-600 rounded"
    >
      {row.tracks.map((track, i) => (
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

interface RowModel {
  id: string;
  heat: number;
  tracks: Track[];
}

function findAllIndices<T>(
  array: Array<T>,
  prediate: (value: T, index: number, obj: T[]) => unknown,
): number[] {
  const result: number[] = [];

  array.forEach((element, index) => {
    if (prediate(element, index, array)) {
      result.push(index);
    }
  });

  return result;
}

function isTrackMatch(track: Track, searchText: string | undefined): boolean {
  if (!searchText) return false;

  try {
    const isMatch =
      !!track.title?.includes(searchText) ||
      !!track.artist?.includes(searchText);

    return isMatch;
  } catch (err) {
    console.log(track.title, track.artist);
  }

  return false;
}

export default Recommendations;
