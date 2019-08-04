import _ from 'lodash';

function randomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function swap(arr, i, j) {
    const temp = arr[i];
    arr[i] = arr[j];
    arr[j] = temp;
}

function partitionInPlace(arr, left, right) {
    const pivotIndex = randomInt(left, right);
    let storeIndex = left;
    const pivotValue = arr[pivotIndex];
    for (let i = left; i <= right; i++) {
        if (arr[i] < pivotValue) {
            swap(arr, storeIndex, i);
            storeIndex++;
        }
    }
    return storeIndex;
}

export function quickSelect(original, stat) {
    const arr = _.uniq(original);
    const k = Math.floor(arr.length * stat);
    let left = 0;
    let right = arr.length - 1;

    while (right !== left) {
        const pivotIndex = partitionInPlace(arr, left, right);
        if (k < pivotIndex) {
            right = pivotIndex - 1;
        } else {
            left = pivotIndex;
        }
    }
    return arr[k];
}
