---
name: openai-voice-agents
description: OPENAI-VOICE-AGENTS documentation assistant
---

# OPENAI-VOICE-AGENTS Skill

This skill provides access to OPENAI-VOICE-AGENTS documentation.

## Documentation

All documentation files are in the `docs/` directory as Markdown files.

## Search Tool

```bash
python scripts/search_docs.py "<query>"
```

Options:

- `--json` - Output as JSON
- `--max-results N` - Limit results (default: 10)

## Usage

1. Search or read files in `docs/` for relevant information
2. Each file has frontmatter with `source_url` and `fetched_at`
3. Always cite the source URL in responses
4. Note the fetch date - documentation may have changed

## Response Format

```
[Answer based on documentation]

**Source:** [source_url]
**Fetched:** [fetched_at]
```
