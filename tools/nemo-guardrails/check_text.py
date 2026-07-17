#!/usr/bin/env python3
"""Check text/files against RepLock NeMo Guardrails (regex always; LLM self-check optional)."""

from __future__ import annotations

import argparse
import asyncio
import os
import sys
from pathlib import Path
from typing import Any, List

from nemoguardrails import RailsConfig
from nemoguardrails.library.regex.actions import detect_regex_pattern

ROOT = Path(__file__).resolve().parent
CONFIG_PATH = ROOT / "config"


def load_text(args: argparse.Namespace) -> str:
    if args.text is not None:
        return args.text
    if args.file is not None:
        return Path(args.file).read_text(encoding="utf-8")
    return sys.stdin.read()


def extract_detections(result: Any) -> List[str]:
    meta = getattr(result, "metadata", None)
    if isinstance(meta, dict):
        detections = meta.get("detections") or []
        if detections:
            return list(detections)
        if meta.get("is_match"):
            return ["<match>"]
    if isinstance(result, dict):
        detections = result.get("detections") or []
        if detections:
            return list(detections)
        if result.get("is_match"):
            return ["<match>"]
    if getattr(result, "is_blocked", False):
        return ["<blocked>"]
    return []


async def run_regex_checks(config: RailsConfig, text: str, source: str) -> List[str]:
    result = await detect_regex_pattern(source=source, text=text, config=config)
    return extract_detections(result)


async def run_llm_self_check(text: str) -> tuple[bool, str]:
    from nemoguardrails import LLMRails

    if not os.getenv("OPENAI_API_KEY"):
        return True, "skipped (set OPENAI_API_KEY to enable LLM self-check)"

    rails = LLMRails(RailsConfig.from_path(str(CONFIG_PATH)))
    response = await rails.generate_async(messages=[{"role": "user", "content": text}])
    content = response.get("content", "") if isinstance(response, dict) else str(response)
    blocked_markers = ("not allowed", "can't respond", "cannot respond", "i can't help")
    blocked = any(marker in content.lower() for marker in blocked_markers)
    return (not blocked), content


async def main_async(args: argparse.Namespace) -> int:
    text = load_text(args).strip()
    if not text:
        print("No text provided.", file=sys.stderr)
        return 2

    config = RailsConfig.from_path(str(CONFIG_PATH))
    source = "input" if args.mode == "input" else "output"
    detections = await run_regex_checks(config, text, source)

    print(f"NeMo Guardrails check ({source})")
    print(f"Chars: {len(text)}")

    if detections:
        print("REGEX: BLOCKED")
        for pattern in detections:
            print(f"  - matched: {pattern}")
        return 1

    print("REGEX: PASS")

    if args.llm:
        ok, detail = await run_llm_self_check(text)
        if ok:
            print(f"LLM SELF-CHECK: PASS ({detail[:120]})")
            return 0
        print(f"LLM SELF-CHECK: BLOCKED\n{detail}")
        return 1

    print("LLM SELF-CHECK: skipped (pass --llm and set OPENAI_API_KEY)")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="Check text with RepLock NeMo Guardrails")
    parser.add_argument("--text", help="Text to check")
    parser.add_argument("--file", help="Path to a text/markdown file to check")
    parser.add_argument(
        "--mode",
        choices=("input", "output"),
        default="output",
        help="Treat text as user input or bot/generated output (default: output)",
    )
    parser.add_argument(
        "--llm",
        action="store_true",
        help="Also run LLM self-check rails (requires OPENAI_API_KEY)",
    )
    args = parser.parse_args()
    return asyncio.run(main_async(args))


if __name__ == "__main__":
    raise SystemExit(main())
