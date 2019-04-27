import * as dgram from 'dgram';
import _ from 'lodash';

import ModelBase from '@/common/model';

const ArtnetPort = 6454;

enum ArtNetOp {
    OpDmx = 0x5000,
    OpSync = 0x5200,
}

const protocolVersion = 14;

function writePacketHeader(packet: Buffer, op: ArtNetOp) {
    const str = 'Art-Net\0';
    packet.write(str, 0, str.length, 'ascii');
    packet.writeUInt16LE(op, 8);
    packet.writeUInt16BE(protocolVersion, 10);
}



function initPackets() {
    const dmxPacket = Buffer.alloc(512+18);
    writePacketHeader(dmxPacket, ArtNetOp.OpDmx);

    const syncPacket = Buffer.alloc(14);
    writePacketHeader(syncPacket, ArtNetOp.OpSync);
    return {dmxPacket, syncPacket};
}

const {dmxPacket, syncPacket} = initPackets();

interface ArtnetController {
    host: string;
}

interface ArtnetStripMapping {
    controller: ArtnetController;
    strip: number;
    startUniverse: number;
    startChannel: number;
}

interface StripSegment {
    strip: number;
    startIndex: number;
    universe: number;
    startChannel: number;
    numChannels: number;
};

const maxChannelsInUniverse = 510;
const maxPixelsInUniverse = maxChannelsInUniverse / 3;
function getStripSegments(model: ModelBase, {controller, strip, startUniverse, startChannel}: ArtnetStripMapping): Array<StripSegment> {
    const numPixelsInStrip = model.numPixelsInStrip(strip);
    const numInFirstUniverse = Math.min(maxPixelsInUniverse - startChannel, numPixelsInStrip);

    const numRemaining = numPixelsInStrip - numInFirstUniverse;
    const segments = [
        {
            strip,
            startIndex: 0,
            universe: startUniverse,
            startChannel: startChannel,
            numChannels: 3*numInFirstUniverse,
        }
    ];

    if (numRemaining > 0) {
        const fullUniverses = Math.floor(numRemaining / maxPixelsInUniverse);
        for (let universeIdx = 0; universeIdx < fullUniverses; universeIdx++) {
            const universe = startUniverse + universeIdx + 1;
            segments.push({
                strip,
                startIndex: universeIdx * maxPixelsInUniverse + numInFirstUniverse,
                universe,
                startChannel: 0,
                numChannels: 3*maxPixelsInUniverse,
            });
        }

        const pixelsInLastUniverse = numRemaining % maxPixelsInUniverse;
        if (pixelsInLastUniverse != 0) {
            const universe = startUniverse + fullUniverses + 1;
            segments.push({
                strip,
                startIndex: numPixelsInStrip - pixelsInLastUniverse,
                universe,
                startChannel: 0,
                numChannels: 3*pixelsInLastUniverse,
            });
        }
    }
    return segments;
}

export class ArtnetRegistry {
    socket: dgram.Socket;
    stripMapping: Array<ArtnetStripMapping>;
    stripsByUniverse: Map<number, Array<StripSegment>>;
    seqNumByUniverse: {[key: number]: number};
    controllerByUniverse: {[key: number]: ArtnetController};
    model: ModelBase;

    constructor(model: ModelBase, stripMapping: Array<ArtnetStripMapping>) {
        this.stripMapping = stripMapping;
        this.model = model;

        this.stripsByUniverse = new Map();
        this.seqNumByUniverse = {};
        this.controllerByUniverse = {};

        for (const mapping of stripMapping) {
            for (const segment of getStripSegments(model, mapping)) {
                const s = this.stripsByUniverse.get(segment.universe);
                if (s === undefined) {
                    this.stripsByUniverse.set(segment.universe, [segment]);
                } else {
                    s.push(segment);
                }
                this.seqNumByUniverse[segment.universe] = 0;
                this.controllerByUniverse[segment.universe] = mapping.controller;
            }
        }

        this.socket = dgram.createSocket({type: 'udp4', reuseAddr: true});
    }


    sendFrame(pixels: Float32Array, sync=true) {
        for (const [universe, segments] of this.stripsByUniverse.entries()) {
            const seqNum = this.seqNumByUniverse[universe] + 1;
            dmxPacket.writeUInt8(seqNum, 12);
            this.seqNumByUniverse[universe] = (seqNum + 1) % 254;
            let count = 0;
            for (const {strip, startIndex, startChannel, numChannels} of segments) {
                const stripOffset = this.model.strip_offsets[strip];
                const hUniv = (universe >> 8) & 0xff;
                const lUniv = universe & 0xff;
                dmxPacket.writeUInt8(lUniv, 14);
                dmxPacket.writeUInt8(hUniv, 15);
                let ptr = 4*stripOffset + startIndex;
                count += numChannels;
                for (let channel = startChannel; channel < numChannels; channel++) {
                    if (ptr % 4 == 3) {
                        ptr++;
                    }
                    dmxPacket.writeUInt8(pixels[ptr]*255, channel + 18);
                    ptr++;
                }
            }
            const hCount = (count >> 8) & 0xff;
            const lCount = count & 0xff;
            dmxPacket.writeUInt8(hCount, 16);
            dmxPacket.writeUInt8(lCount, 17);
            const controller = this.controllerByUniverse[universe];
            this.socket.send(dmxPacket, 0, count+18, ArtnetPort, controller.host);
        }
        if (sync) {
            this.socket.send(syncPacket, 0, syncPacket.length, ArtnetPort, '2.255.255.255');
        }
    }
}
