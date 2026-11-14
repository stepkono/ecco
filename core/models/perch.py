"""Perch 2.0 adapter (multi-taxa: birds, amphibians, insects, mammals).

Source:  Google DeepMind Perch v2, https://www.kaggle.com/models/google/bird-vocalization-classifier
         loaded through the `birdnet` package (`load_perch_v2`), which mirrors the
         CPU SavedModel (~380 MB download on first use).
License: code Apache 2.0 (google-research/perch). Weights: verify on the Kaggle model page (see LICENSES.md).
Input:   32 kHz mono float32, 5 s windows (read from the package at load time).
Output:  14,795 classes (iNaturalist 2024 species + FSD50K sound events) and a
         1536-d embedding. FP32 only, needs TensorFlow >= 2.20.
"""

from __future__ import annotations

import numpy as np

from .base import BaseAudioModel, ModelUnavailable


class Perch2(BaseAudioModel):
    model_id = "perch-2.0"
    model_version = "2.0 (SavedModel, fp32, CPU)"
    source = "https://www.kaggle.com/models/google/bird-vocalization-classifier (via birdnet.load_perch_v2)"
    license = "code Apache 2.0, weights: verify on Kaggle"
    input_format = "32 kHz mono float32, 5 s windows"

    def _load(self) -> None:
        try:
            from birdnet.acoustic.models.perch_v2.model import AcousticModelPerchV2
            from birdnet.acoustic.models.perch_v2.pb import (
                AcousticPBBackendFP32PerchV2,
                AcousticPBDownloaderPerchV2,
                check_tf_version_for_perch_v2,
            )
        except ImportError as e:
            raise ModelUnavailable("the `birdnet` package is not installed (pip install 'birdnet[tf]')") from e
        try:
            check_tf_version_for_perch_v2()
        except RuntimeError as e:
            raise ModelUnavailable(str(e)) from e
        path, labels = AcousticPBDownloaderPerchV2.get_model_path_and_labels("CPU")
        self.labels = [str(x) for x in labels]
        self._backend = AcousticPBBackendFP32PerchV2(path, "CPU", False, cpu_threads=self.threads)
        self._backend.load()
        self.sample_rate = AcousticModelPerchV2.get_sample_rate()
        self.window_seconds = AcousticModelPerchV2.get_segment_size_s()
        self.embedding_dim = AcousticModelPerchV2.get_embeddings_dim()

    def _run(self, fn, windows: np.ndarray) -> np.ndarray:
        b = self._backend
        return np.asarray(b.copy_from_device(fn(b.copy_to_device(windows))))[0]

    def _embed_batch(self, windows: np.ndarray) -> np.ndarray:
        return self._run(self._backend.encode, windows)

    def _scores_batch(self, windows: np.ndarray) -> np.ndarray:
        logits = self._run(self._backend.predict, windows)
        return 1.0 / (1.0 + np.exp(-logits))

    def _both_batch(self, windows: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
        """The serving signature returns embedding and logits together: call it once."""
        b = self._backend
        try:
            from tensorflow import device

            with device(b._logical_device_name):
                out = b._predict_fn(**{b.input_key(): b.copy_to_device(windows)})
            emb = np.asarray(out[b.encoding_key()])[0]
            logits = np.asarray(out[b.prediction_key()])[0]
        except Exception:  # private birdnet details changed: fall back to two calls
            return self._embed_batch(windows), self._scores_batch(windows)
        return emb, 1.0 / (1.0 + np.exp(-logits))
