function mergeSort(arr, l, r, add, line, inc, stats) {

    if (l >= r) return;
    line(2);
    const mid = Math.floor((l + r) / 2);
    line(3);
    mergeSort(arr, l, mid, add, line, inc, stats);
    line(4);
    mergeSort(arr, mid + 1, r, add, line, inc, stats);
    line(5);
    merge(arr, l, mid, r, add, line, inc, stats);
  }

  function merge(arr, l, mid, r, add, line, inc, stats) {

    const left = arr.slice(l, mid + 1);
    const right = arr.slice(mid + 1, r + 1);
    let i = 0,
      j = 0,
      k = l;
    while (i < left.length && j < right.length) {
      add("compare", { i: l + i, j: mid + 1 + j });
      inc("compares");
      add("complexity", { comps: stats.compares, swaps: stats.swaps });
      if (left[i] <= right[j]) {
        arr[k] = left[i];
        add("overwrite", { i: k, val: left[i] });
        inc("writes");
        add("complexity", { comps: stats.compares, swaps: stats.swaps });
        i++;
      } else {
        arr[k] = right[j];
        add("overwrite", { i: k, val: right[j] });
        inc("writes");
        add("complexity", { comps: stats.compares, swaps: stats.swaps });
        j++;
      }
      k++;
    }
    while (i < left.length) {
      arr[k] = left[i];
      add("overwrite", { i: k, val: left[i] });
      inc("writes");
      add("complexity", { comps: stats.compares, swaps: stats.swaps });
      i++;
      k++;
    }
    while (j < right.length) {
      arr[k] = right[j];
      add("overwrite", { i: k, val: right[j] });
      inc("writes");
      add("complexity", { comps: stats.compares, swaps: stats.swaps });
      j++;
      k++;
    }
    add("pivot", { indices: Array.from({ length: r - l + 1 }, (_, idx) => l + idx) });
  }

  export default mergeSort;