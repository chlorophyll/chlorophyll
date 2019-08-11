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

  async startPlaylist() {
    await axios.post('/api/playlist/start');
  },

  async stopPlaylist() {
    await axios.post('/api/playlist/stop');
  },
};

export default api;

export const ApiMixin = {
  methods: api,
};
