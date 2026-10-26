#!/bin/bash
set -euo pipefail
capture_root=/Users/pui-mac-core/codex-install/projectp121-truthorlie-20261027
method=${1:?test method required}
attempt=${2:?new capture attempt name required}
case "$method" in test02SetupForFirstRound|test03FirstVote|test03FirstVoteCoder06|test04SecondRound|test05ThirdRound|test06FourthRound|test07TruthOnly|test08History|test10InspectNextRound|test20Round2Vote|test21Round3Vote|test22Round4VoteAndFinal|test30SetupTruthOnlyMatch|test31Truth1Vote|test32Truth2Vote|test33Truth3VoteAndFinal|test40History) ;; *) exit 2;; esac
case "$attempt" in *[!a-zA-Z0-9_-]*|'') exit 2;; esac
device=$(cat "$capture_root/capture/owned-udid.txt")
case "$device" in 6FC6BC4F-4CD9-4946-83F6-944ABAE9D15E) ;; *) exit 2;; esac
out="$capture_root/capture/$attempt"
mkdir -p "$out"
test ! -e "$out/started.lock"
(set -o noclobber; printf '%s\n' "$$" > "$out/started.lock")
cp "$capture_root/capture/harness/CaptureTests/CaptureTests.swift" "$out/driver-source.swift"
cp "$0" "$out/capture-caller.sh"
shasum -a 256 "$out/driver-source.swift" "$out/capture-caller.sh" > "$out/driver-source-sha256.txt"
product="$capture_root/capture/DerivedData/Build/Products/Release-iphonesimulator/TruthOrLie.app/TruthOrLie"
product_hash=$(shasum -a 256 "$product" | cut -d ' ' -f 1)
test "$product_hash" = 51bcf0e740e1253a44edbcc2f038d765cc9d7716804b0ec35e0c34d04b988d70
printf '%s\n' "$product_hash" > "$out/product-binary-sha256.txt"
recorder=
test_pid=
finalize() {
  if test -n "$recorder"; then
    kill -INT "$recorder" 2>/dev/null || true
    set +e
    wait "$recorder"
    printf '%s\n' "$?" > "$out/recorder.exit"
    set -e
    recorder=
  fi
}
interrupted() {
  if test -n "$test_pid"; then kill -TERM "$test_pid" 2>/dev/null || true; fi
  finalize
  printf '%s\n' interrupted > "$out/status.txt"
  exit 143
}
trap finalize EXIT
trap interrupted HUP TERM INT
# Refresh only this capture harness. A still-loaded old Runner may otherwise
# execute an earlier test list/body even after build-for-testing succeeded.
runner_bundle=com.pui-core.projectp121.capturetests.xctrunner
runner_app="$capture_root/capture/DerivedData/Build/Products/Release-iphonesimulator/ProjectP121CaptureTests-Runner.app"
xcrun simctl terminate "$device" "$runner_bundle" > "$out/runner-terminate.log" 2>&1 || true
xcrun simctl install "$device" "$runner_app" > "$out/runner-install.log" 2>&1
installed_runner=$(xcrun simctl get_app_container "$device" "$runner_bundle" app)
runner_relative=PlugIns/ProjectP121CaptureTests.xctest/ProjectP121CaptureTests
built_hash=$(shasum -a 256 "$runner_app/$runner_relative" | cut -d ' ' -f 1)
installed_hash=$(shasum -a 256 "$installed_runner/$runner_relative" | cut -d ' ' -f 1)
test "$built_hash" = "$installed_hash"
printf '%s\n' "$built_hash" > "$out/driver-binary-sha256.txt"
xcrun simctl io "$device" recordVideo --codec=h264 --mask=ignored "$out/normal-ui.mov" > "$out/recorder.log" 2>&1 &
recorder=$!
printf '%s\n' "$recorder" > "$out/recorder.pid"
ready=0
for i in $(seq 1 40); do
  if grep -q 'Recording started' "$out/recorder.log"; then ready=1; break; fi
  kill -0 "$recorder" 2>/dev/null || break
  sleep .25
done
test "$ready" = 1
date -u '+%Y-%m-%dT%H:%M:%SZ' > "$out/started-at.txt"
set +e
xctestrun="$capture_root/capture/DerivedData/Build/Products/ProjectP121Capture_iphonesimulator26.2-x86_64.xctestrun"
test -f "$xctestrun"
shasum -a 256 "$xctestrun" > "$out/xctestrun-sha256.txt"
/usr/bin/nice -n 10 xcrun xcodebuild test-without-building -xctestrun "$xctestrun" -destination "platform=iOS Simulator,id=$device" -resultBundlePath "$out/result.xcresult" -parallel-testing-enabled NO -collect-test-diagnostics never -only-testing:"ProjectP121CaptureTests/ProjectP121CaptureTests/$method" CODE_SIGNING_ALLOWED=NO > "$out/test.log" 2>&1 &
test_pid=$!
printf '%s\n' "$test_pid" > "$out/test.pid"
wait "$test_pid"
test_exit=$?
test_pid=
set -e
printf '%s\n' "$test_exit" > "$out/test.exit"
finalize
xcrun xcresulttool export attachments --path "$out/result.xcresult" --output-path "$out/attachments" > "$out/export.log" 2>&1
xcrun xcresulttool get test-results summary --path "$out/result.xcresult" --compact > "$out/test-summary.json"
date -u '+%Y-%m-%dT%H:%M:%SZ' > "$out/finished-at.txt"
printf 'FINALIZED test=%s record=%s device=%s\n' "$test_exit" "$(cat "$out/recorder.exit")" "$device"
test "$test_exit" = 0
# A zero-test xcodebuild invocation can return 0. It is not capture acceptance.
grep -Eq 'Executed 1 test, with 0 failures' "$out/test.log"
grep -Fq "$method]' passed" "$out/test.log"
test "$(cat "$out/recorder.exit")" = 0
