import * as THREE from 'three';

function ColorPool() {
    this.colors = [
        0x24c6ff,
        0xffa21a,
        0x774cfa,
        0xb4f553,
        0xda00a9,
        0x00df8a,
        0x8938a7,
        0xb7b500,
        0x015ad6,
        0xcd9600,
        0x798bff,
        0x009d47,
        0xff8eff,
        0x236b1f,
        0xb31361,
        0x02a894,
        0xff6c7e,
        0x007087,
        0xad2943,
        0x7bbcff,
        0x6a7c00,
        0xd6afff,
        0x7c6000,
        0xff8eb4,
        0x854875,
    ];

    /* TODO make this not repeat colors
    this.unusedColors = colors;

    this.get = function() {};
    this.recycle = function() {};

    */
    let i = 0;
    this.random = function() {
        i = (i + 1) % (this.colors.length);
        return this.colors[i];
    };
}
export default new ColorPool();
