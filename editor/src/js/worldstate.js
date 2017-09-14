import store from 'chl/vue/store';

function WorldState() {

    let self = this;

    this.tracked = {};
    let history = [];
    let idx = -1;

    function restore() {
        let snapshot = history[idx];
        // Sync state with Vuex
        store.commit('init', snapshot);
        for (let prop in snapshot) {
            if (self.tracked.hasOwnProperty(prop)) {
                self.tracked[prop].restore(snapshot[prop]);
            }
        }
    }

    this.checkpoint = function() {
        let snapshot = {};
        // future optimization: only snapshot properties that have changed
        // would be nice for not making empty snapshots as well.
        for (let prop in self.tracked) {
            if (self.tracked.hasOwnProperty(prop)) {
                snapshot[prop] = self.tracked[prop].snapshot();
            }
        }
        // Sync state with Vuex
        store.commit('init', snapshot);
        history = history.slice(0, idx + 1);
        history.push(snapshot);
        idx++;
    };

    this.undo = function() {
        if (idx == 0)
            return;

        idx--;
        restore();
    };

    this.redo = function() {
        if (idx == history.length-1)
            return;
        idx++;
        restore();
    };

    this.init = function(start) {
        // fill in initial properties
        for (let prop in start) {
            if (start.hasOwnProperty(prop)) {
                self.tracked[prop] = start[prop];
            }
        }
        self.checkpoint();
    };
}
export const worldState = new WorldState();
