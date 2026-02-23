#!/usr/bin/env python3
"""
VRMA (VRM Animation) ファイルからボーン情報を抽出してJSONに変換するCLIツール

Usage:
    python vrma_to_json.py input.vrma                    # 標準出力にJSON表示
    python vrma_to_json.py input.vrma -o output.json     # ファイルに保存
    python vrma_to_json.py input.vrma --pretty            # 整形表示
"""

import argparse
import json
import struct
import sys
from pathlib import Path


# componentType → (format char, byte size)
COMPONENT_TYPES = {
    5120: ("b", 1),  # BYTE
    5121: ("B", 1),  # UNSIGNED_BYTE
    5122: ("h", 2),  # SHORT
    5123: ("H", 2),  # UNSIGNED_SHORT
    5125: ("I", 4),  # UNSIGNED_INT
    5126: ("f", 4),  # FLOAT
}

# type → 要素数
TYPE_SIZES = {
    "SCALAR": 1,
    "VEC2": 2,
    "VEC3": 3,
    "VEC4": 4,
    "MAT4": 16,
}


def read_glb(path: str) -> tuple[dict, bytes]:
    """GLBファイルからJSONチャンクとBINチャンクを読み出す"""
    with open(path, "rb") as f:
        magic, version, length = struct.unpack("<III", f.read(12))
        if magic != 0x46546C67:  # 'glTF'
            raise ValueError(f"Not a valid GLB file: {path}")

        # JSONチャンク
        chunk_length, chunk_type = struct.unpack("<II", f.read(8))
        if chunk_type != 0x4E4F534A:  # 'JSON'
            raise ValueError("Expected JSON chunk")
        json_data = json.loads(f.read(chunk_length))

        # BINチャンク (optional)
        bin_data = b""
        remaining = length - 12 - 8 - chunk_length
        if remaining > 8:
            chunk_length, chunk_type = struct.unpack("<II", f.read(8))
            if chunk_type == 0x004E4942:  # 'BIN\0'
                bin_data = f.read(chunk_length)

    return json_data, bin_data


def read_accessor(json_data: dict, bin_data: bytes, accessor_index: int) -> list:
    """accessorからデータを読み出してリストで返す"""
    accessor = json_data["accessors"][accessor_index]
    buffer_view = json_data["bufferViews"][accessor["bufferView"]]

    offset = buffer_view.get("byteOffset", 0) + accessor.get("byteOffset", 0)
    count = accessor["count"]

    fmt_char, byte_size = COMPONENT_TYPES[accessor["componentType"]]
    elem_size = TYPE_SIZES[accessor["type"]]

    total = count * elem_size
    data = struct.unpack_from(f"<{total}{fmt_char}", bin_data, offset)

    # SCALAR → フラットリスト、それ以外 → ネストリスト
    if elem_size == 1:
        return list(data)
    else:
        return [list(data[i * elem_size : (i + 1) * elem_size]) for i in range(count)]


def parse_vrma(path: str) -> dict:
    """VRMAファイルを解析してdict構造で返す"""
    json_data, bin_data = read_glb(path)

    ext = json_data.get("extensions", {}).get("VRMC_vrm_animation")
    if ext is None:
        raise ValueError("VRMC_vrm_animation extension not found")

    # ノード番号 → (type, name) のマッピング
    node_map = {}

    human_bones = ext.get("humanoid", {}).get("humanBones", {})
    for bone_name, bone_info in human_bones.items():
        node_map[bone_info["node"]] = ("bone", bone_name)

    for category in ["preset", "custom"]:
        expressions = ext.get("expressions", {}).get(category, {})
        for expr_name, expr_info in expressions.items():
            node_map[expr_info["node"]] = ("expression", expr_name)

    if "lookAt" in ext:
        node_map[ext["lookAt"]["node"]] = ("lookAt", "lookAt")

    # アニメーショントラック解析
    bone_tracks = {}
    expression_tracks = {}
    look_at_track = None

    for animation in json_data.get("animations", []):
        channels = animation["channels"]
        samplers = animation["samplers"]

        for channel in channels:
            target_node = channel["target"]["node"]
            target_path = channel["target"]["path"]
            sampler = samplers[channel["sampler"]]

            times = read_accessor(json_data, bin_data, sampler["input"])
            values = read_accessor(json_data, bin_data, sampler["output"])
            interpolation = sampler.get("interpolation", "LINEAR")

            track_type, track_name = node_map.get(
                target_node, ("unknown", f"node_{target_node}")
            )

            track_data = {
                "times": times,
                "values": values,
                "interpolation": interpolation,
            }

            if track_type == "bone":
                if track_name not in bone_tracks:
                    bone_tracks[track_name] = {}
                bone_tracks[track_name][target_path] = track_data

            elif track_type == "expression":
                # 表情はtranslationのX成分をweightとして抽出
                if target_path == "translation":
                    expression_tracks[track_name] = {
                        "times": times,
                        "values": [v[0] if isinstance(v, list) else v for v in values],
                        "interpolation": interpolation,
                    }

            elif track_type == "lookAt":
                look_at_track = track_data

    # メタ情報
    duration = 0.0
    for tracks in bone_tracks.values():
        for track in tracks.values():
            if track["times"]:
                t = track["times"][-1]
                if t > duration:
                    duration = t

    # hipsの基準位置
    rest_hips_position = None
    hips_bone = human_bones.get("hips")
    if hips_bone is not None:
        hips_node_index = hips_bone["node"]
        nodes = json_data.get("nodes", [])
        if hips_node_index < len(nodes):
            node = nodes[hips_node_index]
            rest_hips_position = node.get("translation")

    result = {
        "specVersion": ext.get("specVersion", "unknown"),
        "duration": duration,
        "restHipsPosition": rest_hips_position,
        "boneNames": sorted(bone_tracks.keys()),
        "bones": bone_tracks,
    }

    if expression_tracks:
        result["expressions"] = expression_tracks

    if look_at_track:
        result["lookAt"] = look_at_track

    return result


def main():
    parser = argparse.ArgumentParser(
        description="VRMAファイルからボーン情報を抽出してJSONに変換する"
    )
    parser.add_argument("input", help="入力VRMAファイルのパス")
    parser.add_argument("-o", "--output", help="出力JSONファイルのパス（省略時は標準出力）")
    parser.add_argument(
        "--pretty", action="store_true", help="JSONを整形して出力する"
    )
    parser.add_argument(
        "--info", action="store_true", help="サマリー情報のみ表示する"
    )

    args = parser.parse_args()

    if not Path(args.input).exists():
        print(f"Error: File not found: {args.input}", file=sys.stderr)
        sys.exit(1)

    result = parse_vrma(args.input)

    if args.info:
        print(f"Spec Version: {result['specVersion']}")
        print(f"Duration: {result['duration']:.3f}s")
        print(f"Rest Hips Position: {result['restHipsPosition']}")
        print(f"Bones ({len(result['boneNames'])}):")
        for name in result["boneNames"]:
            tracks = result["bones"][name]
            paths = list(tracks.keys())
            keyframes = max(len(t["times"]) for t in tracks.values())
            print(f"  {name}: {', '.join(paths)} ({keyframes} keyframes)")
        if "expressions" in result:
            print(f"Expressions ({len(result['expressions'])}):")
            for name in result["expressions"]:
                print(f"  {name}")
        if "lookAt" in result:
            print("LookAt: yes")
        return

    indent = 2 if args.pretty else None
    json_str = json.dumps(result, indent=indent, ensure_ascii=False)

    if args.output:
        Path(args.output).write_text(json_str, encoding="utf-8")
        print(f"Saved to {args.output}", file=sys.stderr)
    else:
        print(json_str)


if __name__ == "__main__":
    main()
