import ShareDB from  'sharedb/lib/client';
import WebSocket from 'reconnecting-websocket';

export let settings;

export function init(store) {
  const socket = new WebSocket('ws://localhost:3000');
  const connection = new ShareDB.Connection(socket);

  settings = connection.get('global', 'settings');

  const update = () => store.commit('realtimeChange', settings.data);

  settings.subscribe(update);
  settings.on('op', update);
}

