#!/bin/bash
for file in $(ls docs/history/[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9].md 2>/dev/null | sort -r | head -n 2); do
    echo "===== $(basename "$file") ====="
    cat "$file"
    echo ""
done
