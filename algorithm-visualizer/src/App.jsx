import React, { useState, useEffect } from 'react';
import ArrayVisualizer from './components/ArrayVisualizer';
import Controls from './components/controls';
import algorithms from './constants';

const generateRandomArray = (size = 15) =>
  Array.from({ length: size }, () => Math.floor(Math.random() * 50) + 10);

function App() {
  const algorithmOptions = Object.keys(algorithms);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState(algorithmOptions[0]);
  const [array, setArray] = useState(generateRandomArray());
  const [steps, setSteps] = useState([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [highlight, setHighlight] = useState([]);
  const [isSwapping, setIsSwapping] = useState(false);

  const startAnimation = () => {
    const stepFunction = algorithms[selectedAlgorithm];
    if (typeof stepFunction === 'function') {
      const steps = stepFunction(array);
      console.log('Generated steps:', steps); // Debug output
      setSteps(steps);
    } else {
      setSteps([]);
    }
  };

  useEffect(() => {
    if (steps.length > 0) {
      setStepIndex(0);
    }
  }, [steps]);

  useEffect(() => {
    console.log('useEffect triggered:', stepIndex, steps.length); // Debug output
    if (stepIndex >= steps.length || steps.length === 0) return;
    if (isSwapping) return; // Wait for swap to finish

    const step = steps[stepIndex];
    console.log('Processing step:', step); // Debug output

    setHighlight(step.indices);

    if (step.type === 'swap') {
      setIsSwapping(true);
      setTimeout(() => {
        setArray((prev) => {
          const newArr = [...prev];
          const [i, j] = step.indices;
          [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
          console.log('Swapping:', i, j, 'Result:', newArr); // Debug output
          return newArr;
        });
        setIsSwapping(false);
        setStepIndex((prev) => prev + 1);
      }, 500); // swap delay
    } else {
      setTimeout(() => {
        setStepIndex((prev) => prev + 1);
      }, 500); // compare delay
    }
  }, [stepIndex, steps, isSwapping]);

  useEffect(() => {
    console.log('Array state updated:', array); // Debug output
  }, [array]);

  const resetArray = () => {
    setArray(generateRandomArray());
    setSteps([]);
    setStepIndex(0);
    setHighlight([]);
    setIsSwapping(false);
  };

  return (
    <div className="h-screen bg-gray-100 p-6 text-center flex flex-col justify-between items-center">
      <h1 className="text-3xl font-bold mb-4">{selectedAlgorithm} Visualizer</h1>
      <div className="flex-grow w-full flex justify-center items-center overflow-y-auto">
        <ArrayVisualizer array={array} highlight={highlight} />
      </div>
      <Controls
        onStart={startAnimation}
        onReset={resetArray}
        selectedAlgorithm={selectedAlgorithm}
        setSelectedAlgorithm={setSelectedAlgorithm}
        algorithmOptions={algorithmOptions}
      />
    </div>
  );
}

export default App;
