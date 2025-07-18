import React, { useState, useEffect, useRef, useCallback } from "react";
import "./App.css";
import { themes, complexity, codeSnippets } from "./constants";
import { MIN_SIZE, MAX_SIZE, MIN_SPEED, MAX_SPEED, BAR_COUNT } from './config';
import { rand,sleep } from "./utils";
import beep from "./utils/beep";
import bubbleSort from "./algotithms/bubble";
import { useStats} from "./contexts/statsContext";
import selectionSort from "./algotithms/selection";
import mergeSort from "./algotithms/merge";
import insertionSort from "./algotithms/insertion";
import Stats from "./components/Stats";
import CodePanel from "./components/CodePanel";
import Modal from "./components/Modal";
import Visualization from "./components/Visualization";
import Controls from "./components/Controls";


export default function App() {

      
const {stats,setStats} = useStats();
  
  // restore from URL
  const getInitial = (key, fallback) => {
    const params = new URLSearchParams(window.location.search);
    return params.has(key) ? Number(params.get(key)) : fallback;
  };

  const [size, setSize] = useState(() =>
    Math.min(MAX_SIZE, Math.max(MIN_SIZE, getInitial("size",BAR_COUNT)))
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


  const [currentLine, setCurrentLine] = useState(null);
  const [liveComplexity, setLiveComplexity] = useState("");
  const [compared, setCompared] = useState([]);
  const [pivot, setPivot] = useState([]);
  const [showModal, setShowModal] = useState(false);
  

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
        bubbleSort(arr, add, line, inc,stats);
        break;
      case "selection":
        selectionSort(arr, add, line, inc,stats);
        break;
      case "insertion":
        insertionSort(arr, add, line, inc,stats);
        break;
      case "merge":
        mergeSort(arr, 0, arr.length - 1, add, line, inc,stats);
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


  return (
    <div className="App" style={{ background: css.bg, color: css.text }}>
      <h1>Algorithm Visualizer</h1>

      {/* ---------- CONTROLS ---------- */}
      <Controls
        sorting={sorting}
        paused={paused}
        stepMode={stepMode}
        size={size}
        algorithm={algorithm}
        speed={speed}
        theme={theme}
        setSize={setSize}
        setAlgorithm={setAlgorithm}
        setSpeed={setSpeed}
        setTheme={setTheme}
        setStepMode={setStepMode}
        setShowModal={setShowModal}
        start={start}
        pause={pause}
        stop={stop}
        nextStep={nextStep}
        MIN_SIZE={MIN_SIZE}
        MAX_SIZE={MAX_SIZE}
        MIN_SPEED={MIN_SPEED}
        MAX_SPEED={MAX_SPEED}
        codeSnippets={codeSnippets}
        themes={themes}
      />

      {/* ---------- STATS ---------- */}
      <Stats stats={stats} size={size} algorithm={algorithm}/>
      {/* ---------- VISUALIZATION ---------- */}
      <Visualization
        array={array}
        compared={compared}
        css={css}
        pivot={pivot}
      />
      {/*---------- CODE PANEL--------- */}
      <CodePanel 
        algorithm={algorithm}
        currentLine={currentLine}
        liveComplexity={liveComplexity}
        css={css}
        codeLines={codeLines}
      />
      {/* ---------- MODAL ---------- */}
      {showModal && (
        <Modal
          css={css} 
          complexity={complexity}
          algorithm={algorithm} 
          setShowModal={setShowModal}
        />
      )}
    </div>
  );
}


