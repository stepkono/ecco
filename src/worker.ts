/// <reference lib="webworker" />
import { nmf } from './dsp/analysis';
import { simulateCommunity } from './ml/dataset';
import { quantise, train, type DataItem, type FloatModel } from './ml/model';

export type WorkerRequest =
  | { id: number; type: 'nmf'; mag: Float32Array; frames: number; K: number; iters: number }
  | { id: number; type: 'simulate'; sources: Record<string, Float32Array>; n: number; seed: number }
  | { id: number; type: 'train'; items: DataItem[]; epochs: number; init?: FloatModel };

const post = (msg: unknown, transfer: Transferable[] = []) => (self as unknown as Worker).postMessage(msg, transfer);

self.onmessage = (e: MessageEvent<WorkerRequest>) => {
  const req = e.data;
  try {
    if (req.type === 'nmf') {
      const r = nmf(req.mag, req.frames, req.K, req.iters, 3, (p) => post({ id: req.id, progress: p }));
      post({ id: req.id, result: r });
    } else if (req.type === 'simulate') {
      const items = simulateCommunity(req.sources, req.n, req.seed, (p) => post({ id: req.id, progress: p }));
      post({ id: req.id, result: items });
    } else if (req.type === 'train') {
      const { model, calib } = train(req.items, req.epochs, (epoch, loss) => post({ id: req.id, progress: epoch / req.epochs, epoch, loss }), req.init);
      post({ id: req.id, result: { model, quant: quantise(model, calib) } });
    }
  } catch (err) {
    post({ id: req.id, error: String(err) });
  }
};
