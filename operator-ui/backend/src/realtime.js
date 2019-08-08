import ShareDb from 'sharedb';
import WebSocket from 'ws';
import WebSocketJSONStream from '@teamwork/websocket-json-stream';

let backend;
let state;

export function initAsync(initialState) {
  return new Promise((resolve, reject) => {
    backend = new ShareDb({
      disableDocAction: true,
      disableSpaceDelimitedActions: true,
    });
    const connection = backend.connect();
    const doc = connection.get('global', 'settings');
    doc.subscribe(err => {
      if (err) {
        reject(err);
      }
      state = doc;
      if (doc.type === null) {
        doc.create(initialState, () => resolve(doc));
      } else {
        resolve(doc);
      }
    });
  });
}

export function listen(server) {
  const wss = new WebSocket.Server({server});

    wss.on('connection', ws => {
        const stream = new WebSocketJSONStream(ws);
        backend.listen(stream);
    });
}
