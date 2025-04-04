import { DanceClass, Conflict } from '../types';

// Create a worker instance
let worker: Worker | null = null;

// Initialize the worker
function getWorker() {
  if (!worker) {
    // Create a new worker
    worker = new Worker(new URL('./optimizerWorker.ts', import.meta.url), { type: 'module' });
  }
  return worker;
}

// Define return type for optimization functions
type OptimizationResult = Promise<{ orderedClasses: DanceClass[]; conflicts: Conflict[] }>;

// Optimize show order using the worker
export const optimizeShowOrderAsync = async (
  classes: DanceClass[],
  minGap: number
): OptimizationResult => {
  return new Promise((resolve, reject) => {
    const worker = getWorker();
    
    // Set up the message handler
    const handleMessage = (event: MessageEvent) => {
      worker.removeEventListener('message', handleMessage);
      resolve(event.data);
    };
    
    // Set up error handler
    const handleError = (error: ErrorEvent) => {
      worker.removeEventListener('error', handleError);
      reject(new Error(`Worker error: ${error.message}`));
    };
    
    // Listen for the response
    worker.addEventListener('message', handleMessage);
    worker.addEventListener('error', handleError);
    
    // Send the data to the worker
    worker.postMessage({
      type: 'optimize',
      classes,
      minGap
    });
  });
};

// Fallback function for when Web Workers aren't available
export const optimizeShowOrderSync = async (
  classes: DanceClass[],
  minGap: number
): OptimizationResult => {
  // Import the optimizer from the original file
  const { optimizeShowOrder } = await import('./showOptimizer');
  return optimizeShowOrder(classes, minGap);
};

// Determine if Web Workers are available
const hasWebWorkerSupport = typeof Worker !== 'undefined';

// Export the appropriate function based on browser support
export const optimizeShowOrder = hasWebWorkerSupport
  ? optimizeShowOrderAsync
  : optimizeShowOrderSync;

// Clean up worker when no longer needed
export const terminateWorker = () => {
  if (worker) {
    worker.terminate();
    worker = null;
  }
};