  function bubbleSort(arr, add, line, inc,stats) {
    
    const n = arr.length;
    line(0);
    for (let i = 0; i < n - 1; i++) {
      line(1);
      for (let j = 0; j < n - i - 1; j++) {
        line(2);
        add("compare", { i: j, j: j + 1 });
        inc("compares");
        add("complexity", { comps: stats.compares, swaps: stats.swaps });
        if (arr[j] > arr[j + 1]) {
          line(3);
          [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
          add("swap", { i: j, j: j + 1 });
          inc("swaps");
          add("complexity", { comps: stats.compares, swaps: stats.swaps });
          inc("writes", 2);
          add("complexity", { comps: stats.compares, swaps: stats.swaps });
        }
      }
    }
  }

  export default bubbleSort;