#!/usr/bin/env python3

import csv
import sys
from dataclasses import dataclass
from decimal import Decimal
from pathlib import Path
from typing import Dict, Iterable, List, Tuple


KEY_FIELDS = ("GameID", "GameNumber")
COMPARE_FIELDS = (
    "Opponent",
    "GameDate",
    "Time",
    "PairsSold",
    "SeatsSold",
    "Revenue",
    "PendingPayments",
)


@dataclass(frozen=True)
class Totals:
    pairs_sold: int
    seats_sold: int
    revenue: Decimal
    pending_payments: int


def _i(value: str) -> int:
    try:
        return int(str(value).strip() or "0")
    except Exception:
        return 0


def _d(value: str) -> Decimal:
    try:
        return Decimal(str(value).strip() or "0")
    except Exception:
        return Decimal("0")


def read_csv(path: Path) -> List[Dict[str, str]]:
    with path.open(newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    # Normalize whitespace
    for row in rows:
        for k, v in list(row.items()):
            if isinstance(v, str):
                row[k] = v.strip()
    return rows


def key(row: Dict[str, str]) -> Tuple[str, str]:
    return tuple(row.get(k, "").strip() for k in KEY_FIELDS)  # type: ignore[return-value]


def totals(rows: Iterable[Dict[str, str]]) -> Totals:
    pairs = 0
    seats = 0
    revenue = Decimal("0")
    pending = 0

    for row in rows:
        pairs += _i(row.get("PairsSold", "0"))
        seats += _i(row.get("SeatsSold", "0"))
        revenue += _d(row.get("Revenue", "0"))
        pending += _i(row.get("PendingPayments", "0"))

    return Totals(pairs_sold=pairs, seats_sold=seats, revenue=revenue, pending_payments=pending)


def sort_key(game_key: Tuple[str, str]) -> Tuple[int, str]:
    gid, game_number = game_key
    # Put preseason (PS n) first, then numeric games.
    g = game_number.replace("PS ", "0")
    try:
        return (int(g), gid)
    except Exception:
        return (10**9, gid)


def main(argv: List[str]) -> int:
    if len(argv) != 3:
        print(
            "Usage: diff_backups.py <csv1> <csv2>\n"
            "Compares rows keyed by (GameID, GameNumber) and prints field diffs + totals.",
            file=sys.stderr,
        )
        return 2

    p1 = Path(argv[1]).expanduser()
    p2 = Path(argv[2]).expanduser()

    rows1 = read_csv(p1)
    rows2 = read_csv(p2)

    map1 = {key(r): r for r in rows1}
    map2 = {key(r): r for r in rows2}

    keys1 = set(map1)
    keys2 = set(map2)

    only1 = sorted(keys1 - keys2, key=sort_key)
    only2 = sorted(keys2 - keys1, key=sort_key)
    both = sorted(keys1 & keys2, key=sort_key)

    print(f"Rows: file1={len(rows1)} file2={len(rows2)}")
    print(f"Missing keys: only-in-file1={len(only1)} only-in-file2={len(only2)}")

    if only1:
        print("\nOnly in file1:")
        for k in only1[:20]:
            print(f"  {k}")
        if len(only1) > 20:
            print(f"  ... ({len(only1) - 20} more)")

    if only2:
        print("\nOnly in file2:")
        for k in only2[:20]:
            print(f"  {k}")
        if len(only2) > 20:
            print(f"  ... ({len(only2) - 20} more)")

    diffs = []
    for k in both:
        a = map1[k]
        b = map2[k]
        changes = []
        for field in COMPARE_FIELDS:
            av = (a.get(field) or "").strip()
            bv = (b.get(field) or "").strip()
            if av != bv:
                changes.append((field, av, bv))
        if changes:
            diffs.append((k, a.get("Opponent", "").strip(), a.get("GameDate", "").strip(), changes))

    print(f"\nRows with differences: {len(diffs)}")
    for (gid, game_number), opponent, game_date, changes in diffs:
        label = f"{game_number} (GameID {gid})"
        meta = " ".join(x for x in [opponent, game_date] if x)
        print(f"\n{label}{(' ' + meta) if meta else ''}")
        for field, av, bv in changes:
            print(f"  {field}: {av} -> {bv}")

    t1 = totals(rows1)
    t2 = totals(rows2)
    print("\nTotals (PairsSold, SeatsSold, Revenue, PendingPayments)")
    print(f"file1: ({t1.pairs_sold}, {t1.seats_sold}, {t1.revenue}, {t1.pending_payments})")
    print(f"file2: ({t2.pairs_sold}, {t2.seats_sold}, {t2.revenue}, {t2.pending_payments})")

    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
