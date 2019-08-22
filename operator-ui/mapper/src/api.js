import axios from 'axios';

async function cmd(c, mapper, args=undefined) {
    const url = `/api/${mapper}/${c}`;
    const resp = await axios.post(url, args);
    return resp.data;
}

const api = {
    async getPanels() {
        const resp = await axios.get('/api/panels');
        return resp.data;
    },

    async getMapperState(mapper) {
        const resp = await axios.get(`/api/${mapper}`);
        return resp.data;
    },

    async setGuess(mapper, guess) {
        return await cmd('setGuess', mapper, {guess});
    },

    async setMode(mapper, mode) {
        return await cmd('setMode', mapper, {mode});
    },

    async increment(mapper) {
        return await cmd('increment', mapper);
    },

    async decrement(mapper) {
        return await cmd('decrement', mapper);
    },

    async next(mapper) {
        return await cmd('next', mapper);
    },

    async prev(mapper) {
        return await cmd('prev', mapper);
    },
};

export default api;

export const ApiMixin = {
  methods: api,
};


