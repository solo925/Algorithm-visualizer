import React from 'react';

export default function Stats({ stats, size, algorithm }) {
  return (
    <div className="stats">
      <span>Size: {size}</span>
      <span>Algorithm: {algorithm}</span>
      <span>Comparisons: {stats.compares}</span>
      <span>Swaps: {stats.swaps}</span>
      <span>Reads: {stats.reads}</span>
      <span>Writes: {stats.writes}</span>
    </div>
  );
} 