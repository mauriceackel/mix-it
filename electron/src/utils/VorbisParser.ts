import { Transform, TransformCallback, TransformOptions } from 'stream';

export interface VorbisMeta {
  key: string;
  value: string;
}

interface AudioHeader {
  isValid: true;
  type: 'audio';
}

interface IdentificationHeader {
  isValid: true;
  type: 'identification';
  version: number;
  audioChannels: number;
  sampleRate: number;
  maxBitrate: number;
  nominalBitrate: number;
  minBitrate: number;
  blockSize0: number;
  blockSize1: number;
}

interface CommentHeader {
  isValid: true;
  type: 'comment';
  vendor: string;
  metadata: VorbisMeta[];
}

interface SetupHeader {
  isValid: true;
  type: 'setup';
}

type ValidVorbisHeader =
  | AudioHeader
  | IdentificationHeader
  | CommentHeader
  | SetupHeader;

interface InvalidVorbisHeader {
  isValid: false;
}

type VorbisHeader = ValidVorbisHeader | InvalidVorbisHeader;

class VorbisPacket {
  private static parseVorbisHeader(buffer: Buffer): VorbisHeader {
    // Magic number
    const isVorbisPacket =
      buffer[1] === 0x76 &&
      buffer[2] === 0x6f &&
      buffer[3] === 0x72 &&
      buffer[4] === 0x62 &&
      buffer[5] === 0x69 &&
      buffer[6] === 0x73;

    if (!isVorbisPacket) {
      return { isValid: false };
    }

    // Type
    switch (buffer[0]) {
      case 0x00:
        return VorbisPacket.parseAudioHeader(buffer);
      case 0x01:
        return VorbisPacket.parseIdentificationHeader(buffer);
      case 0x03:
        return VorbisPacket.parseCommentHeader(buffer);
      case 0x05:
        return VorbisPacket.parseSetupHeader(buffer);
      default:
        return { isValid: false };
    }
  }

  private static parseAudioHeader(
    buffer: Buffer,
  ): InvalidVorbisHeader | AudioHeader {
    return { isValid: true, type: 'audio' };
  }

  private static parseIdentificationHeader(
    buffer: Buffer,
  ): InvalidVorbisHeader | IdentificationHeader {
    let version = 0;
    for (let i = 0; i < 4; i++) {
      version += buffer[7 + i] << (i * 8);
    }

    const audioChannels = buffer[11];

    let sampleRate = 0;
    for (let i = 0; i < 4; i++) {
      sampleRate += buffer[12 + i] << (i * 8);
    }

    let minBitrate = 0;
    for (let i = 0; i < 4; i++) {
      minBitrate += buffer[16 + i] << (i * 8);
    }

    let nominalBitrate = 0;
    for (let i = 0; i < 4; i++) {
      nominalBitrate += buffer[20 + i] << (i * 8);
    }

    let maxBitrate = 0;
    for (let i = 0; i < 4; i++) {
      maxBitrate += buffer[24 + i] << (i * 8);
    }

    const blockSize0 = 2 ** ((buffer[28] & 0xf0) >> 4);
    const blockSize1 = 2 ** (buffer[28] & 0x0f);

    const framingBit = buffer[29];

    if (framingBit === 0 || blockSize0 > blockSize1) {
      return { isValid: false };
    }

    return {
      isValid: true,
      type: 'identification',
      version,
      audioChannels,
      sampleRate,
      minBitrate,
      nominalBitrate,
      maxBitrate,
      blockSize0,
      blockSize1,
    };
  }

  private static parseCommentHeader(
    buffer: Buffer,
  ): InvalidVorbisHeader | CommentHeader {
    let offset = 7;

    const vendorStringLength = buffer.readUInt32LE(offset);
    offset += 4;

    const vendor = buffer
      .slice(offset, offset + vendorStringLength)
      .toString('utf-8');
    offset += vendorStringLength;

    const commentListLength = buffer.readUInt32LE(offset);
    offset += 4;

    const metadata: VorbisMeta[] = [];
    for (let i = 0; i < commentListLength; i++) {
      const commentStringLength = buffer.readUInt32LE(offset);
      offset += 4;

      const comment = buffer
        .slice(offset, offset + commentStringLength)
        .toString('utf-8');

      const [key, value] = comment.split('=');
      metadata.push({ key: key.toLowerCase(), value });

      offset += commentStringLength;
    }

    const framingBit = buffer[offset];

    if (framingBit === 0) {
      return { isValid: false };
    }

    return { isValid: true, type: 'comment', vendor, metadata };
  }

  private static parseSetupHeader(
    buffer: Buffer,
  ): InvalidVorbisHeader | SetupHeader {
    return { isValid: true, type: 'setup' };
  }

  private _buffer: Buffer;

  private _header: ValidVorbisHeader;
  public get header(): ValidVorbisHeader {
    return this._header;
  }

  constructor(buffer: Buffer);
  constructor(buffer: Buffer, header?: VorbisHeader) {
    header = header ?? VorbisPacket.parseVorbisHeader(buffer);
    if (!header.isValid) {
      throw new Error('Invalid Vorbis packet');
    }
    this._header = header;

    this._buffer = buffer;
  }
}

class VorbisMetaTransformer extends Transform {
  constructor(opts?: TransformOptions) {
    super({ ...opts, objectMode: true });
  }

  override _transform(
    chunk: Buffer,
    encoding: BufferEncoding,
    callback: TransformCallback,
  ): void {
    let packet: VorbisPacket;
    try {
      packet = new VorbisPacket(chunk);
    } catch {
      // TODO: Check why we get invalid packets here.. Could it be that it is just the traktor demo version
      return callback();
    }

    if (packet.header.type === 'comment') {
      return callback(null, packet.header.metadata);
    }

    callback();
  }
}

export default VorbisMetaTransformer;
