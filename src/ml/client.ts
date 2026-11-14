import type { WorkerRequest } from '../worker';

type Pending = { resolve: (v: any) => void; reject: (e: Error) => void; onProgress?: (msg: any) => void };

const worker = new Worker(new URL('../worker.ts', import.meta.url), { type: 'module' });
const pending = new Map<number, Pending>();
let nextId = 1;

worker.onmessage = (e) => {
  const msg = e.data;
  const p = pending.get(msg.id);
  if (!p) return;
  if (msg.error) {
    pending.delete(msg.id);
    p.reject(new Error(msg.error));
  } else if ('result' in msg) {
    pending.delete(msg.id);
    p.resolve(msg.result);
  } else p.onProgress?.(msg);
};

type DistributiveOmit<T, K extends keyof any> = T extends unknown ? Omit<T, K> : never;

export function runWorker<R>(req: DistributiveOmit<WorkerRequest, 'id'>, onProgress?: (msg: any) => void): Promise<R> {
  const id = nextId++;
  return new Promise<R>((resolve, reject) => {
    pending.set(id, { resolve, reject, onProgress });
    worker.postMessage({ ...req, id } as WorkerRequest);
  });
}
