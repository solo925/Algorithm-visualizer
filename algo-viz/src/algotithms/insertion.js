function insertionSort(arr, add, line, inc,stats) {
 
    const n = arr.length;
    line(0);
    for (let i = 1; i < n; i++) {
      line(1);
      const key = arr[i];
      inc("reads");
      let j = i - 1;
      line(3);
      while (j >= 0 && arr[j] > key) {
        line(4);
        arr[j + 1] = arr[j];
        add("overwrite", { i: j + 1, val: arr[j] });
        inc("writes");
        add("complexity", { comps: stats.compares, swaps: stats.swaps });
        j--;
        if (j >= 0) {
          line(3);
          inc("compares");
          add("complexity", { comps: stats.compares, swaps: stats.swaps });
        }
      }
      line(6);
      arr[j + 1] = key;
      add("overwrite", { i: j + 1, val: key });
      inc("writes");
      add("complexity", { comps: stats.compares, swaps: stats.swaps });
    }
  }

  export default insertionSort;