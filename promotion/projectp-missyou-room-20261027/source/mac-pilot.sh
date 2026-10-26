#!/bin/bash
# Issue118 only. Private Products and a new UDID; never the product/CI devices.
set -euo pipefail
capture_root="$HOME/codex-install/projectp118-missyou-room-20261027"
original_products="$HOME/codex-install/missyou-170-dd/Build/Products"
test_name="missyou-170-qa_iphonesimulator26.2-x86_64.xctestrun"
bundle="com.pui-core.missyou.qa170.offline"
test ! -e "$capture_root" || { echo 'Owned capture prefix already exists; preserve, do not restart'; exit 2; }
test -f "$original_products/$test_name"
mkdir -m 700 "$capture_root"
date -u '+%Y-%m-%dT%H:%M:%SZ' > "$capture_root/started.txt"
sysctl -n hw.memsize > "$capture_root/host-memory-bytes.txt"
vm_stat > "$capture_root/host-vm-before.txt"
df -h "$HOME/codex-install" > "$capture_root/host-disk-before.txt"
(cd "$original_products" && find . -type f -exec shasum -a 256 {} + | LC_ALL=C sort) > "$capture_root/products-source.sha256"
ditto "$original_products" "$capture_root/Products"
(cd "$capture_root/Products" && shasum -a 256 -c "$capture_root/products-source.sha256") > "$capture_root/products-copy-check.log"
device=$(xcrun simctl create ProjectP118-Missyou-Room com.apple.CoreSimulator.SimDeviceType.iPhone-SE-3rd-generation com.apple.CoreSimulator.SimRuntime.iOS-17-2)
case "$device" in 90CB6DA4-A633-437D-BF8B-53305ACFCB94|D4763725-D5A1-4799-835D-37D095A47FC2|985801EC-1422-4426-9587-3742EA62E66F|'') echo 'Invalid or protected UDID'; exit 2;; esac
printf '%s\n' "$device" > "$capture_root/owned-device.udid"
xcrun simctl boot "$device"
xcrun simctl bootstatus "$device" -b > "$capture_root/boot.log" 2>&1
xcrun simctl install "$device" "$capture_root/Products/Debug-iphonesimulator/MissYou170OfflineHost.app"
xcrun simctl get_app_container "$device" "$bundle" data > "$capture_root/pilot-app-container.txt"
SIMCTL_CHILD_QA170_MODE=new SIMCTL_CHILD_QA170_RESET=1 xcrun simctl launch "$device" "$bundle" -AppleLanguages '(ja)' -AppleLocale ja_JP > "$capture_root/pilot-launch.log"
xcrun simctl io "$device" recordVideo --codec=h264 "$capture_root/pilot.mov" > "$capture_root/pilot-record.stdout" 2> "$capture_root/pilot-record.stderr" &
recorder=$!
printf '%s\n' "$recorder" > "$capture_root/pilot-recorder.pid"
ready=0
for i in $(seq 1 40); do
  if grep -q 'Recording started' "$capture_root/pilot-record.stderr"; then ready=1; break; fi
  kill -0 "$recorder" || break
  sleep 0.5
done
test "$ready" = 1 || { echo 'Recorder did not announce its first frame'; exit 3; }
sleep 5
xcrun simctl io "$device" screenshot "$capture_root/pilot.png" > "$capture_root/pilot-screenshot.log" 2>&1
kill -INT "$recorder"
set +e
wait "$recorder"
record_exit=$?
set -e
printf '%s\n' "$record_exit" > "$capture_root/pilot-record.exit"
test "$record_exit" = 0
test -s "$capture_root/pilot.mov"
shasum -a 256 "$capture_root/pilot.mov" "$capture_root/pilot.png" > "$capture_root/pilot.sha256"
printf 'PILOT_FINALIZED device=%s bundle=%s root=%s\n' "$device" "$bundle" "$capture_root"
