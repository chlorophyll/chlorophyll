import ShareDB from  'sharedb/lib/client';
import WebSocket from 'reconnecting-websocket';

let settings;

export function init(store) {
  const socket = new WebSocket('ws://localhost:8080/api');
  const connection = new ShareDB.Connection(socket);

  settings = connection.get('global', 'settings');

    const update = () => {
        console.log(settings.data);
        store.commit('realtimeChange', settings.data)
    };

  settings.subscribe(update);
  settings.on('op', update);
}

export function submitOp(op) {
    settings.submitOp(op);
}
