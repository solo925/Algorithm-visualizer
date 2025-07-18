export const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));