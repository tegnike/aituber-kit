# Skill Scripts

This directory contains helper tools for working with this skill.

## search_docs.py

Full-text search across all documentation files.

**Usage:**
```bash
python search_docs.py "<query>" [options]
```

**Options:**
- `--category {api,guides,reference}` - Filter by category
- `--max-results N` - Limit number of results (default: 10)
- `--json` - Output as JSON
- `--skill-dir PATH` - Specify skill directory (default: current)

**Examples:**
```bash
# Basic search
python search_docs.py "subscription"

# Search only API documentation
python search_docs.py --category api "charge"

# Get top 5 results as JSON
python search_docs.py --max-results 5 --json "refund"
```
