import { Transform, TransformCallback } from 'stream';

interface ValidOggHeader {
  isValid: true;
  version: number;
  isContinuation: boolean;
  isBOS: boolean;
  isEOS: boolean;
  position: bigint;
  serial: number;
  sequenceNumber: number;
  checksum: number;
  segmentCount: number;
  pageSize: number;
}

interface InvalidOggHeader {
  isValid: false;
}

type OggHeader = ValidOggHeader | InvalidOggHeader;

interface OggSegment {
  isContinued: boolean;
  data: Buffer;
}

interface OggPacket {
  complete: boolean;
  data: Buffer;
}

interface OggPayload {
  segments: OggSegment[];
  packets: OggPacket[];
}

class OggPage {
  public static parsePages(
    buffer: Buffer,
    continuedPacket?: OggPacket,
  ): OggPage[] {
    let offset = 0;
    let lastIncompletePacket: OggPacket | undefined = continuedPacket;

    const pages: OggPage[] = [];
    do {
      const bufferSlice = buffer.slice(offset);
      const page = new OggPage(bufferSlice, lastIncompletePacket);
      pages.push(page);

      const lastPacket = page.payload.packets[page.payload.packets.length - 1];
      lastIncompletePacket = lastPacket.complete ? undefined : lastPacket;

      offset += page.header.pageSize;
    } while (offset !== buffer.length);

    return pages;
  }

  private static parseOggHeader(buffer: Buffer): OggHeader {
    // Magic number
    const isOggPage =
      buffer[0] === 0x4f &&
      buffer[1] === 0x67 &&
      buffer[2] === 0x67 &&
      buffer[3] === 0x53;

    if (!isOggPage) {
      return { isValid: false };
    }

    // Version
    const version = buffer[4];

    // Type
    const isContinuation = !!(buffer[5] & 0x01);
    const isBOS = !!(buffer[5] & 0x02);
    const isEOS = !!(buffer[5] & 0x04);

    // Position
    const position = buffer.readBigInt64LE(6);

    // Serial
    const serial = buffer.readUInt32LE(14);

    // Sequence Number
    const sequenceNumber = buffer.readUInt32LE(18);

    // Checksum
    const checksum = buffer.readUInt32LE(22);

    // Segment count
    const segmentCount = buffer[26];

    // Page size
    let pageSize = 27 + segmentCount; // 27 byte default header length + segment table length
    for (let i = 0; i < segmentCount; i++) {
      pageSize += buffer[27 + i]; // + size of all segments
    }

    return {
      isValid: true,
      version,
      isContinuation,
      isBOS,
      isEOS,
      position,
      serial,
      sequenceNumber,
      checksum,
      segmentCount,
      pageSize,
    };
  }

  private static parseOggPayload(
    buffer: Buffer,
    header: ValidOggHeader,
    continuedPacket?: OggPacket,
  ): OggPayload {
    const invalidPayload =
      (!header.isContinuation && continuedPacket !== undefined) || // Ogg page says there should be no incomplete packet but there is one
      (header.isContinuation && continuedPacket === undefined); // Ogg page says there should be an incomplete packet but there is none

    if (invalidPayload) {
      throw new Error('Invalid payload detected');
    }

    const segmentTableIndex = 27;
    let payloadIndex = segmentTableIndex + header.segmentCount;

    // Segments
    const segments: OggSegment[] = [];

    for (let i = 0; i < header.segmentCount; i++) {
      const segmentLength = buffer[segmentTableIndex + i];
      const segmentData = buffer.slice(
        payloadIndex,
        payloadIndex + segmentLength,
      );

      segments.push({
        isContinued: segmentLength === 255,
        data: segmentData,
      });

      payloadIndex += segmentLength;
    }

    // Packets
    const packets: OggPacket[] = [];

    let packet: OggPacket = continuedPacket ?? {
      complete: false,
      data: Buffer.from([]),
    };

    for (let i = 0; i < segments.length; i += 1) {
      packet.data = Buffer.concat([packet.data, segments[i].data]);
      packet.complete = !segments[i].isContinued;

      if (packet.complete || i === segments.length - 1) {
        packets.push(packet);
        packet = {
          complete: false,
          data: Buffer.from([]),
        };
      }
    }

    return {
      segments,
      packets,
    };
  }

  private _buffer: Buffer;

  private _header: ValidOggHeader;
  public get header(): ValidOggHeader {
    return this._header;
  }

  private _payload: OggPayload;
  public get payload(): OggPayload {
    return this._payload;
  }

  constructor(buffer: Buffer, continuedPacket?: OggPacket);
  constructor(buffer: Buffer, continuedPacket?: OggPacket, header?: OggHeader) {
    header = header ?? OggPage.parseOggHeader(buffer);
    if (!header.isValid) {
      throw new Error('Invalid Ogg page');
    }
    this._header = header;

    this._buffer = buffer.slice(0, this._header.pageSize);

    this._payload = OggPage.parseOggPayload(
      this._buffer,
      this._header,
      continuedPacket,
    );
  }
}

class OggTransformer extends Transform {
  private receivedIceRequest = false;
  private lastIncompletePacket: OggPacket = undefined;

  private isIceRequest(buffer: Buffer): boolean {
    return buffer.toString('utf8').startsWith('SOURCE');
  }

  private transformPage(page: OggPage) {
    page.payload.packets.forEach((packet) => {
      if (packet.complete) {
        this.push(packet.data);
      }
    });
  }

  override _transform(
    chunk: Buffer,
    encoding: BufferEncoding,
    callback: TransformCallback,
  ): void {
    // Expect ICECast HTTP SOURCE request
    if (!this.receivedIceRequest) {
      if (this.isIceRequest(chunk)) {
        this.receivedIceRequest = true;
        return callback();
      } else {
        return callback(
          new Error('Expected SOURCE request as part of ICECast protocol'),
        );
      }
    }

    try {
      const pages = OggPage.parsePages(chunk, this.lastIncompletePacket);

      pages.forEach((page) => this.transformPage(page));

      // Persist last incomplete packet
      const [lastPage] = pages.slice(-1);
      const [lastPacket] = lastPage.payload.packets.slice(-1);
      this.lastIncompletePacket = lastPacket.complete ? undefined : lastPacket;
    } catch (err) {
      return callback(err);
    }

    callback();
  }
}

export default OggTransformer;
