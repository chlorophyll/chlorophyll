import ShareDB from  'sharedb/lib/client';
import WebSocket from 'reconnecting-websocket';

let settings;

export function init(store) {
  const host = window.location.host;

  const url = `ws://${host}/api`;
  const socket = new WebSocket(url);

  const connection = new ShareDB.Connection(socket);

  const update = () => {
    store.commit('realtimeChange', settings.data)
  };

  socket.addEventListener('close', () => {
    if (settings) {
      settings.destroy();
      settings = undefined;
    }
  });

  const open = () => {
    if (!settings) {
      settings = connection.get('global', 'settings');
      settings.subscribe(update);
      settings.on('op', update);
    }
  };

  socket.addEventListener('open', open);
  open();

}

export function submitOp(op) {
  settings.submitOp(op);
}

export const ops = {
  number(newval, oldval) {
    return {na: newval-oldval};
  },
  replace(newval) {
    return {oi: newval};
  }
};

export function mixin(key, op) {
  return {
    computed: {
      [key]: {
        get() {
          return this.$store.state.realtime[key];
        },
        set(newval) {
          const oldval = this.$store.state.realtime[key];
          if (oldval !== undefined && oldval !== newval) {
            settings.submitOp({
              p: [key],
              ...op(newval, oldval)
            })
          }
        }
      },
    },
  };
}
