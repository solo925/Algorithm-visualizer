import React, { useState, useEffect, useRef, useCallback } from "react";
import "./App.css";

// ===================== CONFIG =====================
const MIN_SIZE = 5;
const MAX_SIZE = 150;
const MIN_SPEED = 1;
const MAX_SPEED = 200;
const BAR_COUNT = 40;

// themes
const themes = {
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

// complexity table
const complexity = {
  bubble: { time: "O(n²)", space: "O(1)", stable: "Yes" },
  selection: { time: "O(n²)", space: "O(1)", stable: "No" },
  insertion: { time: "O(n²) – O(n)", space: "O(1)", stable: "Yes" },
  merge: { time: "O(n log n)", space: "O(n)", stable: "Yes" }
};

// ===================== HOOKS / HELPERS =====================
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// beep
const beep = (freq = 200, dur = 40) => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    osc.frequency.value = freq;
    osc.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + dur / 1000);
  } catch {}
};

// ===================== MAIN COMPONENT =====================
export default function App() {
  // restore from URL
  const getInitial = (key, fallback) => {
    const params = new URLSearchParams(window.location.search);
    return params.has(key) ? Number(params.get(key)) : fallback;
  };

  const [size, setSize] = useState(() =>
    Math.min(MAX_SIZE, Math.max(MIN_SIZE, getInitial("size", BAR_COUNT)))
  );
  const [algorithm, setAlgorithm] = useState(
    ["bubble", "selection", "insertion", "merge"].includes(
      getInitial("alg", "bubble")
    )
      ? getInitial("alg", "bubble")
      : "bubble"
  );
  const [speed, setSpeed] = useState(() =>
    Math.min(MAX_SPEED, Math.max(MIN_SPEED, getInitial("speed", 100)))
  );

  // theme
  const [theme, setTheme] = useState("dark");
  const css = themes[theme];
  useEffect(() => {
    document.documentElement.style.setProperty("--bg", css.bg);
    document.documentElement.style.setProperty("--text", css.text);
    document.documentElement.style.setProperty("--bar", css.bar);
    document.documentElement.style.setProperty("--compare", css.compare);
    document.documentElement.style.setProperty("--pivot", css.pivot);
    document.documentElement.style.setProperty("--modalBg", css.modalBg);
  }, [css]);

  // array & state
  const [array, setArray] = useState([]);
  const [sorting, setSorting] = useState(false);
  const [paused, setPaused] = useState(false);
  const [stepMode, setStepMode] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  const [stats, setStats] = useState({
    compares: 0,
    swaps: 0,
    reads: 0,
    writes: 0
  });
  const [currentLine, setCurrentLine] = useState(null);
  const [liveComplexity, setLiveComplexity] = useState("");
  const [compared, setCompared] = useState([]);
  const [pivot, setPivot] = useState([]);
  const [showModal, setShowModal] = useState(false);

  // Place codeSnippets here before its first usage
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
  const codeLines = codeSnippets[algorithm];
  const animationsRef = useRef([]);
  const abortRef = useRef(null);
  const pauseRef = useRef(null);

  // ---------- lifecycle ----------
  useEffect(() => {
    resetArray();
  }, [size]);

  // URL persistence
  useEffect(() => {
    const params = new URLSearchParams();
    params.set("size", size);
    params.set("alg", algorithm);
    params.set("speed", speed);
    window.history.replaceState({}, "", `?${params.toString()}`);
  }, [size, algorithm, speed]);

  // ---------- helpers ----------
  const resetArray = useCallback(() => {
    setArray(Array.from({ length: size }, () => rand(10, 400)));
    setCompared([]);
    setPivot([]);
    setStats({ compares: 0, swaps: 0, reads: 0, writes: 0 });
    setCurrentLine(null);
    setStepIndex(0);
    setLiveComplexity("");
    animationsRef.current = [];
  }, [size]);

  const getAnimations = (arr, algo) => {
    const animations = [];
    const stats = { compares: 0, swaps: 0, reads: 0, writes: 0 };

    const add = (type, payload) => animations.push({ type, ...payload });
    const line = (idx) => add("line", { line: idx });
    const inc = (key, val = 1) => (stats[key] += val);

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
    }
    add("clear", {});
    setStats(stats);
    return animations;
  };

  const playFrame = async (anim, beepOn = true) => {
    if (!anim) return;
    switch (anim.type) {
      case "compare":
        setCompared([anim.i, anim.j]);
        if (beepOn) beep(200, 30);
        break;
      case "swap":
        setArray((prev) => {
          const next = [...prev];
          [next[anim.i], next[anim.j]] = [next[anim.j], next[anim.i]];
          return next;
        });
        if (beepOn) beep(400, 30);
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
      case "complexity":
        setLiveComplexity(
          computeONotation(algorithm, anim.comps, anim.swaps, array.length)
        );
        break;
      default:
        break;
    }
  };

  const start = async () => {
    if (paused) {
      pauseRef.current?.resolve?.();
      setPaused(false);
      return;
    }
    if (sorting) return;
    setSorting(true);
    setPaused(false);
    abortRef.current = new AbortController();
    const signal = abortRef.current.signal;

    animationsRef.current = getAnimations([...array], algorithm);
    const anims = animationsRef.current;

    if (stepMode) {
      setStepIndex(0);
      await playFrame(anims[0], false);
      return;
    }

    for (let idx = 0; idx < anims.length; idx++) {
      if (signal.aborted) break;
      if (paused) {
        pauseRef.current = {};
        pauseRef.current.promise = new Promise((r) => (pauseRef.current.resolve = r));
        await pauseRef.current.promise;
      }
      await playFrame(anims[idx]);
      await sleep(MAX_SPEED + MIN_SPEED - speed);
    }
    setSorting(false);
  };

  const pause = () => {
    if (!sorting) return;
    setPaused(true);
  };

  const stop = () => {
    abortRef.current?.abort();
    setSorting(false);
    setPaused(false);
    resetArray();
  };

  const nextStep = async () => {
    if (!stepMode) {
      setStepMode(true);
      animationsRef.current = getAnimations([...array], algorithm);
      setStepIndex(0);
    }
    const anims = animationsRef.current;
    if (stepIndex < anims.length) {
      await playFrame(anims[stepIndex], false);
      setStepIndex((i) => i + 1);
    } else {
      setSorting(false);
      setStepMode(false);
    }
  };

  const computeONotation = (alg, comps, swaps, n) => {
    switch (alg) {
      case "bubble":
        return comps + swaps > n * n * 0.8 ? `O(n²) ≈ ${comps + swaps}` : `≈ O(n) best-case`;
      case "selection":
        return `O(n²) ≈ ${comps + swaps}`;
      case "insertion":
        return comps + swaps < n * 1.5 ? `O(n) ≈ ${comps + swaps}` : `O(n²) ≈ ${comps + swaps}`;
      case "merge":
        return `O(n log n) ≈ ${comps + swaps}`;
      default:
        return "";
    }
  };

  // ---------- sorts ----------
  function bubbleSort(arr, add, line, inc) {
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

  // ---------- code snippets ----------
  // ---------- JSX ----------
  return (
    <div className="App" style={{ background: css.bg, color: css.text }}>
      <h1>Algorithm Visualizer</h1>

      {/* ---------- CONTROLS ---------- */}
      <div className="controls">
        {!sorting || paused ? (
          <button onClick={start}>Start</button>
        ) : (
          <button onClick={pause}>Pause</button>
        )}
        <button onClick={pause} disabled={!sorting}>
          {paused ? "Continue" : "Pause"}
        </button>
        <button onClick={stop}>Stop / Reset</button>
        {stepMode && (
          <button onClick={nextStep} disabled={!stepMode}>
            Next Step
          </button>
        )}
        <button onClick={() => setStepMode((m) => !m)}>
          {stepMode ? "Exit Step Mode" : "Step Mode"}
        </button>

        {/* size */}
        <label>
          Size:
          <input
            type="number"
            min={MIN_SIZE}
            max={MAX_SIZE}
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
            disabled={sorting}
          />
        </label>

        {/* algo */}
        <label>
          Algorithm:
          <select
            value={algorithm}
            onChange={(e) => setAlgorithm(e.target.value)}
            disabled={sorting}
          >
            {Object.keys(codeSnippets).map((a) => (
              <option key={a} value={a}>
                {a[0].toUpperCase() + a.slice(1)}
              </option>
            ))}
          </select>
        </label>

        {/* speed */}
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
          {MAX_SPEED + MIN_SPEED - speed} ms
        </label>

        {/* theme */}
        <label>
          Theme:
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            disabled={sorting}
          >
            {Object.keys(themes).map((t) => (
              <option key={t} value={t}>
                {t[0].toUpperCase() + t.slice(1)}
              </option>
            ))}
          </select>
        </label>

        {/* cheat-sheet */}
        <button onClick={() => setShowModal(true)}>?</button>
      </div>

      {/* ---------- STATS ---------- */}
      <div className="stats">
        <span>Size: {size}</span>
        <span>Algorithm: {algorithm}</span>
        <span>Comparisons: {stats.compares}</span>
        <span>Swaps: {stats.swaps}</span>
        <span>Reads: {stats.reads}</span>
        <span>Writes: {stats.writes}</span>
      </div>

      {/* ---------- VISUALIZATION ---------- */}
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
              style={{
                height: `${h}px`,
                background: compared.includes(idx)
                  ? css.compare
                  : pivot.includes(idx)
                  ? css.pivot
                  : css.bar
              }}
            />
          ))}
        </div>

        {/* code panel */}
        <div className="code-panel" style={{ background: css.modalBg }}>
          <h3>Code ({algorithm})</h3>
          <pre>
            {codeLines.map((line, idx) => (
              <div
                key={idx}
                className={idx === currentLine ? "highlight" : ""}
                style={{
                  borderLeftColor: css.compare,
                  background:
                    idx === currentLine ? css.compare + "22" : "transparent"
                }}
              >
                {line}
              </div>
            ))}
          </pre>
          <h4 style={{ marginTop: 12 }}>Live Complexity</h4>
          <pre style={{ fontSize: 14 }}>{liveComplexity || "Ready…"}</pre>
        </div>
      </div>

      {/* ---------- MODAL ---------- */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div
            className="modal-content"
            style={{ background: css.modalBg, color: css.text }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Algorithm Cheat-Sheet</h2>
            <table>
              <thead>
                <tr>
                  <th>Algorithm</th>
                  <th>Time</th>
                  <th>Space</th>
                  <th>Stable</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(complexity).map(([alg, data]) => (
                  <tr key={alg} className={alg === algorithm ? "current" : ""}>
                    <td>{alg[0].toUpperCase() + alg.slice(1)}</td>
                    <td>{data.time}</td>
                    <td>{data.space}</td>
                    <td>{data.stable}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button onClick={() => setShowModal(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ===================== CSS VARIABLES =====================
// Add to App.css:
/*
:root {
  --bg: #181818;
  --text: #ffffff;
  --bar: #61dafb;
  --compare: #ff5555;
  --pivot: #50fa7b;
  --modalBg: #282c34;
}

body {
  background: var(--bg);
  color: var(--text);
  font-family: Arial, sans-serif;
  margin: 0;
}

.controls {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
  margin-bottom: 10px;
}

.stats {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-bottom: 10px;
  font-size: 14px;
}

.main {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  justify-content: center;
}

.bars {
  display: flex;
  align-items: flex-end;
  gap: 2px;
  height: 450px;
}

.bar {
  width: 20px;
  transition: height 0.1s, background 0.1s;
}

.code-panel {
  width: 300px;
  padding: 10px;
  border-radius: 4px;
  font-size: 13px;
  max-height: 450px;
  overflow-y: auto;
}

.highlight {
  border-left: 3px solid var(--compare);
  padding-left: 5px;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-content {
  padding: 20px;
  border-radius: 8px;
  max-width: 500px;
  width: 90%;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  padding: 6px;
  text-align: left;
  border-bottom: 1px solid var(--text);
}

.current {
  font-weight: bold;
  color: var(--pivot);
}
*/











// import React, { useState, useEffect, useRef, useCallback } from "react";
// import "./App.css";

// const BAR_COUNT = 40;
// const MIN_SPEED = 1;
// const MAX_SPEED = 200;

// // ---------- UI ----------
// function App() {
//   const [array, setArray] = useState([]);
//   const [sorting, setSorting] = useState(false);
//   const [paused, setPaused] = useState(false);
//   const [speed, setSpeed] = useState(100);
//   const [algorithm, setAlgorithm] = useState("bubble");

//   // ---- stats ----
//   const [stats, setStats] = useState({
//     compares: 0,
//     swaps: 0,
//     reads: 0,
//     writes: 0
//   });

//   // ---- code simulation ----
//   const [currentLine, setCurrentLine] = useState(null);
//   const codeLines = codeSnippets[algorithm];

//   const [compared, setCompared] = useState([]);
//   const [pivot, setPivot] = useState([]);
//   const abortController = useRef(null);
//   const pausePromise = useRef(null);

//   // ---------- lifecycle ----------
//   useEffect(() => resetArray(), []);

//   // ---------- helpers ----------
//   const resetArray = useCallback(() => {
//     if (abortController.current) abortController.current.abort();
//     setSorting(false);
//     setPaused(false);
//     const arr = Array.from({ length: BAR_COUNT }, () => rand(10, 400));
//     setArray(arr);
//     setCompared([]);
//     setPivot([]);
//     setStats({ compares: 0, swaps: 0, reads: 0, writes: 0 });
//     setCurrentLine(null);
//   }, []);

//   const handleSort = () => {
//     if (sorting && !paused) return;
//     if (paused) {
//       // continue
//       pausePromise.current?.resolve();
//       setPaused(false);
//       return;
//     }
//     setSorting(true);
//     setPaused(false);
//     abortController.current = new AbortController();
//     const signal = abortController.current.signal;

//     const animations = getAnimations([...array], algorithm, setStats, setCurrentLine, codeLines);
//     playAnimations(animations, signal);
//   };

//   const pause = () => {
//     if (!sorting || paused) return;
//     setPaused(true);
//     pausePromise.current = {};
//     pausePromise.current.promise = new Promise((r) => (pausePromise.current.resolve = r));
//   };

//   const stop = () => {
//     abortController.current?.abort();
//     setSorting(false);
//     setPaused(false);
//   };

//   const restart = () => {
//     stop();
//     resetArray();
//   };

//   async function playAnimations(animations, signal) {
//     for (const anim of animations) {
//       if (signal.aborted) return;
//       if (paused) await pausePromise.current.promise;
//       if (signal.aborted) return;

//       switch (anim.type) {
//         case "compare":
//           setCompared([anim.i, anim.j]);
//           break;
//         case "swap":
//           setArray((prev) => {
//             const next = [...prev];
//             [next[anim.i], next[anim.j]] = [next[anim.j], next[anim.i]];
//             return next;
//           });
//           break;
//         case "overwrite":
//           setArray((prev) => {
//             const next = [...prev];
//             next[anim.i] = anim.val;
//             return next;
//           });
//           break;
//         case "pivot":
//           setPivot(anim.indices);
//           break;
//         case "clear":
//           setCompared([]);
//           setPivot([]);
//           break;
//         case "line":
//           setCurrentLine(anim.line);
//           break;
//         default:
//           break;
//       }
//       await sleep(MAX_SPEED + MIN_SPEED - speed);
//     }
//     setSorting(false);
//     setPaused(false);
//   }

//   return (
//     <div className="App">
//       <h1>Algorithm Visualizer</h1>

//       {/* ---------- CONTROLS ---------- */}
//       <div className="controls">
//         {!sorting || paused ? (
//           <button onClick={handleSort}>Start</button>
//         ) : (
//           <button onClick={pause}>Pause</button>
//         )}
//         <button onClick={paused ? handleSort : pause} disabled={!sorting}>
//           {paused ? "Continue" : "Pause"}
//         </button>
//         <button onClick={stop} disabled={!sorting && !paused}>
//           Stop
//         </button>
//         <button onClick={restart}>Restart</button>

//         <label>
//           Algorithm:
//           <select
//             value={algorithm}
//             onChange={(e) => {
//               setAlgorithm(e.target.value);
//               resetArray();
//             }}
//             disabled={sorting}
//           >
//             <option value="bubble">Bubble</option>
//             <option value="selection">Selection</option>
//             <option value="insertion">Insertion</option>
//             <option value="merge">Merge</option>
//           </select>
//         </label>

//         <label>
//           Speed:
//           <input
//             type="range"
//             min={MIN_SPEED}
//             max={MAX_SPEED}
//             value={speed}
//             onChange={(e) => setSpeed(Number(e.target.value))}
//             disabled={sorting}
//           />
//         </label>
//       </div>

//       {/* ---------- STATS ---------- */}
//       <div className="stats">
//         <span>Size: {array.length}</span>
//         <span>Algorithm: {algorithm}</span>
//         <span>Comparisons: {stats.compares}</span>
//         <span>Swaps: {stats.swaps}</span>
//       </div>

//       {/* ---------- GRID & CODE ---------- */}
//       <div className="main">
//         <div className="bars">
//           {array.map((h, idx) => (
//             <div
//               key={idx}
//               className={`bar ${
//                 compared.includes(idx)
//                   ? "compare"
//                   : pivot.includes(idx)
//                   ? "pivot"
//                   : ""
//               }`}
//               style={{ height: `${h}px` }}
//             />
//           ))}
//         </div>

//         <div className="code-panel">
//           <h3>Code ({algorithm})</h3>
//           <pre>
//             {codeLines.map((line, idx) => (
//               <div key={idx} className={idx === currentLine ? "highlight" : ""}>
//                 {line}
//               </div>
//             ))}
//           </pre>
//         </div>
//       </div>
//     </div>
//   );
// }

// // ---------- HELPERS ----------
// function rand(min, max) {
//   return Math.floor(Math.random() * (max - min + 1)) + min;
// }
// function sleep(ms) {
//   return new Promise((r) => setTimeout(r, ms));
// }

// // ---------- CODE SNIPPETS ----------
// const codeSnippets = {
//   bubble: [
//     "for (let i = 0; i < n - 1; i++) {",
//     "  for (let j = 0; j < n - i - 1; j++) {",
//     "    if (arr[j] > arr[j + 1]) {",
//     "      swap(arr, j, j + 1);",
//     "    }",
//     "  }",
//     "}"
//   ],
//   selection: [
//     "for (let i = 0; i < n; i++) {",
//     "  let minIdx = i;",
//     "  for (let j = i + 1; j < n; j++) {",
//     "    if (arr[j] < arr[minIdx]) minIdx = j;",
//     "  }",
//     "  swap(arr, i, minIdx);",
//     "}"
//   ],
//   insertion: [
//     "for (let i = 1; i < n; i++) {",
//     "  let key = arr[i];",
//     "  let j = i - 1;",
//     "  while (j >= 0 && arr[j] > key) {",
//     "    arr[j + 1] = arr[j];",
//     "    j--;",
//     "  }",
//     "  arr[j + 1] = key;",
//     "}"
//   ],
//   merge: [
//     "function mergeSort(arr, l, r) {",
//     "  if (l >= r) return;",
//     "  const mid = Math.floor((l + r) / 2);",
//     "  mergeSort(arr, l, mid);",
//     "  mergeSort(arr, mid + 1, r);",
//     "  merge(arr, l, mid, r);",
//     "}"
//   ]
// };

// // ---------- ANIMATION GENERATORS ----------
// function getAnimations(arr, algo, setStats, setCurrentLine, codeLines) {
//   const animations = [];
//   const stats = { compares: 0, swaps: 0, reads: 0, writes: 0 };

//   function add(type, payload) {
//     animations.push({ type, ...payload });
//   }

//   function line(idx) {
//     animations.push({ type: "line", line: idx });
//   }

//   function inc(key, val = 1) {
//     stats[key] += val;
//     setStats({ ...stats });
//   }

//   switch (algo) {
//     case "bubble":
//       bubbleSort(arr, add, line, inc);
//       break;
//     case "selection":
//       selectionSort(arr, add, line, inc);
//       break;
//     case "insertion":
//       insertionSort(arr, add, line, inc);
//       break;
//     case "merge":
//       mergeSort(arr, 0, arr.length - 1, add, line, inc);
//       break;
//     default:
//       break;
//   }
//   add("clear", {});
//   return animations;
// }

// // ---------- SORTS ----------
// function bubbleSort(arr, add, line, inc) {
//   const n = arr.length;
//   line(0);
//   for (let i = 0; i < n - 1; i++) {
//     line(1);
//     for (let j = 0; j < n - i - 1; j++) {
//       line(2);
//       add("compare", { i: j, j: j + 1 });
//       inc("compares");
//       if (arr[j] > arr[j + 1]) {
//         line(3);
//         [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
//         add("swap", { i: j, j: j + 1 });
//         inc("swaps");
//         inc("writes", 2);
//       }
//     }
//   }
// }

// function selectionSort(arr, add, line, inc) {
//   const n = arr.length;
//   line(0);
//   for (let i = 0; i < n; i++) {
//     line(1);
//     let minIdx = i;
//     line(2);
//     for (let j = i + 1; j < n; j++) {
//       line(3);
//       add("compare", { i: minIdx, j });
//       inc("compares");
//       if (arr[j] < arr[minIdx]) minIdx = j;
//     }
//     line(5);
//     if (minIdx !== i) {
//       [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
//       add("swap", { i, j: minIdx });
//       inc("swaps");
//       inc("writes", 2);
//     }
//   }
// }

// function insertionSort(arr, add, line, inc) {
//   const n = arr.length;
//   line(0);
//   for (let i = 1; i < n; i++) {
//     line(1);
//     const key = arr[i];
//     inc("reads");
//     let j = i - 1;
//     line(3);
//     while (j >= 0 && arr[j] > key) {
//       line(4);
//       arr[j + 1] = arr[j];
//       add("overwrite", { i: j + 1, val: arr[j] });
//       inc("writes");
//       j--;
//       if (j >= 0) {
//         line(3);
//         inc("compares");
//       }
//     }
//     line(6);
//     arr[j + 1] = key;
//     add("overwrite", { i: j + 1, val: key });
//     inc("writes");
//   }
// }

// function mergeSort(arr, l, r, add, line, inc) {
//   if (l >= r) return;
//   line(2);
//   const mid = Math.floor((l + r) / 2);
//   line(3);
//   mergeSort(arr, l, mid, add, line, inc);
//   line(4);
//   mergeSort(arr, mid + 1, r, add, line, inc);
//   line(5);
//   merge(arr, l, mid, r, add, line, inc);
// }

// function merge(arr, l, mid, r, add, line, inc) {
//   const left = arr.slice(l, mid + 1);
//   const right = arr.slice(mid + 1, r + 1);
//   let i = 0,
//     j = 0,
//     k = l;
//   while (i < left.length && j < right.length) {
//     add("compare", { i: l + i, j: mid + 1 + j });
//     inc("compares");
//     if (left[i] <= right[j]) {
//       arr[k] = left[i];
//       add("overwrite", { i: k, val: left[i] });
//       inc("writes");
//       i++;
//     } else {
//       arr[k] = right[j];
//       add("overwrite", { i: k, val: right[j] });
//       inc("writes");
//       j++;
//     }
//     k++;
//   }
//   while (i < left.length) {
//     arr[k] = left[i];
//     add("overwrite", { i: k, val: left[i] });
//     inc("writes");
//     i++;
//     k++;
//   }
//   while (j < right.length) {
//     arr[k] = right[j];
//     add("overwrite", { i: k, val: right[j] });
//     inc("writes");
//     j++;
//     k++;
//   }
//   add("pivot", { indices: Array.from({ length: r - l + 1 }, (_, idx) => l + idx) });
// }

// export default App;