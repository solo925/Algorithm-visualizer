// src/App.js
import React, { useState, useEffect, useRef, useCallback } from "react";
import "./App.css";

const BAR_COUNT = 40;
const MIN_SPEED = 1;
const MAX_SPEED = 200;

// ---------- UI ----------
function App() {
  const [array, setArray] = useState([]);
  const [sorting, setSorting] = useState(false);
  const [paused, setPaused] = useState(false);
  const [speed, setSpeed] = useState(100);
  const [algorithm, setAlgorithm] = useState("bubble");

  // ---- stats ----
  const [stats, setStats] = useState({
    compares: 0,
    swaps: 0,
    reads: 0,
    writes: 0
  });

  // ---- code simulation ----
  const [currentLine, setCurrentLine] = useState(null);
  const codeLines = codeSnippets[algorithm];

  const [compared, setCompared] = useState([]);
  const [pivot, setPivot] = useState([]);
  const abortController = useRef(null);
  const pausePromise = useRef(null);

  // ---------- lifecycle ----------
  useEffect(() => resetArray(), []);

  // ---------- helpers ----------
  const resetArray = useCallback(() => {
    if (abortController.current) abortController.current.abort();
    setSorting(false);
    setPaused(false);
    const arr = Array.from({ length: BAR_COUNT }, () => rand(10, 400));
    setArray(arr);
    setCompared([]);
    setPivot([]);
    setStats({ compares: 0, swaps: 0, reads: 0, writes: 0 });
    setCurrentLine(null);
  }, []);

  const handleSort = () => {
    if (sorting && !paused) return;
    if (paused) {
      // continue
      pausePromise.current?.resolve();
      setPaused(false);
      return;
    }
    setSorting(true);
    setPaused(false);
    abortController.current = new AbortController();
    const signal = abortController.current.signal;

    const animations = getAnimations([...array], algorithm, setStats, setCurrentLine, codeLines);
    playAnimations(animations, signal);
  };

  const pause = () => {
    if (!sorting || paused) return;
    setPaused(true);
    pausePromise.current = {};
    pausePromise.current.promise = new Promise((r) => (pausePromise.current.resolve = r));
  };

  const stop = () => {
    abortController.current?.abort();
    setSorting(false);
    setPaused(false);
  };

  const restart = () => {
    stop();
    resetArray();
  };

  async function playAnimations(animations, signal) {
    for (const anim of animations) {
      if (signal.aborted) return;
      if (paused) await pausePromise.current.promise;
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
        case "line":
          setCurrentLine(anim.line);
          break;
        default:
          break;
      }
      await sleep(MAX_SPEED + MIN_SPEED - speed);
    }
    setSorting(false);
    setPaused(false);
  }

  return (
    <div className="App">
      <h1>Algorithm Visualizer</h1>

      {/* ---------- CONTROLS ---------- */}
      <div className="controls">
        {!sorting || paused ? (
          <button onClick={handleSort}>Start</button>
        ) : (
          <button onClick={pause}>Pause</button>
        )}
        <button onClick={paused ? handleSort : pause} disabled={!sorting}>
          {paused ? "Continue" : "Pause"}
        </button>
        <button onClick={stop} disabled={!sorting && !paused}>
          Stop
        </button>
        <button onClick={restart}>Restart</button>

        <label>
          Algorithm:
          <select
            value={algorithm}
            onChange={(e) => {
              setAlgorithm(e.target.value);
              resetArray();
            }}
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
        </label>
      </div>

      {/* ---------- STATS ---------- */}
      <div className="stats">
        <span>Size: {array.length}</span>
        <span>Algorithm: {algorithm}</span>
        <span>Comparisons: {stats.compares}</span>
        <span>Swaps: {stats.swaps}</span>
      </div>

      {/* ---------- GRID & CODE ---------- */}
      <div className="main">
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

        <div className="code-panel">
          <h3>Code ({algorithm})</h3>
          <pre>
            {codeLines.map((line, idx) => (
              <div key={idx} className={idx === currentLine ? "highlight" : ""}>
                {line}
              </div>
            ))}
          </pre>
        </div>
      </div>
    </div>
  );
}

// ---------- HELPERS ----------
function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ---------- CODE SNIPPETS ----------
const codeSnippets = {
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

// ---------- ANIMATION GENERATORS ----------
function getAnimations(arr, algo, setStats, setCurrentLine, codeLines) {
  const animations = [];
  const stats = { compares: 0, swaps: 0, reads: 0, writes: 0 };

  function add(type, payload) {
    animations.push({ type, ...payload });
  }

  function line(idx) {
    animations.push({ type: "line", line: idx });
  }

  function inc(key, val = 1) {
    stats[key] += val;
    setStats({ ...stats });
  }

  switch (algo) {
    case "bubble":
      bubbleSort(arr, add, line, inc);
      break;
    case "selection":
      selectionSort(arr, add, line, inc);
      break;
    case "insertion":
      insertionSort(arr, add, line, inc);
      break;
    case "merge":
      mergeSort(arr, 0, arr.length - 1, add, line, inc);
      break;
    default:
      break;
  }
  add("clear", {});
  return animations;
}

// ---------- SORTS ----------
function bubbleSort(arr, add, line, inc) {
  const n = arr.length;
  line(0);
  for (let i = 0; i < n - 1; i++) {
    line(1);
    for (let j = 0; j < n - i - 1; j++) {
      line(2);
      add("compare", { i: j, j: j + 1 });
      inc("compares");
      if (arr[j] > arr[j + 1]) {
        line(3);
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
        add("swap", { i: j, j: j + 1 });
        inc("swaps");
        inc("writes", 2);
      }
    }
  }
}

function selectionSort(arr, add, line, inc) {
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
      if (arr[j] < arr[minIdx]) minIdx = j;
    }
    line(5);
    if (minIdx !== i) {
      [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
      add("swap", { i, j: minIdx });
      inc("swaps");
      inc("writes", 2);
    }
  }
}

function insertionSort(arr, add, line, inc) {
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
      j--;
      if (j >= 0) {
        line(3);
        inc("compares");
      }
    }
    line(6);
    arr[j + 1] = key;
    add("overwrite", { i: j + 1, val: key });
    inc("writes");
  }
}

function mergeSort(arr, l, r, add, line, inc) {
  if (l >= r) return;
  line(2);
  const mid = Math.floor((l + r) / 2);
  line(3);
  mergeSort(arr, l, mid, add, line, inc);
  line(4);
  mergeSort(arr, mid + 1, r, add, line, inc);
  line(5);
  merge(arr, l, mid, r, add, line, inc);
}

function merge(arr, l, mid, r, add, line, inc) {
  const left = arr.slice(l, mid + 1);
  const right = arr.slice(mid + 1, r + 1);
  let i = 0,
    j = 0,
    k = l;
  while (i < left.length && j < right.length) {
    add("compare", { i: l + i, j: mid + 1 + j });
    inc("compares");
    if (left[i] <= right[j]) {
      arr[k] = left[i];
      add("overwrite", { i: k, val: left[i] });
      inc("writes");
      i++;
    } else {
      arr[k] = right[j];
      add("overwrite", { i: k, val: right[j] });
      inc("writes");
      j++;
    }
    k++;
  }
  while (i < left.length) {
    arr[k] = left[i];
    add("overwrite", { i: k, val: left[i] });
    inc("writes");
    i++;
    k++;
  }
  while (j < right.length) {
    arr[k] = right[j];
    add("overwrite", { i: k, val: right[j] });
    inc("writes");
    j++;
    k++;
  }
  add("pivot", { indices: Array.from({ length: r - l + 1 }, (_, idx) => l + idx) });
}

export default App;