#!/usr/bin/env bash
#
# check-live-site.sh — after a deploy, ask the live site whether it serves this build.
#
# Usage: check-live-site.sh <site-url> <export-directory>
#   e.g. check-live-site.sh https://kups.me projects/resume/out
#
# One request for each check. The tests read the CloudFormation template, and only a
# request shows what CloudFront really answers. A failure here means the site is already
# live and wrong. Nothing is rolled back: the run goes red so that someone looks.
set -uo pipefail

readonly EXIT_FAILED=1
readonly EXIT_USAGE=2
readonly MISSING_PAGE_PATH='/live-check-no-such-page'
readonly NOT_FOUND_STATUS=404
readonly OK_STATUS=200
# The household assistant's pages. Its Twilio campaign links these addresses, so one that
# stops answering gets the campaign rejected. Kept in step with `SMS_PAGE_PATHS`.
readonly SMS_PROGRAM_PAGES=(sms.html privacy.html terms.html)
# A path made of anything else would need encoding before it could go in a URL.
readonly URL_SAFE_PATH='^[A-Za-z0-9._/-]+$'
# The retries cover a dropped connection or a 5xx, not a wrong answer.
readonly CURL_OPTIONS=(--silent --show-error --max-time 20 --retry 2)

if (( $# != 2 )); then
  printf 'usage: %s <site-url> <export-directory>\n' "$(basename "$0")" >&2
  exit "$EXIT_USAGE"
fi
readonly SITE_URL="${1%/}"
readonly EXPORT_DIRECTORY="${2%/}"
if [[ ! -f "$EXPORT_DIRECTORY/index.html" ]]; then
  printf 'no index.html in %s: that is not a built site\n' "$EXPORT_DIRECTORY" >&2
  exit "$EXIT_USAGE"
fi

passed_count=0
failed_count=0
record() {  # <status of the check> <what was checked>
  if (( $1 == 0 )); then
    printf 'ok      %s\n' "$2"
    passed_count=$(( passed_count + 1 ))
  else
    printf 'FAILED  %s\n' "$2"
    failed_count=$(( failed_count + 1 ))
  fi
}

# The same content as the file that was built, which also proves the answer is a success.
# The home page and the sitemap differ in every build, so a match means this build is live.
# git does the hashing because it is the one hashing tool on both the runner and a Mac.
serves_the_built_file() {  # <url-path> <file inside the export>
  local served_hash
  served_hash="$(curl "${CURL_OPTIONS[@]}" --fail "$SITE_URL$1" | git hash-object --stdin)" \
    || return 1
  [[ "$served_hash" == "$(git hash-object "$EXPORT_DIRECTORY/$2")" ]]
}

answers_with_status() {  # <url-path> <expected status>
  local status
  status="$(curl "${CURL_OPTIONS[@]}" --output /dev/null --write-out '%{http_code}' "$SITE_URL$1")"
  [[ "$status" == "$2" ]]
}

# The PDF holds an email address and a phone number, so search engines are told to skip it.
is_served_with_noindex() {  # <url-path>
  local response_head
  response_head="$(curl "${CURL_OPTIONS[@]}" --output /dev/null --dump-header - \
    --write-out 'status=%{http_code}\n' "$SITE_URL$1")"
  grep -q "^status=${OK_STATUS}\$" <<<"$response_head" \
    && grep -qi '^x-robots-tag:.*noindex' <<<"$response_head"
}

serves_the_built_file '/' 'index.html'
record $? 'the home page is the one that was built'
serves_the_built_file '/robots.txt' 'robots.txt'
record $? 'robots.txt is the one that was built'
serves_the_built_file '/sitemap.xml' 'sitemap.xml'
record $? 'sitemap.xml is the one that was built'
for program_page in "${SMS_PROGRAM_PAGES[@]}"; do
  serves_the_built_file "/$program_page" "$program_page"
  record $? "/$program_page is the one that was built"
done
answers_with_status "$MISSING_PAGE_PATH" "$NOT_FOUND_STATUS"
record $? "a missing page answers $NOT_FOUND_STATUS"

pdf_count=0
while IFS= read -r pdf_file; do
  pdf_count=$(( pdf_count + 1 ))
  pdf_path="${pdf_file#"$EXPORT_DIRECTORY"}"
  if [[ ! "$pdf_path" =~ $URL_SAFE_PATH ]]; then
    record 1 "$pdf_path has a character this script cannot put in a URL"
    continue
  fi
  is_served_with_noindex "$pdf_path"
  record $? "$pdf_path is served with X-Robots-Tag: noindex"
done < <(find "$EXPORT_DIRECTORY" -type f -name '*.pdf' | sort)
(( pdf_count > 0 )) || record 1 'the build holds at least one PDF to check'

printf '%s of %s live checks passed against %s\n' \
  "$passed_count" "$(( passed_count + failed_count ))" "$SITE_URL"
(( failed_count == 0 )) || exit "$EXIT_FAILED"
