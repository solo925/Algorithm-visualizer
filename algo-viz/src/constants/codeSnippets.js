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
