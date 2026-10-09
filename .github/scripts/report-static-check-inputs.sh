#!/usr/bin/env bash
#
# report-static-check-inputs.sh — print how many files each static check reads, and fail
# when one of them reads none.
#
# Usage, from inside a project: report-static-check-inputs.sh <lint|format|typecheck>...
#
# A check that passed and a check that had nothing to read print the same green line. Each
# count comes from the project's own script, run again with a flag that makes the tool list
# its input, so the count follows the script when the script changes.
set -uo pipefail

readonly EXIT_FAILED=1
readonly EXIT_USAGE=2
readonly POSITIVE_INTEGER='^[1-9][0-9]*$'

# ESLint's JSON report holds one entry for each file it read.
count_lint_files() { yarn lint --format json | jq 'length'; }
# Prettier's debug output names each file once, as the file whose config it resolves.
count_format_files() { yarn format --log-level debug 2>&1 | grep -c 'resolve config from'; }
# The compiler lists its own library files too. Those live under node_modules.
count_typecheck_files() { yarn typecheck --listFilesOnly | grep -vc '/node_modules/'; }

if (( $# == 0 )); then
  printf 'usage: %s <lint|format|typecheck>...\n' "$(basename "$0")" >&2
  exit "$EXIT_USAGE"
fi

empty_check_count=0
for check in "$@"; do
  # The exit status is not used: a tool that found problems still lists what it read, and
  # the check's own step is what reports those problems.
  case "$check" in
    lint) file_count="$(count_lint_files)" ;;
    format) file_count="$(count_format_files)" ;;
    typecheck) file_count="$(count_typecheck_files)" ;;
    *)
      printf 'unknown check: %s\n' "$check" >&2
      exit "$EXIT_USAGE"
      ;;
  esac

  if [[ "$file_count" =~ $POSITIVE_INTEGER ]]; then
    printf '%s read %s files\n' "$check" "$file_count"
  else
    printf '%s read no files, or its count could not be read (got "%s")\n' "$check" "$file_count" >&2
    empty_check_count=$(( empty_check_count + 1 ))
  fi
done

(( empty_check_count == 0 )) || exit "$EXIT_FAILED"
