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
    console.log(resp.data);
    return resp.data.gid;
  }
};

export default api;

export const ApiMixin = {
  methods: api,
};
