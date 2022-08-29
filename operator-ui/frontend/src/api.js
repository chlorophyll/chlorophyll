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

  async playlistStart(index=0) {
    await axios.post('/api/playlist/start', {index});
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

  async playlistNew() {
    const res = await axios.post('/api/playlist/new');
    return res.data;
  },

  async playlistDelete(playlistId) {
    const res = await axios.post('/api/playlist/delete', {playlistId});
    return res.data;
  },

  async playlistSwitch(playlistId) {
    await axios.post('/api/playlist/switch', {playlistId});
  },

  async shutdown() {
    await axios.post('/api/shutdown');
  }
};

export default api;

export const ApiMixin = {
  methods: api,
};
