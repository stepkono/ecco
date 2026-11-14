"""Download a small, useful subset of real soundscape recordings (continuous field audio).

    python -m tools.fetch_soundscapes                      # default subset, about 1 GB
    python -m tools.fetch_soundscapes --amazon 6 --northeast 6 --anura 40

Instead of the full archives (49 GB in total), single recordings are pulled out of
the remote zip files with HTTP range requests. The busiest recordings are chosen
from each dataset's own annotations, plus a few frog-free AnuraSet minutes for
false-alarm tests. Files land in data/soundscapes/<dataset>/ (git-ignored).

Sources (cite them when you use the audio):
* Southwestern Amazon soundscapes, Hopping, Kahl, Klinck 2022. Zenodo 7079124. CC BY 4.0.
  21 one-hour recordings, Inkaterra Reserva Amazonica, Peru. Bird annotations.
* Northeastern US soundscapes, Kahl et al. 2022. Zenodo 7018484. CC BY 4.0.
  285 one-hour recordings, Sapsucker Woods, Ithaca NY. Bird annotations.
* AnuraSet, Cañas et al. 2023. Zenodo 8342596. CC BY.
  1-minute recordings from Brazilian wetlands, frog calling activity per species (0 to 3).
"""

from __future__ import annotations

import argparse
import csv
import shutil
from collections import Counter, defaultdict
from pathlib import Path

from core.config import ROOT

ZEN = "https://zenodo.org/records/{rec}/files/{name}?download=1"
SETS = {
    "amazon": {"rec": 7079124, "zip": "soundscape_data.zip", "meta": ["annotations.csv", "species.csv", "description.pdf"]},
    "northeast": {"rec": 7018484, "zip": "soundscape_data.zip", "meta": ["annotations.csv", "species.csv", "description.pdf"]},
    "anuraset": {"rec": 8342596, "zip": "raw_data.zip", "meta": ["weak_labels.csv", "species.csv"]},
}


def fetch(url: str, dst: Path) -> None:
    import urllib.request

    if dst.exists() and dst.stat().st_size > 0:
        return
    dst.parent.mkdir(parents=True, exist_ok=True)
    with urllib.request.urlopen(url, timeout=120) as r, open(dst, "wb") as f:
        shutil.copyfileobj(r, f)


def busiest_hours(annotations: Path, n: int, key=lambda name: name) -> list[str]:
    """Recordings with the most annotated calls, at most one per `key` group (site or date)."""
    counts = Counter(row["Filename"] for row in csv.DictReader(open(annotations, encoding="utf-8")))
    picked, groups = [], set()
    for name, _ in counts.most_common():
        if key(name) in groups:
            continue
        picked.append(name)
        groups.add(key(name))
        if len(picked) == n:
            break
    return picked


def frog_minutes(weak: Path, n_busy: int, n_quiet: int, per_site: int = 5) -> tuple[list[str], list[str]]:
    rows = list(csv.DictReader(open(weak, encoding="utf-8")))
    score = {r["AUDIO_FILE_ID"]: sum(int(v) for k, v in r.items() if k.startswith("SPECIES_")) for r in rows}
    site = {r["AUDIO_FILE_ID"]: r["MONITORING_SITE"] for r in rows}
    busy, per = [], defaultdict(int)
    for fid in sorted(score, key=lambda f: -score[f]):
        if per[site[fid]] < per_site:
            busy.append(fid)
            per[site[fid]] += 1
        if len(busy) == n_busy:
            break
    quiet, seen = [], set()
    for fid in sorted(score):
        if score[fid] == 0 and site[fid] not in seen:
            quiet.append(fid)
            seen.add(site[fid])
        if len(quiet) == n_quiet:
            break
    return busy, quiet


def extract(rec: int, zip_name: str, wanted: dict[str, Path]) -> None:
    """Pull single members out of a remote zip. `wanted` maps file stem -> destination."""
    from remotezip import RemoteZip

    with RemoteZip(ZEN.format(rec=rec, name=zip_name)) as z:
        members = {Path(i.filename).stem: i for i in z.infolist() if not i.is_dir()}
        for stem, dst in wanted.items():
            info = members.get(stem)
            if info is None:
                print(f"   not in archive: {stem}")
                continue
            if dst.exists() and dst.stat().st_size == info.file_size:
                print(f"   have {dst.name}")
                continue
            dst.parent.mkdir(parents=True, exist_ok=True)
            with z.open(info) as src, open(dst, "wb") as out:
                shutil.copyfileobj(src, out, 1 << 20)
            print(f"   got  {dst.name}  {info.file_size / 1e6:.0f} MB")


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--out", default=str(ROOT / "data" / "soundscapes"))
    ap.add_argument("--amazon", type=int, default=4, help="one-hour Amazon recordings (about 110 MB each)")
    ap.add_argument("--northeast", type=int, default=4, help="one-hour Sapsucker Woods recordings (about 90 MB each)")
    ap.add_argument("--anura", type=int, default=30, help="busy one-minute frog recordings (about 5 MB each)")
    ap.add_argument("--anura-quiet", type=int, default=5, help="frog-free one-minute recordings (false-alarm tests)")
    a = ap.parse_args()
    out = Path(a.out)
    for name, s in SETS.items():
        for m in s["meta"]:
            fetch(ZEN.format(rec=s["rec"], name=m), out / name / m)

    print(f"== Amazon: {a.amazon} busiest hours (one per site)")
    names = busiest_hours(out / "amazon" / "annotations.csv", a.amazon, key=lambda f: f.split("_")[2])
    extract(SETS["amazon"]["rec"], SETS["amazon"]["zip"], {Path(f).stem: out / "amazon" / f for f in names})

    print(f"== Northeastern US: {a.northeast} busiest hours (one per day)")
    names = busiest_hours(out / "northeast" / "annotations.csv", a.northeast, key=lambda f: f.split("_")[2])
    extract(SETS["northeast"]["rec"], SETS["northeast"]["zip"], {Path(f).stem: out / "northeast" / f for f in names})

    print(f"== AnuraSet: {a.anura} busiest frog minutes + {a.anura_quiet} frog-free minutes")
    busy, quiet = frog_minutes(out / "anuraset" / "weak_labels.csv", a.anura, a.anura_quiet)
    wanted = {f: out / "anuraset" / "frogs" / f"{f}.wav" for f in busy}
    wanted.update({f: out / "anuraset" / "no_frogs" / f"{f}.wav" for f in quiet})
    extract(SETS["anuraset"]["rec"], SETS["anuraset"]["zip"], wanted)
    print("done:", out)


if __name__ == "__main__":
    main()
