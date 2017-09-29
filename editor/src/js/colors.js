/* TODO make this not repeat colors
    this.unusedColors = colors;

    this.get = function() {};
    this.recycle = function() {};

*/
const ColorPool = {
    colors: [
        '#24c6ff',
        '#ffa21a',
        '#774cfa',
        '#b4f553',
        '#da00a9',
        '#00df8a',
        '#8938a7',
        '#b7b500',
        '#015ad6',
        '#cd9600',
        '#798bff',
        '#009d47',
        '#ff8eff',
        '#236b1f',
        '#b31361',
        '#02a894',
        '#ff6c7e',
        '#007087',
        '#ad2943',
        '#7bbcff',
        '#6a7c00',
        '#d6afff',
        '#7c6000',
        '#ff8eb4',
        '#854875',
    ],
    idx: 0,
    random() {
        this.idx = (this.idx + 1) % this.colors.length;
        return this.colors[this.idx];
    },
    reset() {
        this.idx = 0;
    }
};

export default ColorPool;
