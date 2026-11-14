"""Model adapters and the registry used by bench, device and backend."""

from __future__ import annotations

from .base import AudioModel, BaseAudioModel, ModelRegistry, ModelUnavailable


def build_registry(threads: int | None = None, enabled: list[str] | None = None) -> ModelRegistry:
    """All known adapters. Imports are lazy, so a missing package only disables its model."""

    def yamnet(t):
        from .yamnet import YamnetTF
        return YamnetTF(t)

    def yamnet_tflite(t):
        from .yamnet import YamnetTFLite
        return YamnetTFLite(t)

    def birdnet(precision):
        def make(t):
            from .birdnet import BirdNet24
            return BirdNet24(t, precision)
        return make

    def perch(t):
        from .perch import Perch2
        return Perch2(t)

    factories = {
        "yamnet": yamnet,
        "yamnet-tflite": yamnet_tflite,
        "birdnet-2.4": birdnet("fp32"),
        "birdnet-2.4-int8": birdnet("int8"),
        "perch-2.0": perch,
    }
    reg = ModelRegistry(threads=threads)
    for mid, f in factories.items():
        if enabled is None or mid in enabled:
            reg.register(mid, f)
    return reg


__all__ = ["AudioModel", "BaseAudioModel", "ModelRegistry", "ModelUnavailable", "build_registry"]
