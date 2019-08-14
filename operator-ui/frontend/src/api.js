import axios from 'axios';

const api = {
  async fetchState() {
    const resp = await axios.get('/api/state');
    return resp.data;
  },

  async startPattern(patternId, mappingId) {
    await axios.post('/api/start', {patternId, mappingId});
  },

  async stopPattern() {
    await axios.post('/api/stop');
  },

  async newgid() {
    const resp = await axios.post('/api/newgid');
    return resp.data.gid;
  },

  async playlistStart() {
    await axios.post('/api/playlist/start');
  },

  async playlistStop() {
    await axios.post('/api/playlist/stop');
  },
  async playlistNext() {
    await axios.post('/api/playlist/next');
  },
  async playlistPrev() {
    await axios.post('/api/playlist/prev');
  },
};

export default api;

export const ApiMixin = {
  methods: api,
};
