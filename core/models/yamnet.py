"""YAMNet adapters (general sound events, also the privacy/speech filter).

Source:  Google YAMNet, MobileNet-v1 on AudioSet, via Kaggle Models
         (formerly TF Hub): https://www.kaggle.com/models/google/yamnet
License: Apache 2.0
Input:   16 kHz mono float32 in [-1, 1]. One patch is 0.975 s (15,600 samples).
Output:  521 AudioSet class scores (sigmoid) and a 1024-d embedding
         (global average pool before the classifier).

Two variants share the interface:
* `yamnet`        TensorFlow SavedModel, float32. Accurate, needs TensorFlow (laptop).
* `yamnet-tflite` the Kaggle "classification-tflite" int8 model on LiteRT. ~4 MB,
                  no TensorFlow needed: the device-parity option.
"""

from __future__ import annotations

import csv
import zipfile
from pathlib import Path

import numpy as np

from .base import BaseAudioModel, ModelUnavailable, log

KAGGLE_TF = "google/yamnet/tensorFlow2/yamnet"
KAGGLE_TFLITE = "google/yamnet/tfLite/classification-tflite"


def _download(handle: str) -> Path:
    try:
        import kagglehub
    except ImportError as e:
        raise ModelUnavailable("kagglehub is not installed (pip install kagglehub)") from e
    try:
        return Path(kagglehub.model_download(handle))
    except Exception as e:  # network or Kaggle errors
        raise ModelUnavailable(f"could not download {handle} from Kaggle: {e}") from e


class YamnetTF(BaseAudioModel):
    model_id = "yamnet"
    model_version = "1 (TF SavedModel, fp32)"
    source = "https://www.kaggle.com/models/google/yamnet/tensorFlow2/yamnet"
    license = "Apache 2.0"
    input_format = "16 kHz mono float32, 0.975 s patches"

    def _load(self) -> None:
        try:
            import tensorflow as tf
        except ImportError as e:
            raise ModelUnavailable("TensorFlow is not installed. Use yamnet-tflite instead.") from e
        if self.threads:
            try:
                tf.config.threading.set_intra_op_parallelism_threads(self.threads)
                tf.config.threading.set_inter_op_parallelism_threads(1)
            except RuntimeError:
                log.warning("TensorFlow already initialised, thread limit for yamnet not applied")
        path = _download(KAGGLE_TF)
        self._model = tf.saved_model.load(str(path))
        class_map = self._model.class_map_path().numpy().decode()
        with open(class_map, encoding="utf-8") as f:
            self.labels = [r["display_name"] for r in csv.DictReader(f)]
        # YAMNet's documented patch: 0.96 s of log-mel frames = 15,600 samples at 16 kHz
        self.sample_rate = 16000
        self.window_seconds = 15600 / 16000
        _, emb, _ = self._model(np.zeros(15600, dtype=np.float32))
        self.embedding_dim = int(emb.shape[-1])

    def _run(self, window: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
        scores, emb, _ = self._model(window.reshape(-1))
        # one patch per 0.975 s window; average defensively if the model returns more
        return scores.numpy().mean(0), emb.numpy().mean(0)

    def _embed_batch(self, windows: np.ndarray) -> np.ndarray:
        return self._run(windows[0])[1]

    def _scores_batch(self, windows: np.ndarray) -> np.ndarray:
        return self._run(windows[0])[0]

    def _both_batch(self, windows: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
        s, e = self._run(windows[0])
        return e, s


class YamnetTFLite(BaseAudioModel):
    model_id = "yamnet-tflite"
    model_version = "1 (TFLite, int8 activations)"
    source = "https://www.kaggle.com/models/google/yamnet/tfLite/classification-tflite"
    license = "Apache 2.0"
    input_format = "16 kHz mono float32, input length read from the model"

    def _load(self) -> None:
        try:
            from ai_edge_litert.interpreter import Interpreter
        except ImportError as e:
            raise ModelUnavailable("ai-edge-litert is not installed (pip install ai-edge-litert)") from e
        path = next(_download(KAGGLE_TFLITE).glob("*.tflite"))
        with zipfile.ZipFile(path) as z:  # labels are embedded as TFLite metadata
            self.labels = z.read("yamnet_label_list.txt").decode().splitlines()
        # the embedding is an intermediate tensor, so it must be preserved after invoke()
        self._it = Interpreter(model_path=str(path), num_threads=self.threads, experimental_preserve_all_tensors=True)
        self._it.allocate_tensors()
        inp = self._it.get_input_details()[0]
        self._in_idx = inp["index"]
        self._out_idx = self._it.get_output_details()[0]["index"]
        emb = next((d for d in self._it.get_tensor_details() if d["name"].endswith("reduce_mean")), None)
        if emb is None:
            raise ModelUnavailable("embedding tensor (reduce_mean) not found in this YAMNet TFLite file")
        self._emb_idx = emb["index"]
        self._emb_q = emb["quantization"]
        self.sample_rate = 16000
        self.window_seconds = int(inp["shape"][-1]) / self.sample_rate
        self.embedding_dim = int(np.prod(emb["shape"]))

    def _invoke(self, window: np.ndarray) -> None:
        self._it.set_tensor(self._in_idx, window.reshape(-1).astype(np.float32))
        self._it.invoke()

    def _read_embedding(self) -> np.ndarray:
        q = self._it.get_tensor(self._emb_idx).reshape(-1)
        scale, zero = self._emb_q
        return (q.astype(np.float32) - zero) * scale if scale else q.astype(np.float32)

    def _embed_batch(self, windows: np.ndarray) -> np.ndarray:
        self._invoke(windows[0])
        return self._read_embedding()

    def _both_batch(self, windows: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
        self._invoke(windows[0])
        return self._read_embedding(), self._it.get_tensor(self._out_idx).reshape(-1)

    def _scores_batch(self, windows: np.ndarray) -> np.ndarray:
        self._invoke(windows[0])
        return self._it.get_tensor(self._out_idx).reshape(-1)
