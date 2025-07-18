import React from 'react';

function Controls({
  sorting,
  paused,
  stepMode,
  size,
  algorithm,
  speed,
  theme,
  setSize,
  setAlgorithm,
  setSpeed,
  setTheme,
  setStepMode,
  setShowModal,
  start,
  pause,
  stop,
  nextStep,
  MIN_SIZE,
  MAX_SIZE,
  MIN_SPEED,
  MAX_SPEED,
  codeSnippets
}) {
  return (
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
          value={theme ?? dark}
          onChange={(e) => setTheme(e.target.value)}
          disabled={sorting}
        >
          {Object.keys(theme).map((t) => (
            <option key={t} value={t}>
              {t[0].toUpperCase() + t.slice(1)}
            </option>
          ))}
        </select>
      </label>

      {/* cheat-sheet */}
      <button onClick={() => setShowModal(true)}>?</button>
    </div>
  );
}

export default Controls; 