import { IpcMainInvokeEvent, ipcMain } from 'electron';
import net, { Server, Socket } from 'net';

import OggTransformer from 'utils/OggParser';
import VorbisMetaTransformer, { VorbisMeta } from 'utils/VorbisParser';
import { handlerWrapper } from 'utils/errorBridge';

import Track from 'models/Track';

// Run song server
let server: Server;
let connection: Socket;

ipcMain.handle('startSongServer', handlerWrapper(startSongServer));

async function startSongServer(
  ipcEvent: IpcMainInvokeEvent,
  host: string,
  port: number,
) {
  if (server) {
    throw new Error('Server already running');
  }

  if (connection !== undefined) {
    throw new Error('Open connection detected');
  }

  const newServer = net.createServer(onClientConnection);

  function onClientConnection(socket: Socket) {
    // Check if there is already an active connection
    if (connection !== undefined) {
      console.log('There is already an active connection. Closing socket.');
      socket.destroy();
    } else {
      // Keep track of connection
      connection = socket;
    }

    socket.once('close', () => {
      connection = undefined;
      ipcEvent.sender.send('connectionUpdate', false);
    });

    // Prepare to receive incoming data
    socket
      .pipe(new OggTransformer())
      .pipe(new VorbisMetaTransformer())
      .on('data', (metaData: VorbisMeta[]) => {
        const title = metaData.find((m) => m.key === 'title')?.value;
        const artist = metaData.find((m) => m.key === 'artist')?.value;

        if (!title && !artist) {
          return;
        }

        const track: Track = {
          title,
          artist,
        };

        console.log('Detected track', JSON.stringify(track));
        ipcEvent.sender.send('songUpdate', track);
      });

    // Signal Traktor that we are ready to receive the data
    socket.write('HTTP/1.0 200 OK\r\n\r\n');
    console.log('Connection established');

    ipcEvent.sender.send('connectionUpdate', true);
  }

  // Create result promise
  const result = new Promise<void>((resolve, reject) => {
    newServer.once('listening', () => resolve());
    newServer.once('error', () => reject());
  });

  // Start the actual server
  newServer.listen(port, host, () => {
    console.log(`Server started on ${host}:${port}`);
  });

  result
    .then(() => {
      server = newServer;
    })
    .catch();

  return result;
}

ipcMain.handle('stopSongServer', handlerWrapper(stopSongServer));

async function stopSongServer(ipcEvent: IpcMainInvokeEvent) {
  if (!server) {
    throw new Error('Server not running');
  }

  // Create result promise
  const result = new Promise<void>((resolve, reject) => {
    server.once('close', () => resolve());
    server.once('error', () => reject());
  });

  const addressInfo = server.address() ?? 'unknown';

  // Stop the actual server
  server.close();
  connection?.destroy();

  result.then(() => {
    connection = undefined;
    server = undefined;
    console.log(
      'Stopped server that was running on',
      typeof addressInfo === 'string'
        ? addressInfo
        : `${addressInfo.address}:${addressInfo.port}`,
    );
  });

  return result;
}
