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
  number(key, newval, oldval) {
    return {p: [key], na: newval-oldval};
  },
  replace(key, newval) {
    return {p: [key], oi: newval};
  },
  move(key, oldIndex, newIndex) {
    return {p: [key, oldIndex], lm:newIndex};
  },
  insert(key, newIndex, element) {
    return {p: [key, newIndex], li:element};
  },
  delete(key, oldIndex, element) {
    return {p: [key, oldIndex], ld:element};
  },
  add(key, k, obj) {
    return {p: [key, k], oi:obj};
  },
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
            settings.submitOp(op(key, newval, oldval));
          }
        }
      },
    },
  };
}
