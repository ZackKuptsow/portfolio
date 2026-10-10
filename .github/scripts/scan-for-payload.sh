#!/usr/bin/env bash
#
# scan-for-payload.sh — stop before an install or a build when the code carries the
# build-config dropper.
#
# Usage: scan-for-payload.sh [commit]         read a commit (default: HEAD)
#        scan-for-payload.sh --working-tree   read the files in the folder, also the ones
#                                             git does not track yet, except ignored ones
#
#   exit 0  CLEAN    nothing matched, and the number of files read is printed
#   exit 1  PAYLOAD  at least one file matched
#   exit 2  UNKNOWN  the scan could not run, or read nothing. Never treat this as clean.
#
# The payload runs when dependencies are installed or the site is built, so this is the
# first thing a CI job or the pre-push hook does. A CI job builds a fresh checkout, so it
# reads the commit. The hook runs its checks on the files in the folder, so it reads those
# too. The scan only reads: nothing from the repository is executed.
set -uo pipefail

# The dropper hides behind 200 or more spaces so that it sits off-screen. That padding was in
# every sample, while its build ID changed on every push, so the structure is what is
# matched. The longest run of spaces in this repository is 75.
readonly OFFSCREEN_PADDING=' {200,}'
# The names the dropper's obfuscator leaves behind, and the address it reported to. Each is
# written as a pattern that its own text does not match, so this file needs no exclusion a
# payload could hide behind.
# shellcheck disable=SC2016  # These are patterns: the dollar sign is literal on purpose.
readonly KNOWN_MARKERS=('_\$jsoToArr' '_\$_def' 'global\.o *=' '23\.27\.20\.187')
readonly SAMPLE_PADDING_WIDTH=250
readonly WORKING_TREE_FLAG='--working-tree'

readonly EXIT_PAYLOAD=1
readonly EXIT_UNKNOWN=2
# `git grep` answers 0 for a match and 1 for none. Anything else is an error.
readonly GREP_MATCHED=0
readonly GREP_NO_MATCH=1

# -a reads every file as text. Without it one NUL byte would let a file pass as binary.
matcher_arguments=(-a -E -e "$OFFSCREEN_PADDING")
for known_marker in "${KNOWN_MARKERS[@]}"; do
  matcher_arguments+=(-e "$known_marker")
done

unknown() {
  printf 'payload scan: UNKNOWN, %s. Treat the code as not scanned.\n' "$1" >&2
  exit "$EXIT_UNKNOWN"
}

# A scanner that cannot match must not report "clean". This stores a padded line as a git
# object that no branch points to, and runs the same matcher over it, the way a commit is
# read. The object is the same on every run, so the repository does not grow.
matcher_catches_a_sample() {
  local sample_blob sample_tree
  sample_blob="$(printf 'module.exports = {}%*s;run()\n' "$SAMPLE_PADDING_WIDTH" '' \
    | git hash-object -w --stdin)" || return 1
  sample_tree="$(printf '100644 blob %s\tsample.txt\n' "$sample_blob" | git mktree)" || return 1
  git grep -q "${matcher_arguments[@]}" "$sample_tree"
}

# Ends the scan: prints the verdict for what the matcher found and exits with it.
report() {  # <status of git grep> <matching files> <number of files read> <what was read>
  local grep_status="$1" matching_files="$2" file_count="$3" scanned="$4"
  if (( grep_status == GREP_MATCHED )); then
    printf 'payload scan: PAYLOAD in %s. Do not install, build or test it.\n' "$scanned" >&2
    printf '%s\n' "$matching_files" | sed 's/^/  /' >&2
    exit "$EXIT_PAYLOAD"
  fi
  (( grep_status == GREP_NO_MATCH )) || unknown "git grep failed with status $grep_status"
  printf 'payload scan: clean, read %s files in %s\n' "$file_count" "$scanned"
  exit 0
}

scan_commit() {  # <commit>
  local commit file_count matching_files
  commit="$(git rev-parse --verify --quiet "$1^{commit}")" \
    || unknown "cannot resolve the commit '$1'"
  file_count="$(git ls-tree -r --name-only "$commit" | wc -l | tr -d ' ')" \
    || unknown "cannot list the files of $commit"
  (( file_count > 0 )) || unknown "the commit $commit holds no files"

  matching_files="$(git grep -l "${matcher_arguments[@]}" "$commit")"
  report $? "$matching_files" "$file_count" "the commit $commit"
}

scan_working_tree() {
  local file_count matching_files
  file_count="$(git ls-files --cached --others --exclude-standard | wc -l | tr -d ' ')" \
    || unknown "cannot list the files in the folder"
  (( file_count > 0 )) || unknown "the folder holds no files"

  matching_files="$(git grep --untracked -l "${matcher_arguments[@]}")"
  report $? "$matching_files" "$file_count" "the working tree"
}

# git reads only the folder it is run from and the ones below it. From the top, it reads
# the whole repository.
repository_root="$(git rev-parse --show-toplevel 2>/dev/null)" || unknown "this is not a git repository"
cd "$repository_root" || unknown "cannot enter $repository_root"

matcher_catches_a_sample || unknown "the matcher did not catch a planted sample"

if [[ "${1:-}" == "$WORKING_TREE_FLAG" ]]; then
  scan_working_tree
else
  scan_commit "${1:-HEAD}"
fi
