import React from 'react';

const ArrayVisualizer = ({ array, highlight }) => {
  console.log('ArrayVisualizer render:', array, highlight); // Debug output
  return (
    <div className="flex items-end h-64 gap-1 justify-center">
      {array.map((value, idx) => {
        const isHighlighted = highlight?.includes(idx);
        return (
          <div
            key={idx}
            className={`w-4 ${isHighlighted ? 'bg-yellow-300' : 'bg-blue-500'} transition-all duration-300`}
            style={{ height: `${value * 2}px` }}
          ></div>
        );
      })}
    </div>
  );
};

export default ArrayVisualizer;
