import React from 'react';

const Controls = ({ onStart, onReset, selectedAlgorithm, setSelectedAlgorithm, algorithmOptions }) => {
  return (
    <div className="my-4 flex flex-col md:flex-row gap-4 justify-center items-center">
      {algorithmOptions && setSelectedAlgorithm && (
        <select
          value={selectedAlgorithm}
          onChange={(e) => setSelectedAlgorithm(e.target.value)}
          className="px-4 py-2 border rounded-md"
        >
          {algorithmOptions.map((algo, idx) => (
            <option key={idx} value={algo}>
              {algo}
            </option>
          ))}
        </select>
      )}
      <div className="flex gap-4">
        <button onClick={onStart} className="bg-green-500 text-white px-4 py-2 rounded">
          Start
        </button>
        <button onClick={onReset} className="bg-gray-500 text-white px-4 py-2 rounded">
          Reset
        </button>
      </div>
    </div>
  );
};

export default Controls;

