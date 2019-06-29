import * as dgram from 'dgram';
import _ from 'lodash';
import ModelBase from '../model';

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

// User-facing human readable config format
interface UserStripConfig {
  startUniverse: number;
  startChannel: number;
}

interface UserConfig {
  [host: string]: Array<UserStripConfig>
}

const maxChannelsInUniverse = 510;
const maxPixelsInUniverse = maxChannelsInUniverse / 3;
function getStripSegments(model: ModelBase, {controller, strip, startUniverse, startChannel}: ArtnetStripMapping): Array<StripSegment> {
    const numPixelsInStrip = model.numPixelsInStrip(strip);
    const numChannelsInFirst = Math.min(maxChannelsInUniverse - startChannel, 3*numPixelsInStrip);
    const numInFirstUniverse = numChannelsInFirst / 3;

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
    stripsByUniverseAndController: Map<string, Map<number, Array<StripSegment>>>;
    seqNumByUniverse: {[key: number]: number};
    controllerByUniverse: {[key: number]: ArtnetController};
    model: ModelBase;

    constructor(model: ModelBase, stripMapping: Array<ArtnetStripMapping>) {
        this.stripMapping = stripMapping;
        this.model = model;

        this.stripsByUniverseAndController = new Map();
        this.seqNumByUniverse = {};
        this.controllerByUniverse = {};

        for (const mapping of stripMapping) {
            const {controller} = mapping;
            let stripsByUniverse = this.stripsByUniverseAndController.get(controller.host);
            if (stripsByUniverse === undefined) {
                stripsByUniverse = new Map();
                this.stripsByUniverseAndController.set(controller.host, stripsByUniverse);
            }
            for (const segment of getStripSegments(model, mapping)) {
                const s = stripsByUniverse.get(segment.universe);
                if (s === undefined) {
                    stripsByUniverse.set(segment.universe, [segment]);
                } else {
                    s.push(segment);
                }
                this.seqNumByUniverse[segment.universe] = 0;
            }
        }

        this.socket = dgram.createSocket({type: 'udp4', reuseAddr: true});
    }


    sendFrame(pixels: Float32Array, sync=true) {
        for (const [host, stripsByUniverse] of this.stripsByUniverseAndController.entries()) {
            for (const [universe, segments] of stripsByUniverse.entries()) {
                const packet = Buffer.from(dmxPacket);
                const seqNum = 0; //this.seqNumByUniverse[universe] + 1;
                packet.writeUInt8(seqNum, 12);
                const hUniv = (universe >> 8) & 0xff;
                const lUniv = universe & 0xff;
                packet.writeUInt8(lUniv, 14);
                packet.writeUInt8(hUniv, 15);
                //this.seqNumByUniverse[universe] = seqNum % 254;
                let count = 0;
                for (const {strip, startIndex, startChannel, numChannels} of segments) {
                    const stripOffset = this.model.strip_offsets[strip];
                    let ptr = 4*(stripOffset + startIndex);
                    count += numChannels;
                    const endChannel = startChannel + numChannels;
                    for (let channel = startChannel; channel < endChannel; channel++) {
                        if (ptr % 4 == 3) {
                            ptr++;
                        }
                        packet.writeUInt8(pixels[ptr]*255, channel + 18);
                        ptr++;
                    }
                }
                const hCount = (count >> 8) & 0xff;
                const lCount = count & 0xff;
                packet.writeUInt8(hCount, 16);
                packet.writeUInt8(lCount, 17);
                this.socket.send(packet, 0, count+18, ArtnetPort, host);
            }
            if (sync) {
                this.socket.send(syncPacket, 0, syncPacket.length, ArtnetPort, '2.255.255.255');
            }
        }
    }
}

export function settingsFromUserConfig(config: UserConfig): Array<ArtnetStripMapping> {
    if (!config)
        return [];

    const mappings = [];
    Object.entries(config).forEach(([host, strips]) => {
        Object.entries(strips).forEach(([strip, params]) => {
            mappings.push({
                controller: {host},
                strip: parseInt(strip, 10),
                startUniverse: params.startUniverse,
                startChannel: params.startChannel
            });
        });
    });

    return mappings;
}

export function userConfigFromSettings(settings: Array<ArtnetStripMapping>): UserConfig {
    if (!settings)
        return {};

    const config = {};
    const controllers = new Set(settings.map(s => s.controller.host));
    controllers.forEach(host => {
        config[host] = {};
    });
    settings.forEach(({controller, strip, startUniverse, startChannel}) => {
        // Use string keys to make the syntax a bit friendlier in YAML
        config[controller.host][String(strip)] = {startUniverse, startChannel};
    });

    return config;
}

