export const themes = {
    dark: {
      bg: "#181818",
      text: "#ffffff",
      bar: "#61dafb",
      compare: "#ff5555",
      pivot: "#50fa7b",
      modalBg: "#282c34"
    },
    light: {
      bg: "#ffffff",
      text: "#000000",
      bar: "#007acc",
      compare: "#ff0000",
      pivot: "#00a000",
      modalBg: "#f0f0f0"
    },
    neon: {
      bg: "#000",
      text: "#0ff",
      bar: "#f0f",
      compare: "#ff0",
      pivot: "#0f0",
      modalBg: "#111"
    }
  };

  

export const complexity = {
    bubble: { time: "O(n²)", space: "O(1)", stable: "Yes" },
    selection: { time: "O(n²)", space: "O(1)", stable: "No" },
    insertion: { time: "O(n²) – O(n)", space: "O(1)", stable: "Yes" },
    merge: { time: "O(n log n)", space: "O(n)", stable: "Yes" }
  };


    // Place codeSnippets here before its first usage
    export const codeSnippets = {
        bubble: [
          "for (let i = 0; i < n - 1; i++) {",
          "  for (let j = 0; j < n - i - 1; j++) {",
          "    if (arr[j] > arr[j + 1]) {",
          "      swap(arr, j, j + 1);",
          "    }",
          "  }",
          "}"
        ],
        selection: [
          "for (let i = 0; i < n; i++) {",
          "  let minIdx = i;",
          "  for (let j = i + 1; j < n; j++) {",
          "    if (arr[j] < arr[minIdx]) minIdx = j;",
          "  }",
          "  swap(arr, i, minIdx);",
          "}"
        ],
        insertion: [
          "for (let i = 1; i < n; i++) {",
          "  let key = arr[i];",
          "  let j = i - 1;",
          "  while (j >= 0 && arr[j] > key) {",
          "    arr[j + 1] = arr[j];",
          "    j--;",
          "  }",
          "  arr[j + 1] = key;",
          "}"
        ],
        merge: [
          "function mergeSort(arr, l, r) {",
          "  if (l >= r) return;",
          "  const mid = Math.floor((l + r) / 2);",
          "  mergeSort(arr, l, mid);",
          "  mergeSort(arr, mid + 1, r);",
          "  merge(arr, l, mid, r);",
          "}"
        ]
      };