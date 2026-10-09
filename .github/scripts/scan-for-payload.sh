#!/usr/bin/env bash
#
# scan-for-payload.sh — stop before an install or a build when a commit carries the
# build-config dropper.
#
# Usage: scan-for-payload.sh [commit]      (default: HEAD)
#
#   exit 0  CLEAN    nothing matched, and the number of files read is printed
#   exit 1  PAYLOAD  at least one file matched
#   exit 2  UNKNOWN  the scan could not run, or read nothing. Never treat this as clean.
#
# The payload runs when dependencies are installed or the site is built, so this is the
# first thing a CI job or the pre-push hook does. It reads the commit and not the working
# tree, so it checks exactly what is about to be built or pushed. It only reads: nothing
# from the repository is executed.
set -uo pipefail

# The dropper hides behind 200 or more spaces so that it sits off-screen. That padding was in
# every sample, while its build ID changed on every push, so the structure is what is
# matched. The longest run of spaces in this repository is 75.
readonly OFFSCREEN_PADDING=' {200,}'
# Names the dropper's obfuscator leaves behind. Each is written as a pattern that its own
# text does not match, so this file needs no exclusion a payload could hide behind.
# shellcheck disable=SC2016  # These are patterns: the dollar sign is literal on purpose.
readonly OBFUSCATOR_NAMES=('_\$jsoToArr' '_\$_def' 'global\.o *=')
readonly SAMPLE_PADDING_WIDTH=250

readonly EXIT_PAYLOAD=1
readonly EXIT_UNKNOWN=2
# `git grep` answers 0 for a match and 1 for none. Anything else is an error.
readonly GREP_MATCHED=0
readonly GREP_NO_MATCH=1

pattern_arguments=(-e "$OFFSCREEN_PADDING")
for obfuscator_name in "${OBFUSCATOR_NAMES[@]}"; do
  pattern_arguments+=(-e "$obfuscator_name")
done

unknown() {
  printf 'payload scan: UNKNOWN, %s. Treat the commit as not scanned.\n' "$1" >&2
  exit "$EXIT_UNKNOWN"
}

# A scanner that cannot match must not report "clean". This stores a padded line as a git
# object that no branch points to, and runs the same matcher over it, the way the commit is
# read. The object is the same on every run, so the repository does not grow.
matcher_catches_a_sample() {
  local sample_blob sample_tree
  sample_blob="$(printf 'module.exports = {}%*s;run()\n' "$SAMPLE_PADDING_WIDTH" '' \
    | git hash-object -w --stdin)" || return 1
  sample_tree="$(printf '100644 blob %s\tsample.txt\n' "$sample_blob" | git mktree)" || return 1
  git grep -a -q -E "${pattern_arguments[@]}" "$sample_tree"
}

requested_commit="${1:-HEAD}"
commit="$(git rev-parse --verify --quiet "${requested_commit}^{commit}")" \
  || unknown "cannot resolve the commit '$requested_commit'"

file_count="$(git ls-tree -r --name-only "$commit" | wc -l | tr -d ' ')" \
  || unknown "cannot list the files of $commit"
(( file_count > 0 )) || unknown "the commit $commit holds no files"

matcher_catches_a_sample || unknown "the matcher did not catch a planted sample"

# -a reads every file as text. Without it one NUL byte would let a file pass as binary.
matching_files="$(git grep -a -l -E "${pattern_arguments[@]}" "$commit")"
grep_status=$?

if (( grep_status == GREP_MATCHED )); then
  printf 'payload scan: PAYLOAD in %s. Do not install, build or test this commit.\n' "$commit" >&2
  printf '%s\n' "$matching_files" | sed 's/^/  /' >&2
  exit "$EXIT_PAYLOAD"
fi
(( grep_status == GREP_NO_MATCH )) || unknown "git grep failed with status $grep_status"

printf 'payload scan: clean, read %s files at %s\n' "$file_count" "$commit"
