#!/bin/bash
# ========================================
#  C Examples Build Script - Unix
#  Compiles all .c files in subdirectories
# ========================================

set -e

BASE_DIR="$(cd "$(dirname "$0")" && pwd)"
SUCCESS_COUNT=0
FAIL_COUNT=0

echo "========================================"
echo " C Examples Build Script - Unix"
echo "========================================"
echo ""

# ========================================
#  Step 1: Multi-file project (17_multifile)
#  Compile main.c + helper.c together
# ========================================
echo "[PROJECT] 17_multifile -- main.c + helper.c"
cd "$BASE_DIR/17_multifile"
if gcc main.c helper.c -o multifile_demo -std=c11 -Wall; then
    echo "  [OK] multifile_demo"
    ((SUCCESS_COUNT++))
else
    echo "  [FAIL] multifile_demo"
    ((FAIL_COUNT++))
fi
cd "$BASE_DIR"
echo ""

# ========================================
#  Step 2: Compile all individual .c files
# ========================================
while IFS= read -r -d '' file; do
    # Skip files in the multi-file project folder
    case "$file" in
        */17_multifile/*) continue ;;
    esac

    filename=$(basename "$file")
    dir=$(dirname "$file")
    basename_noext="${filename%.c}"

    FLAGS=""

    # --- Threading files: link with pthread library ---
    case "$file" in
        */18_threading/*) FLAGS="$FLAGS -lpthread" ;;
    esac

    # --- Math file: link with math library ---
    case "$file" in
        */15_standard_library/02_math_functions*) FLAGS="$FLAGS -lm" ;;
    esac

    # --- Networking files: on Unix, sockets are in libc, no extra flags needed ---
    # The Windows-specific Winsock examples may not compile on Unix.

    echo "[COMPILE] $filename"
    if gcc "$file" -o "$dir/$basename_noext" -std=c11 -Wall $FLAGS; then
        echo "  [OK] $filename"
        ((SUCCESS_COUNT++))
    else
        echo "  [FAIL] $filename"
        ((FAIL_COUNT++))
    fi
    echo ""
done < <(find "$BASE_DIR" -name '*.c' -type f -print0)

# ========================================
#  Summary
# ========================================
echo "========================================"
echo " Build Summary"
echo "========================================"
echo " Compiled: $SUCCESS_COUNT"
echo " Failed:   $FAIL_COUNT"
echo "========================================"

if [ "$FAIL_COUNT" -gt 0 ]; then
    exit 1
fi
exit 0
