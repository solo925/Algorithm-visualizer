// src/App.js
import React, { useState, useEffect, useRef } from "react";
import "./App.css";

const BAR_COUNT = 40;
const MIN_SPEED = 1;
const MAX_SPEED = 200;

// ---------- UI ----------
function App() {
  const [array, setArray] = useState([]);
  const [sorting, setSorting] = useState(false);
  const [speed, setSpeed] = useState(100);
  const [algorithm, setAlgorithm] = useState("bubble");
  const [compared, setCompared] = useState([]);   // indices being compared
  const [pivot, setPivot] = useState([]);         // indices that are pivots / sorted
  const abortController = useRef(null);           // lets us cancel an ongoing sort

  // Create random array once on first load
  useEffect(() => resetArray(), []);

  function resetArray() {
    if (abortController.current) abortController.current.abort();
    setSorting(false);
    const arr = Array.from({ length: BAR_COUNT }, () => rand(10, 400));
    setArray(arr);
    setCompared([]);
    setPivot([]);
  }

  function handleSort() {
    if (sorting) return;
    setSorting(true);
    abortController.current = new AbortController();
    const signal = abortController.current.signal;

    const animations = getAnimations([...array], algorithm);
    playAnimations(animations, signal);
  }

  async function playAnimations(animations, signal) {
    for (const anim of animations) {
      if (signal.aborted) return;

      switch (anim.type) {
        case "compare":
          setCompared([anim.i, anim.j]);
          break;
        case "swap":
          setArray((prev) => {
            const next = [...prev];
            [next[anim.i], next[anim.j]] = [next[anim.j], next[anim.i]];
            return next;
          });
          break;
        case "overwrite":
          setArray((prev) => {
            const next = [...prev];
            next[anim.i] = anim.val;
            return next;
          });
          break;
        case "pivot":
          setPivot(anim.indices);
          break;
        case "clear":
          setCompared([]);
          setPivot([]);
          break;
        default:
          break;
      }
      await sleep(MAX_SPEED + MIN_SPEED - speed); // speed slider
    }
    setSorting(false);
  }

  return (
    <div className="App">
      <h1>Algorithm Visualizer</h1>

      <div className="controls">
        <button onClick={handleSort} disabled={sorting}>
          Sort!
        </button>
        <button onClick={resetArray} disabled={sorting}>
          New Array
        </button>

        <label>
          Algorithm:
          <select
            value={algorithm}
            onChange={(e) => setAlgorithm(e.target.value)}
            disabled={sorting}
          >
            <option value="bubble">Bubble</option>
            <option value="selection">Selection</option>
            <option value="insertion">Insertion</option>
            <option value="merge">Merge</option>
          </select>
        </label>

        <label>
          Speed:
          <input
            type="range"
            min={MIN_SPEED}
            max={MAX_SPEED}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            disabled={sorting}
          />
          {speed}
        </label>
      </div>

      <div className="bars">
        {array.map((h, idx) => (
          <div
            key={idx}
            className={`bar ${
              compared.includes(idx)
                ? "compare"
                : pivot.includes(idx)
                ? "pivot"
                : ""
            }`}
            style={{ height: `${h}px` }}
          />
        ))}
      </div>
    </div>
  );
}

// ---------- HELPER ----------
function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ---------- ANIMATION GENERATORS ----------
function getAnimations(arr, algo) {
  const animations = [];

  function add(type, payload) {
    animations.push({ type, ...payload });
  }

  switch (algo) {
    case "bubble":
      bubbleSort(arr, add);
      break;
    case "selection":
      selectionSort(arr, add);
      break;
    case "insertion":
      insertionSort(arr, add);
      break;
    case "merge":
      mergeSort(arr, 0, arr.length - 1, add);
      break;
    default:
      break;
  }
  add("clear", {});
  return animations;
}

// Bubble
function bubbleSort(arr, add) {
  const n = arr.length;
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      add("compare", { i: j, j: j + 1 });
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
        add("swap", { i: j, j: j + 1 });
      }
    }
  }
}

// Selection
function selectionSort(arr, add) {
  const n = arr.length;
  for (let i = 0; i < n; i++) {
    let minIdx = i;
    for (let j = i + 1; j < n; j++) {
      add("compare", { i: minIdx, j });
      if (arr[j] < arr[minIdx]) minIdx = j;
    }
    if (minIdx !== i) {
      [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
      add("swap", { i, j: minIdx });
    }
  }
}

// Insertion
function insertionSort(arr, add) {
  for (let i = 1; i < arr.length; i++) {
    let key = arr[i];
    let j = i - 1;
    add("compare", { i: j, j: i });
    while (j >= 0 && arr[j] > key) {
      arr[j + 1] = arr[j];
      add("overwrite", { i: j + 1, val: arr[j] });
      j--;
      if (j >= 0) add("compare", { i: j, j: j + 1 });
    }
    arr[j + 1] = key;
    add("overwrite", { i: j + 1, val: key });
  }
}

// Merge (iterative style)
function mergeSort(arr, l, r, add) {
  if (l >= r) return;
  const mid = Math.floor((l + r) / 2);
  mergeSort(arr, l, mid, add);
  mergeSort(arr, mid + 1, r, add);
  merge(arr, l, mid, r, add);
}

function merge(arr, l, mid, r, add) {
  const left = arr.slice(l, mid + 1);
  const right = arr.slice(mid + 1, r + 1);
  let i = 0,
    j = 0,
    k = l;
  while (i < left.length && j < right.length) {
    add("compare", { i: l + i, j: mid + 1 + j });
    if (left[i] <= right[j]) {
      arr[k] = left[i];
      add("overwrite", { i: k, val: left[i] });
      i++;
    } else {
      arr[k] = right[j];
      add("overwrite", { i: k, val: right[j] });
      j++;
    }
    k++;
  }
  while (i < left.length) {
    arr[k] = left[i];
    add("overwrite", { i: k, val: left[i] });
    i++;
    k++;
  }
  while (j < right.length) {
    arr[k] = right[j];
    add("overwrite", { i: k, val: right[j] });
    j++;
    k++;
  }
  add("pivot", { indices: Array.from({ length: r - l + 1 }, (_, idx) => l + idx) });
}

export default App;