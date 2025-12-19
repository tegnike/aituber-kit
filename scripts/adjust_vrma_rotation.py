#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import math
import struct
from pathlib import Path
from typing import Iterable, List, Tuple


def load_glb(path: Path) -> Tuple[int, bytes, bytearray]:
    with path.open("rb") as fh:
        header = fh.read(12)
        if len(header) != 12:
            raise ValueError("File too small to be a GLB")
        magic, version, length = struct.unpack("<4sII", header)
        if magic != b"glTF":
            raise ValueError("Not a GLB/VRMA binary (magic mismatch)")

        json_chunk = None
        bin_chunk = None
        json_len = None
        bin_len = None

        cursor = 12
        while cursor < length:
            chunk_header = fh.read(8)
            if len(chunk_header) != 8:
                raise ValueError("Unexpected end of file while reading chunks")
            chunk_len, chunk_type = struct.unpack("<I4s", chunk_header)
            chunk_data = fh.read(chunk_len)
            if len(chunk_data) != chunk_len:
                raise ValueError("Unexpected end of file while reading chunk data")
            cursor += 8 + chunk_len

            if chunk_type == b"JSON":
                json_chunk = chunk_data
                json_len = chunk_len
            elif chunk_type == b"BIN\x00":
                bin_chunk = bytearray(chunk_data)
                bin_len = chunk_len
            else:
                raise ValueError(f"Unsupported chunk type {chunk_type!r}")

        if json_chunk is None or bin_chunk is None:
            raise ValueError("GLB missing JSON or BIN chunk")

        return version, json_chunk, bin_chunk


def write_glb(path: Path, version: int, json_chunk: bytes, bin_chunk: bytearray) -> None:
    total_length = 12 + 8 + len(json_chunk) + 8 + len(bin_chunk)
    with path.open("wb") as fh:
        fh.write(struct.pack("<4sII", b"glTF", version, total_length))
        fh.write(struct.pack("<I4s", len(json_chunk), b"JSON"))
        fh.write(json_chunk)
        fh.write(struct.pack("<I4s", len(bin_chunk), b"BIN\x00"))
        fh.write(bin_chunk)


def find_node_indices(nodes: List[dict], name: str) -> List[int]:
    return [idx for idx, node in enumerate(nodes) if node.get("name") == name]


def quat_mul(q1: Tuple[float, float, float, float], q2: Tuple[float, float, float, float]) -> Tuple[float, float, float, float]:
    x1, y1, z1, w1 = q1
    x2, y2, z2, w2 = q2
    return (
        w1 * x2 + x1 * w2 + y1 * z2 - z1 * y2,
        w1 * y2 - x1 * z2 + y1 * w2 + z1 * x2,
        w1 * z2 + x1 * y2 - y1 * x2 + z1 * w2,
        w1 * w2 - x1 * x2 - y1 * y2 - z1 * z2,
    )


def normalize_quat(q: Tuple[float, float, float, float]) -> Tuple[float, float, float, float]:
    x, y, z, w = q
    length = math.sqrt(x * x + y * y + z * z + w * w)
    if length == 0:
        return (0.0, 0.0, 0.0, 1.0)
    inv = 1.0 / length
    return (x * inv, y * inv, z * inv, w * inv)


def delta_quaternion(angle_degrees: float) -> Tuple[float, float, float, float]:
    radians = math.radians(angle_degrees)
    half = radians * 0.5
    return (0.0, math.sin(half), 0.0, math.cos(half))


def adjust_rotations(
    json_data: dict,
    bin_chunk: bytearray,
    node_indices: Iterable[int],
    angle_degrees: float,
) -> int:
    if angle_degrees == 0.0:
        return 0

    delta = delta_quaternion(angle_degrees)
    modified = 0

    animations = json_data.get("animations", [])
    if not animations:
        return 0

    for animation in animations:
        samplers = animation.get("samplers", [])
        for channel in animation.get("channels", []):
            target = channel.get("target", {})
            if target.get("path") != "rotation":
                continue
            node_index = target.get("node")
            if node_index not in node_indices:
                continue

            sampler_index = channel.get("sampler")
            try:
                sampler = samplers[sampler_index]
            except (TypeError, IndexError):
                raise ValueError(f"Invalid sampler reference {sampler_index}")

            accessor_index = sampler.get("output")
            try:
                accessor = json_data["accessors"][accessor_index]
            except (TypeError, IndexError):
                raise ValueError(f"Invalid accessor reference {accessor_index}")

            if accessor.get("type") != "VEC4" or accessor.get("componentType") != 5126:
                raise ValueError("Rotation accessor must be VEC4 float32")

            buffer_view_index = accessor.get("bufferView")
            try:
                buffer_view = json_data["bufferViews"][buffer_view_index]
            except (TypeError, IndexError):
                raise ValueError(f"Invalid bufferView reference {buffer_view_index}")

            base_offset = buffer_view.get("byteOffset", 0) + accessor.get("byteOffset", 0)
            stride = buffer_view.get("byteStride", 16)
            if stride == 0:
                stride = 16
            count = accessor.get("count", 0)

            for i in range(count):
                offset = base_offset + i * stride
                x, y, z, w = struct.unpack_from("<ffff", bin_chunk, offset)
                new_quat = normalize_quat(quat_mul(delta, (x, y, z, w)))
                struct.pack_into("<ffff", bin_chunk, offset, *new_quat)
                modified += 1

    return modified


def build_arg_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Apply a yaw rotation to a VRMA animation root node.")
    parser.add_argument("input", type=Path, help="Path to the source .vrma (GLB) file")
    parser.add_argument("--angle-deg", type=float, required=True, help="Yaw angle in degrees (positive turns left)")
    parser.add_argument(
        "--node-name",
        default="root",
        help="Node name whose rotation keys should be adjusted (default: root)",
    )
    parser.add_argument(
        "--output",
        type=Path,
        help="Destination path for the adjusted file. Defaults to <input> with _yaw suffix.",
    )
    parser.add_argument(
        "--in-place",
        action="store_true",
        help="Overwrite the input file instead of writing a sibling with a suffix.",
    )
    return parser


def main() -> None:
    parser = build_arg_parser()
    args = parser.parse_args()

    if args.angle_deg == 0:
        parser.error("--angle-deg must be non-zero to perform an adjustment")

    input_path: Path = args.input
    if not input_path.exists():
        parser.error(f"Input file {input_path} does not exist")

    output_path: Path
    if args.in_place:
        if args.output and args.output != input_path:
            parser.error("--in-place cannot be combined with a different --output path")
        output_path = input_path
    elif args.output:
        output_path = args.output
    else:
        output_path = input_path.with_name(f"{input_path.stem}_yaw{int(args.angle_deg)}{input_path.suffix}")

    version, json_chunk, bin_chunk = load_glb(input_path)
    json_data = json.loads(json_chunk.decode("utf-8"))

    node_indices = find_node_indices(json_data.get("nodes", []), args.node_name)
    if not node_indices:
        parser.error(f"Node named '{args.node_name}' not found in file")

    modified = adjust_rotations(json_data, bin_chunk, node_indices, args.angle_deg)
    if modified == 0:
        parser.error("No rotation keyframes were updated; check node name and animation data")

    write_glb(output_path, version, json_chunk, bin_chunk)
    print(f"Updated {modified} quaternion keys -> {output_path}")


if __name__ == "__main__":
    main()
