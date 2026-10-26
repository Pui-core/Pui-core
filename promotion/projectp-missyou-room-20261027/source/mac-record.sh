#!/bin/bash
# Run only after the owned pilot picture and finalization have been inspected.
set -euo pipefail
capture_root="$HOME/codex-install/projectp118-missyou-room-20261027"
device=$(cat "$capture_root/owned-device.udid")
case "$device" in 90CB6DA4-A633-437D-BF8B-53305ACFCB94|D4763725-D5A1-4799-835D-37D095A47FC2|985801EC-1422-4426-9587-3742EA62E66F|'') exit 2;; esac
test "$(cat "$capture_root/pilot-record.exit")" = 0
test ! -e "$capture_root/normal-taps.mov"
test ! -e "$capture_root/normal-taps.xcresult"
xcrun simctl io "$device" recordVideo --codec=h264 "$capture_root/normal-taps.mov" > "$capture_root/full-record.stdout" 2> "$capture_root/full-record.stderr" &
recorder=$!
printf '%s\n' "$recorder" > "$capture_root/full-recorder.pid"
# Finalize ONLY our own recorder on HUP/TERM/INT/EXIT (e.g. SSH drop), never other recorders.
finalized=0
finalize_recorder() {
  [ "$finalized" = 1 ] && return 0
  finalized=1
  if kill -0 "$recorder" 2>/dev/null; then
    cmd=$(ps -p "$recorder" -o command= 2>/dev/null || true)
    case "$cmd" in
      *recordVideo*"$device"*"$capture_root/normal-taps.mov"*)
        kill -INT "$recorder" 2>/dev/null || true
        for _ in $(seq 1 20); do kill -0 "$recorder" 2>/dev/null || break; sleep 0.5; done
        ;;
      *) : ;;  # PID reused / not our recorder: do not signal
    esac
  fi
}
trap 'finalize_recorder; trap - EXIT; exit 129' HUP
trap 'finalize_recorder; trap - EXIT; exit 130' INT
trap 'finalize_recorder; trap - EXIT; exit 143' TERM
trap 'finalize_recorder' EXIT
ready=0
for i in $(seq 1 40); do
  if grep -q 'Recording started' "$capture_root/full-record.stderr"; then ready=1; break; fi
  kill -0 "$recorder" || break
  sleep 0.5
done
test "$ready" = 1 || { echo 'Recorder did not start'; exit 3; }
date -u '+%Y-%m-%dT%H:%M:%SZ' > "$capture_root/full-started.txt"
set +e
xcodebuild test-without-building -xctestrun "$capture_root/Products/missyou-170-qa_iphonesimulator26.2-x86_64.xctestrun" -destination "platform=iOS Simulator,id=$device" -parallel-testing-enabled NO -collect-test-diagnostics never -resultBundlePath "$capture_root/normal-taps.xcresult" -only-testing:MissYou170UITests/RoomQAUITests/testA_StampOnlyOpenDecorateAndRestart > "$capture_root/normal-taps.log" 2>&1
test_exit=$?
kill -INT "$recorder"
wait "$recorder"
record_exit=$?
set -e
printf '%s\n' "$test_exit" > "$capture_root/test.exit"
printf '%s\n' "$record_exit" > "$capture_root/full-record.exit"
xcrun xcresulttool get test-results summary --path "$capture_root/normal-taps.xcresult" --format json > "$capture_root/test-summary.json"
xcrun xcresulttool export attachments --path "$capture_root/normal-taps.xcresult" --output-path "$capture_root/attachments" > "$capture_root/export-attachments.log" 2>&1
(cd "$capture_root/Products" && shasum -a 256 -c "$capture_root/products-source.sha256") > "$capture_root/products-after-check.log"
shasum -a 256 "$capture_root/normal-taps.mov" > "$capture_root/full.sha256"
date -u '+%Y-%m-%dT%H:%M:%SZ' > "$capture_root/full-finished.txt"
printf 'FULL_FINALIZED test=%s record=%s device=%s\n' "$test_exit" "$record_exit" "$device"
test "$test_exit" = 0
test "$record_exit" = 0
