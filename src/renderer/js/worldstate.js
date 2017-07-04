import Immutable from 'immutable';

export default function WorldState(start) {

    let self = this;

    function restore() {
        let snapshot = history[idx];
        for (prop in snapshot) {
            self[prop].restore(snapshot[prop]);
        }
    }

    let history = [];
    let idx = -1;

    this.checkpoint = function() {
        let snapshot = {};
        // future optimization: only snapshot properties that have changed
        // would be nice for not making empty snapshots as well.
        for (prop in self) {
            if (self[prop].hasOwnProperty('snapshot')) {
                snapshot[prop] = self[prop].snapshot();
            }
        }
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

    // fill in initial properties
    for (prop in start) {
        this[prop] = start[prop];
    }
    this.checkpoint();
}
