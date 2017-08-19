
function IDGenerator() {
    let last_id = 0;

    this.newgid = function() {
        return last_id++;
    };

    this.snapshot = function() {
        return last_id;
    };

    this.restore = function(snapshot) {
        last_id = snapshot;
    };
};

function WorldState(start) {

    let self = this;

    function restore() {
        let snapshot = history[idx];
        for (let prop in snapshot) {
            if (self.hasOwnProperty(prop)) {
                self[prop].restore(snapshot[prop]);
            }
        }
    }

    let history = [];
    let idx = -1;

    this.checkpoint = function() {
        let snapshot = {};
        // future optimization: only snapshot properties that have changed
        // would be nice for not making empty snapshots as well.
        for (let prop in self) {
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
    for (let prop in start) {
        if (start.hasOwnProperty(prop)) {
            this[prop] = start[prop];
        }
    }
    this.checkpoint();
}
let idGen = new IDGenerator();

export function initWorldState(initialState) {
    initialState.idGen = idGen;
    worldState = new WorldState(initialState);
}

export let worldState;
export let newgid = idGen.newgid;
