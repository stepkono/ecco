"""Hardware outputs and inputs: the light, the trust knob and the buzzer.

* MockHardware      local web page over WebSocket: light circle, knob slider, last decision
* UnoQLedHardware   the UNO Q's RGB LED 1 through Linux sysfs (works without sudo)
* UnoQHardware      stub for the Modulino knob and buzzer through the microcontroller
* CompositeHardware drives several at once (the demo uses LED + web page)
"""

from __future__ import annotations

import json
import logging
import threading
from pathlib import Path
from typing import Protocol

from core.state import State, StateKind

log = logging.getLogger("biospectra.device.hardware")

WEB_DIR = Path(__file__).parent / "web"


class Hardware(Protocol):
    def show_state(self, state: State, info: dict | None = None) -> None: ...
    def read_knob(self) -> float | None: ...  # 0.0 to 1.0, None if there is no knob
    def beep(self, pattern: str) -> None: ...
    def close(self) -> None: ...


class NullHardware:
    def show_state(self, state: State, info: dict | None = None) -> None:
        pass

    def read_knob(self) -> float | None:
        return None

    def beep(self, pattern: str) -> None:
        pass

    def close(self) -> None:
        pass


class UnoQLedHardware(NullHardware):
    """RGB LED 1 next to the QRB label. Off = quiet, green = recognized, amber = needs help."""

    BASE = Path("/sys/class/leds")
    COLORS = {StateKind.QUIET: (0, 0, 0), StateKind.RECOGNIZED: (0, 1, 0), StateKind.NEEDS_HELP: (1, 1, 0)}

    def __init__(self, index: int = 1) -> None:
        self.paths = [self.BASE / f"unoq:user-{c}{index}" / "brightness" for c in ("red", "green", "blue")]
        missing = [str(p) for p in self.paths if not p.exists()]
        if missing:
            raise FileNotFoundError(f"UNO Q LEDs not found: {missing}")
        self._last: tuple[int, int, int] | None = None

    @classmethod
    def available(cls) -> bool:
        return (cls.BASE / "unoq:user-red1" / "brightness").exists()

    def show_state(self, state: State, info: dict | None = None) -> None:
        rgb = self.COLORS[state.kind]
        if rgb == self._last:
            return
        for p, v in zip(self.paths, rgb):
            try:
                p.write_text(str(v))
            except OSError as e:  # needs group gpiod. Keep listening even if the LED fails
                log.warning("LED write failed (%s): %s", p, e)
        self._last = rgb

    def close(self) -> None:
        self.show_state(State(StateKind.QUIET))


class UnoQHardware(NullHardware):
    """Knob and buzzer on the UNO Q (Modulino over Qwiic, driven by the STM32 microcontroller).

    TODO (Phase 6): read the Modulino Knob and drive the Modulino Buzzer through the Arduino
    App Lab Bridge (RPC between the Linux side and the MCU sketch). Check the current App Lab
    docs for the Python Bridge API before implementing. Until then the knob is the web slider.
    """


class MockHardware(NullHardware):
    """Web page with the light and a knob slider. Open http://<host>:<port> in a browser."""

    def __init__(self, host: str = "0.0.0.0", port: int = 8765, knob: float = 0.5) -> None:
        from websockets.datastructures import Headers
        from websockets.http11 import Response
        from websockets.sync.server import serve

        self.knob = knob
        self._clients: set = set()
        self._lock = threading.Lock()
        self._last: dict = {}
        html = (WEB_DIR / "index.html").read_bytes()

        def process_request(connection, request):
            if request.path == "/ws":
                return None  # upgrade to WebSocket
            return Response(200, "OK", Headers([("Content-Type", "text/html; charset=utf-8"),
                                                ("Content-Length", str(len(html)))]), html)

        def handler(ws):
            with self._lock:
                self._clients.add(ws)
                last = dict(self._last)
            try:
                ws.send(json.dumps({**last, "knob": self.knob}))
                for msg in ws:
                    try:
                        data = json.loads(msg)
                        if "knob" in data:
                            self.knob = min(1.0, max(0.0, float(data["knob"])))
                    except (ValueError, TypeError):
                        pass
            finally:
                with self._lock:
                    self._clients.discard(ws)

        self._server = serve(handler, host, port, process_request=process_request)
        self._thread = threading.Thread(target=self._server.serve_forever, daemon=True, name="mock-hw")
        self._thread.start()
        self.port = port
        log.info("mock light page on http://%s:%d", "127.0.0.1" if host == "0.0.0.0" else host, port)

    def show_state(self, state: State, info: dict | None = None) -> None:
        msg = {"state": state.kind.value, "color": state.color, "text": state.describe(), "knob": self.knob,
               **(info or {})}
        with self._lock:
            self._last = msg
            clients = list(self._clients)
        payload = json.dumps(msg)
        for ws in clients:
            try:
                ws.send(payload)
            except Exception:  # client went away
                pass

    def read_knob(self) -> float | None:
        return self.knob

    def close(self) -> None:
        self._server.shutdown()


class CompositeHardware(NullHardware):
    def __init__(self, parts: list) -> None:
        self.parts = parts

    def show_state(self, state: State, info: dict | None = None) -> None:
        for p in self.parts:
            p.show_state(state, info)

    def read_knob(self) -> float | None:
        for p in self.parts:
            v = p.read_knob()
            if v is not None:
                return v
        return None

    def beep(self, pattern: str) -> None:
        for p in self.parts:
            p.beep(pattern)

    def close(self) -> None:
        for p in self.parts:
            p.close()


def build_hardware(spec: str, web_port: int, knob: float) -> CompositeHardware:
    """spec: comma list of mock, led, none, or auto (mock + led when the UNO Q LEDs exist)."""
    names = [s.strip() for s in spec.split(",") if s.strip()]
    if names == ["auto"]:
        names = ["mock"] + (["led"] if UnoQLedHardware.available() else [])
    parts = []
    for n in names:
        if n == "mock":
            parts.append(MockHardware(port=web_port, knob=knob))
        elif n == "led":
            parts.append(UnoQLedHardware())
        elif n == "none":
            continue
        else:
            raise ValueError(f"unknown hardware '{n}' (use mock, led, none or auto)")
    return CompositeHardware(parts)
