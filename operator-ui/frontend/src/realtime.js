import _ from 'lodash';
import ShareDB from  'sharedb/lib/client';
import WebSocket from 'reconnecting-websocket';

let settings;

let store;

export function init(s) {
  store = s;
  const host = window.location.host;

  const url = `ws://${host}/api`;
  const socket = new WebSocket(url);

  const connection = new ShareDB.Connection(socket);

  const update = () => {
    store.commit('realtimeLoaded', true);
    store.commit('realtimeChange', settings.data);
  };

  socket.addEventListener('close', () => {
    if (settings) {
      settings.destroy();
      store.commit('realtimeLoaded', false);
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
  if (!store.state.realtimeLoaded) {
    return;
  }
  settings.submitOp(op);
}

export function nothingPending() {
  return new Promise((resolve) => {
    settings.whenNothingPending(resolve);
  });
}

export const ops = {
  number(key, newval, oldval) {
    const p = _.isArray(key) ? key : [key];
    return {p, na: newval-oldval};
  },
  replace(key, newval) {
    const p = _.isArray(key) ? key : [key];
    return {p, oi: newval};
  },
  move(key, oldIndex, newIndex) {
    const p = _.isArray(key) ? key : [key];
    return {p: [...p, oldIndex], lm:newIndex};
  },
  insert(key, newIndex, element) {
    const p = _.isArray(key) ? key : [key];
    return {p: [...p, newIndex], li:element};
  },
  delete(key, oldIndex, element) {
    const p = _.isArray(key) ? key : [key];
    return {p: [...p, oldIndex], ld:element};
  },
  add(key, k, obj) {
    const p = _.isArray(key) ? key : [key];
    return {p: [...p, k], oi:obj};
  },
  remove(key, k, obj) {
    const p = _.isArray(key) ? key : [key];
    return {p: [...p, k], od: obj};
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
