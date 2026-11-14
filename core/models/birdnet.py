"""BirdNET 2.4 adapter.

Source:  BirdNET (Cornell Lab of Ornithology & Chemnitz University of Technology),
         loaded through the `birdnet` Python package (MIT), model files from Zenodo.
         https://github.com/birdnet-team/birdnet
License: model weights CC BY-NC-SA 4.0 (non-commercial)
Input:   48 kHz mono float32, 3 s windows (read from the package at load time).
Output:  6,522 species (sigmoid over logits) and a 1024-d embedding.

Runs on the TFLite flatbuffer through LiteRT in-process. We use the package's
downloader and backend classes directly instead of `model.encode_arrays`, because
that API spawns worker processes per call, which would distort latency and memory
measurements and is not what the device will do.
"""

from __future__ import annotations

import numpy as np

from .base import BaseAudioModel, ModelUnavailable


class BirdNet24(BaseAudioModel):
    model_version = "2.4"
    source = "https://github.com/birdnet-team/birdnet (model: zenodo.org/records/15050749)"
    license = "CC BY-NC-SA 4.0 (non-commercial)"
    input_format = "48 kHz mono float32, 3 s windows"

    def __init__(self, threads: int | None = None, precision: str = "fp32") -> None:
        super().__init__(threads)
        self.precision = precision
        self.model_id = "birdnet-2.4" if precision == "fp32" else f"birdnet-2.4-{precision}"
        self.model_version = f"2.4 ({precision}, LiteRT)"

    def _load(self) -> None:
        try:
            from birdnet.acoustic.models.v2_4.model import AcousticModelV2_4
            from birdnet.acoustic.models.v2_4 import tf as bn_tf
        except ImportError as e:
            raise ModelUnavailable("the `birdnet` package is not installed (pip install birdnet)") from e
        backends = {"fp32": bn_tf.AcousticTFBackendFP32V2_4, "fp16": bn_tf.AcousticTFBackendFP16V2_4, "int8": bn_tf.AcousticTFBackendInt8V2_4}
        path, labels = bn_tf.AcousticTFDownloaderV2_4.get_model_path_and_labels("en_us", self.precision)
        self.labels = [str(x) for x in labels]  # "Scientific name_Common name"
        self._backend = backends[self.precision](path, "CPU", False, inference_library="litert")
        self._backend.load()
        if self.threads and self.threads > 1:
            # birdnet pins num_threads=1 per worker process. We run in one process, so rebuild the
            # interpreter the same way (no default delegates, as birdnet does) with more threads.
            try:
                from ai_edge_litert import interpreter as tflite

                it = tflite.Interpreter(
                    str(path), num_threads=self.threads,
                    experimental_op_resolver_type=tflite.OpResolverType.BUILTIN_WITHOUT_DEFAULT_DELEGATES,
                )
                it.allocate_tensors()
                self._backend._interp = it
                self._backend._cached_shape = None
            except Exception:  # keep birdnet's single-thread interpreter if this private detail changes
                pass
        self.sample_rate = AcousticModelV2_4.get_sample_rate()
        self.window_seconds = AcousticModelV2_4.get_segment_size_s()
        self.embedding_dim = AcousticModelV2_4.get_embeddings_dim()

    def _embed_batch(self, windows: np.ndarray) -> np.ndarray:
        return self._backend.encode(windows)[0]

    def _scores_batch(self, windows: np.ndarray) -> np.ndarray:
        logits = self._backend.predict(windows)[0]
        return 1.0 / (1.0 + np.exp(-logits))

    def _both_batch(self, windows: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
        """One invoke, read both the embedding and the logits tensor (BirdNET-Analyzer does the same)."""
        b = self._backend
        try:
            b._set_tensor(windows)
            b._interp.invoke()
            emb = np.array(b._interp.get_tensor(b.encoding_out_idx())[0])
            logits = np.array(b._interp.get_tensor(b.prediction_out_idx())[0])
        except Exception:  # private birdnet details changed: fall back to two invokes
            return self._embed_batch(windows), self._scores_batch(windows)
        return emb, 1.0 / (1.0 + np.exp(-logits))
