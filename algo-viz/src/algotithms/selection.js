function selectionSort(arr, add, line, inc,stats) {
    
    const n = arr.length;
    line(0);
    for (let i = 0; i < n; i++) {
      line(1);
      let minIdx = i;
      line(2);
      for (let j = i + 1; j < n; j++) {
        line(3);
        add("compare", { i: minIdx, j });
        inc("compares");
        add("complexity", { comps: stats.compares, swaps: stats.swaps });
        if (arr[j] < arr[minIdx]) minIdx = j;
      }
      line(5);
      if (minIdx !== i) {
        [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
        add("swap", { i, j: minIdx });
        inc("swaps");
        add("complexity", { comps: stats.compares, swaps: stats.swaps });
        inc("writes", 2);
        add("complexity", { comps: stats.compares, swaps: stats.swaps });
      }
    }
  }


  export default selectionSort;