#!/usr/bin/env python3
"""
search_docs.py - Full-text search tool for Claude Code Skills

This script searches through the Markdown documentation files in the data/ directory.
It provides context-aware results, extracting relevant snippets around matched terms.
"""

import os
import sys
import argparse
import re
import json
from pathlib import Path
from typing import List, Dict, Tuple, Optional
from datetime import datetime

# ANSI colors for terminal output
class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'

def extract_frontmatter(content: str) -> Tuple[Dict, str]:
    """
    Parse YAML frontmatter from Markdown content.
    
    Args:
        content: Raw file content
        
    Returns:
        Tuple of (frontmatter_dict, body_content)
    """
    frontmatter = {}
    body = content
    
    # Regex for YAML frontmatter
    match = re.match(r'^---\s*\n(.*?)\n---\s*\n(.*)', content, re.DOTALL)
    
    if match:
        frontmatter_str = match.group(1)
        body = match.group(2)
        
        # Simple YAML parsing (key: value)
        for line in frontmatter_str.split('\n'):
            if ':' in line:
                key, value = line.split(':', 1)
                frontmatter[key.strip()] = value.strip()
                
    return frontmatter, body

def get_context(text: str, query: str, context_lines: int = 2) -> List[str]:
    """
    Find matches and extract surrounding context lines.

    Args:
        text: Body text to search
        query: Search term (can be space-separated for multiple keywords)
        context_lines: Number of lines before/after to include

    Returns:
        List of context snippets
    """
    lines = text.split('\n')
    keywords = query.lower().split()
    contexts = []

    # Find line indices with matches (any keyword)
    match_indices = [i for i, line in enumerate(lines)
                     if any(kw in line.lower() for kw in keywords)]
    
    if not match_indices:
        return []
        
    # Group nearby matches to avoid overlapping contexts
    groups = []
    if match_indices:
        current_group = [match_indices[0]]
        for i in range(1, len(match_indices)):
            # If matches are within 2*context_lines, merge them
            if match_indices[i] - match_indices[i-1] <= (context_lines * 2 + 1):
                current_group.append(match_indices[i])
            else:
                groups.append(current_group)
                current_group = [match_indices[i]]
        groups.append(current_group)
    
    # Extract context for each group
    for group in groups:
        start_idx = max(0, group[0] - context_lines)
        end_idx = min(len(lines), group[-1] + context_lines + 1)
        
        snippet_lines = lines[start_idx:end_idx]
        
        # Highlight matches (simple marking for now)
        # In a real terminal, we could use ANSI codes, but for text output we keep it clean
        # or we could add a marker like '> ' for matched lines
        
        formatted_snippet = []
        for i, line in enumerate(snippet_lines):
            original_idx = start_idx + i
            prefix = "  "
            if any(idx == original_idx for idx in group):
                prefix = "> " # Marker for matched line
            formatted_snippet.append(f"{prefix}{line}")
            
        contexts.append("\n".join(formatted_snippet))
        
    return contexts

def search_docs(skill_dir: Path, query: str, max_results: int = 10) -> List[Dict]:
    """
    Search documentation files.

    Args:
        skill_dir: Root directory of the skill
        query: Search term (space-separated for multiple keywords, OR logic)
        max_results: Maximum number of files to return

    Returns:
        List of result dictionaries
    """
    docs_dir = skill_dir / "docs"
    if not docs_dir.exists():
        print(f"Error: {docs_dir} not found.")
        return []

    keywords = query.lower().split()
    results = []

    # Walk through all markdown files in docs/
    for file_path in docs_dir.glob("**/*.md"):
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()

            frontmatter, body = extract_frontmatter(content)
            body_lower = body.lower()

            # Count matches for each keyword
            matches_count = sum(body_lower.count(kw) for kw in keywords)

            if matches_count > 0:
                contexts = get_context(body, query)

                results.append({
                    "file": str(file_path.relative_to(skill_dir)),
                    "matches": matches_count,
                    "contexts": contexts,
                    "source_url": frontmatter.get("source_url", "Unknown"),
                    "fetched_at": frontmatter.get("fetched_at", "Unknown")
                })
        except Exception as e:
            print(f"Error reading {file_path}: {e}", file=sys.stderr)
                
    # Sort by number of matches (descending)
    results.sort(key=lambda x: x["matches"], reverse=True)
    
    return results[:max_results]

def format_results(results: List[Dict], query: str):
    """Print results in a human-readable format."""
    if not results:
        print(f"No matches found for '{query}'.")
        return

    print(f"\n{Colors.HEADER}Search Results for '{query}'{Colors.ENDC}")
    print(f"Found matches in {len(results)} files.\n")
    
    for i, res in enumerate(results, 1):
        print(f"{Colors.BOLD}{i}. {res['file']}{Colors.ENDC}")
        print(f"   Matches: {res['matches']} | Source: {res['source_url']}")
        print(f"   Fetched: {res['fetched_at']}")
        print(f"{Colors.CYAN}{'-' * 40}{Colors.ENDC}")
        
        for ctx in res['contexts'][:3]: # Show max 3 contexts per file
            print(ctx)
            print("   ...")
        print("\n")

def format_json(results: List[Dict]):
    """Print results as JSON."""
    print(json.dumps(results, indent=2))

def main():
    parser = argparse.ArgumentParser(description="Search Claude Skill documentation.")
    parser.add_argument("query", help="Search query")
    parser.add_argument("--max-results", "-n", type=int, default=10, help="Maximum number of results")
    parser.add_argument("--json", action="store_true", help="Output as JSON")
    # Default: script's parent directory (scripts/../ = skill root)
    default_skill_dir = Path(__file__).resolve().parent.parent
    parser.add_argument("--skill-dir", default=str(default_skill_dir), help="Skill directory (default: auto-detected from script location)")

    args = parser.parse_args()

    skill_path = Path(args.skill_dir).resolve()

    results = search_docs(skill_path, args.query, args.max_results)
    
    if args.json:
        format_json(results)
    else:
        format_results(results, args.query)

if __name__ == "__main__":
    main()
