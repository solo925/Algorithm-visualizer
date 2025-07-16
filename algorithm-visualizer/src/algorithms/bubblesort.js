export function getBubbleSortSteps(array) {
    const steps = [];
    const arr = array.slice(); // clone to avoid mutation
  
    for (let i = 0; i < arr.length - 1; i++) {
      for (let j = 0; j < arr.length - i - 1; j++) {
        steps.push({ type: 'compare', indices: [j, j + 1] });
  
        if (arr[j] > arr[j + 1]) {
          [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
          steps.push({ type: 'swap', indices: [j, j + 1] });
        }
      }
    }
  
    return steps;
  }
  