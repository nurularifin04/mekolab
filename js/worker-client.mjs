const workerPath = new URL('./worker.js', import.meta.url);
const worker = new Worker(workerPath, { type: 'module' });

export const runWorker = (message, transferable = []) => {
  return new Promise((resolve, reject) => {
    worker.postMessage(message, transferable);
    worker.onmessage = (event) => resolve(event.data);
    worker.onerror = (error) => reject(error);
  });
}