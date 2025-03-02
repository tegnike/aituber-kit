#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import json
import git
import sys
import time
from pathlib import Path
from openai import OpenAI

# 環境変数から情報を取得
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
PR_BASE_REF = os.getenv("PR_BASE_REF", "develop")  # デフォルトはdevelop
PR_HEAD_REF = os.getenv("PR_HEAD_REF")

if not OPENAI_API_KEY:
    print("Error: OPENAI_API_KEY environment variable is not set.")
    sys.exit(1)

# OpenAI APIの初期化
client = OpenAI(api_key=OPENAI_API_KEY)

# リポジトリのルートディレクトリを取得
repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
locales_dir = os.path.join(repo_root, "locales")
ja_translation_path = os.path.join(locales_dir, "ja", "translation.json")

# サポートしているロケール
SUPPORTED_LOCALES = [
    "ar",
    "de",
    "en",
    "es",
    "fr",
    "hi",
    "it",
    "ko",
    "pl",
    "pt",
    "ru",
    "th",
    "vi",
    "zh",
]

# Gitリポジトリの初期化
repo = git.Repo(repo_root)


def get_changed_keys():
    """
    日本語のtranslation.jsonファイルの変更を検出し、変更されたキーを返す
    PRの基準ブランチ（通常はdevelop）と現在の状態を比較
    """
    added_modified_keys = {}
    deleted_keys = []

    try:
        # PRの基準ブランチの内容を取得
        try:
            base_content = repo.git.show(
                f"origin/{PR_BASE_REF}:{ja_translation_path.replace(repo_root + '/', '')}"
            )
        except git.exc.GitCommandError:
            print(f"Warning: Could not find file in base branch, assuming new file")
            base_content = "{}"
        base_json = json.loads(base_content)

        # 現在のファイル内容を取得
        with open(ja_translation_path, "r", encoding="utf-8") as f:
            current_json = json.load(f)

        # 階層的に変更を抽出する関数
        def extract_changes(old_dict, new_dict, path=""):
            # 新規追加または変更されたキー
            for key in new_dict:
                current_path = f"{path}.{key}" if path else key

                # キーが存在しない場合は追加
                if key not in old_dict:
                    added_modified_keys[current_path] = new_dict[key]
                # 両方が辞書の場合は再帰的に処理
                elif isinstance(old_dict[key], dict) and isinstance(
                    new_dict[key], dict
                ):
                    extract_changes(old_dict[key], new_dict[key], current_path)
                # 値が変更された場合
                elif old_dict[key] != new_dict[key]:
                    added_modified_keys[current_path] = new_dict[key]

            # 削除されたキー
            for key in old_dict:
                current_path = f"{path}.{key}" if path else key

                if key not in new_dict:
                    deleted_keys.append(current_path)
                elif isinstance(old_dict[key], dict) and isinstance(
                    new_dict[key], dict
                ):
                    extract_changes(old_dict[key], new_dict[key], current_path)

        # 変更を抽出
        extract_changes(base_json, current_json)

        return added_modified_keys, deleted_keys

    except Exception as e:
        print(f"Error detecting changes: {e}")
        return {}, []


def create_json_from_keys(keys_dict):
    """
    キーのパスと値の辞書からネストされたJSONオブジェクトを作成
    """
    result = {}

    for key_path, value in keys_dict.items():
        keys = key_path.split(".")
        current = result

        # 最後のキー以外をたどってネストされた辞書を作成
        for i, k in enumerate(keys[:-1]):
            if k not in current:
                current[k] = {}
            current = current[k]

        # 最後のキーに値を設定
        current[keys[-1]] = value

    return result


def translate_json(json_obj, target_lang, max_retries=3):
    """
    JSON構造を保持したまま翻訳する
    最大3回まで再試行する
    """
    # JSON文字列に変換
    json_str = json.dumps(json_obj, ensure_ascii=False, indent=2)

    retry_count = 0
    while retry_count < max_retries:
        try:
            # OpenAI APIを使用して翻訳
            response = client.chat.completions.create(
                model="gpt-4o-mini",  # 指定されたモデル
                messages=[
                    {
                        "role": "system",
                        "content": f"You are a professional translator. Translate the following JSON content from Japanese to {target_lang}. Keep all keys the same, only translate the values. Maintain the exact same JSON structure.",
                    },
                    {
                        "role": "user",
                        "content": f"Translate this JSON content to {target_lang}. Keep all keys the same, only translate string values:\n\n```json\n{json_str}\n```",
                    },
                ],
                temperature=0.1,  # 低い温度で一貫性のある翻訳を生成
            )

            translation_text = response.choices[0].message.content

            # JSON文字列から辞書に変換
            # translation_textからJSONオブジェクトを抽出する正規表現を使用
            import re

            json_match = re.search(r"```json\s*([\s\S]*?)\s*```", translation_text)
            if json_match:
                translation_text = json_match.group(1)

            try:
                translated_json = json.loads(translation_text)
                return translated_json
            except json.JSONDecodeError:
                print(
                    f"Error: Failed to parse translated JSON for {target_lang}. Retry {retry_count + 1}/{max_retries}"
                )
                print(f"Translated content: {translation_text}")
                retry_count += 1
                time.sleep(1)  # 1秒待機してから再試行

        except Exception as e:
            print(
                f"Error translating to {target_lang}: {e}. Retry {retry_count + 1}/{max_retries}"
            )
            retry_count += 1
            time.sleep(1)  # 1秒待機してから再試行

    print(f"Failed to translate to {target_lang} after {max_retries} attempts.")
    return None


def update_locale_file(locale_path, added_modified_json, deleted_keys):
    """
    ローカルファイルを更新: 追加・変更されたキーを適用し、削除されたキーを削除
    """
    try:
        # ローカルファイルを読み込み（存在しない場合は空の辞書）
        locale_json = {}
        if os.path.exists(locale_path):
            with open(locale_path, "r", encoding="utf-8") as f:
                locale_json = json.load(f)

        # 階層的にキーを追加・更新する関数
        def update_nested_dict(target, source):
            for k, v in source.items():
                if isinstance(v, dict):
                    # キーが存在しない場合は作成
                    if k not in target:
                        target[k] = {}
                    # 再帰的に処理
                    update_nested_dict(target[k], v)
                else:
                    # 値を更新
                    target[k] = v

        # 追加・変更されたキーを適用
        update_nested_dict(locale_json, added_modified_json)

        # 削除されたキーを処理
        for key_path in deleted_keys:
            keys = key_path.split(".")
            current = locale_json
            parent_chain = []

            # 最後のキー以外をたどる
            for i, k in enumerate(keys[:-1]):
                if k not in current:
                    # パスが存在しない場合はスキップ
                    break
                parent_chain.append((current, k))
                current = current[k]

            # 最後のキーを削除
            if keys[-1] in current:
                del current[keys[-1]]

                # 空の親オブジェクトを削除
                for parent, key in reversed(parent_chain):
                    if parent[key] == {}:
                        del parent[key]

        # 更新されたJSONをファイルに書き込み
        os.makedirs(os.path.dirname(locale_path), exist_ok=True)
        with open(locale_path, "w", encoding="utf-8") as f:
            json.dump(locale_json, f, ensure_ascii=False, indent=2)

        return True

    except Exception as e:
        print(f"Error updating locale file {locale_path}: {e}")
        return False


def get_language_name(locale_code):
    """
    ロケールコードから言語名を取得
    """
    language_map = {
        "ar": "Arabic",
        "de": "German",
        "en": "English",
        "es": "Spanish",
        "fr": "French",
        "hi": "Hindi",
        "it": "Italian",
        "ko": "Korean",
        "pl": "Polish",
        "pt": "Portuguese",
        "ru": "Russian",
        "th": "Thai",
        "vi": "Vietnamese",
        "zh": "Chinese",
    }
    return language_map.get(locale_code, f"Language code {locale_code}")


def main():
    print("Starting locale files update process...")

    # 変更されたキーを取得
    added_modified_keys, deleted_keys = get_changed_keys()

    if not added_modified_keys and not deleted_keys:
        print("No changes to process. Exiting.")
        return

    print(
        f"Found {len(added_modified_keys)} added/modified keys and {len(deleted_keys)} deleted keys."
    )

    # 変更されたキーからJSONオブジェクトを作成
    added_modified_json = create_json_from_keys(added_modified_keys)

    # 各ロケールを処理
    for locale in SUPPORTED_LOCALES:
        if locale == "ja":  # 日本語は処理しない
            continue

        locale_path = os.path.join(locales_dir, locale, "translation.json")
        print(f"Processing locale: {locale}")

        # 追加・変更されたキーがある場合のみ翻訳処理
        if added_modified_keys:
            # 言語名を取得
            language_name = get_language_name(locale)

            # 翻訳を実行
            translated_json = translate_json(added_modified_json, language_name)

            if translated_json:
                # ローカルファイルを更新
                success = update_locale_file(locale_path, translated_json, deleted_keys)
                if success:
                    print(f"Successfully updated locale file for {locale}.")
                else:
                    print(f"Failed to update locale file for {locale}.")
            else:
                print(f"Failed to translate content for {locale}. Skipping update.")
        elif deleted_keys:  # 削除されたキーのみの処理
            # 削除されたキーのみ適用
            success = update_locale_file(locale_path, {}, deleted_keys)
            if success:
                print(f"Successfully deleted keys from locale file for {locale}.")
            else:
                print(f"Failed to delete keys from locale file for {locale}.")


if __name__ == "__main__":
    main()
