#!/bin/bash
# Root-authorized COLD READ/BACKUP ONLY. No boot/GUI/record/install/shutdown commands.
set -euo pipefail
root=/Users/pui-mac-core/codex-install/projectp129-history-cold-20261027T1500Z
old=/Users/pui-mac-core/codex-install/projectp121-truthorlie-20261027
device=6FC6BC4F-4CD9-4946-83F6-944ABAE9D15E
out="$root/receipts"
mkdir "$out"
mkdir "$root/active-cold.lock"
child=; birth=; needle=; hold=0; cleanup_mode=0
finished=0; fresh_state_verified=0
stop_at=$((SECONDS+600))
uid=$(id -u)
identical_child() {
 local pp actual owner args
 test -n "$child" && test -n "$birth" && test -n "$needle" || return 1
 pp=$(ps -p "$child" -o ppid= 2>/dev/null | tr -d ' ' || true)
 owner=$(ps -p "$child" -o uid= 2>/dev/null | tr -d ' ' || true)
 actual=$(ps -p "$child" -o lstart= 2>/dev/null || true)
 args=$(ps -ww -p "$child" -o args= 2>/dev/null || true)
 test "$pp" = "$$" && test "$owner" = "$uid" && test "$actual" = "$birth" || return 1
 case "$args" in *"$needle"*)return 0;;*)return 1;;esac
}
stop_child() {
 local i
 if kill -0 "$child" 2>/dev/null; then
  if identical_child; then
   printf 'TERM own child=%s birth=%s needle=%s\n' "$child" "$birth" "$needle" >> "$out/cleanup.txt"
   kill -TERM "$child" 2>/dev/null || true
  else
   printf 'IDENTITY_REFUSED child=%s\n' "$child" >> "$out/cleanup.txt"
   hold=1; return 75
  fi
  for i in $(seq 1 15);do kill -0 "$child" 2>/dev/null || break;sleep 1;done
 fi
 if kill -0 "$child" 2>/dev/null;then printf 'RESIDUAL child=%s\n' "$child" >> "$out/cleanup.txt";hold=1;return 75;fi
 set +e;wait "$child";last_wait=$?;set -e
 child=
}
bounded() {
 local limit="$1" start="$SECONDS" rc remaining
 needle="$2"; shift 2
 if test "$cleanup_mode" = 0;then
  remaining=$((stop_at-SECONDS-45));test "$remaining" -gt 0 || return 124
  if test "$limit" -gt "$remaining";then limit="$remaining";fi
 fi
 "$@" & child=$!
 birth=$(ps -p "$child" -o lstart= 2>/dev/null || true)
 printf 'START pid=%s ppid=%s uid=%s birth=%s needle=%s limit=%s\n' "$child" "$$" "$uid" "$birth" "$needle" "$limit" >> "$out/children.txt"
 while kill -0 "$child" 2>/dev/null;do
  if test $((SECONDS-start)) -ge "$limit";then
   printf 'TIMEOUT pid=%s limit=%s needle=%s\n' "$child" "$limit" "$needle" >> "$out/timeouts.txt"
   stop_child || return 75
   return 124
  fi
  sleep 1
 done
 set +e;wait "$child";rc=$?;set -e
 child=;return "$rc"
}
cleanup() {
 local rc=$?
 trap - EXIT HUP TERM INT
 cleanup_mode=1
 if test -n "$child";then stop_child || true;fi
 if test "$hold" = 0;then rmdir "$root/active-cold.lock" || rc=75;else rc=75;fi
 date -u '+%Y-%m-%dT%H:%M:%SZ' > "$out/finished-at.txt"
 printf '%s\n' "$rc" > "$out/stage.exit"
 printf 'finished=%s freshStateVerified=%s hold=%s sourceOverwrites=0 boot=0 gui=0 record=0 install=0 shutdown=0\n' "$finished" "$fresh_state_verified" "$hold" > "$out/terminal.txt"
 exit "$rc"
}
trap cleanup EXIT
trap 'exit 143' HUP TERM INT
printf '%s uid=%s\n' "$$" "$uid" > "$out/helper.pid-owner.txt"
date -u '+%Y-%m-%dT%H:%M:%SZ' > "$out/started-at.txt"
for h in history-data-inspect-prepared.rb cold-manifest-prepared.rb target-consumers-prepared.rb verify-cold.rb;do
 bounded 15 "$h" /usr/bin/ruby -c "$root/helpers/$h" > "$out/syntax-$h.txt" 2>&1
done
bounded 25 'list devices' xcrun simctl list devices --json > "$out/devices-before.json" 2> "$out/devices-before.stderr"
/usr/bin/ruby -rjson -e 'j=JSON.parse(File.read(ARGV[0]));a=j.fetch("devices").values.flatten;d=a.find{|x|x["udid"]==ARGV[1]};abort "not Shutdown" unless d&&d["state"]=="Shutdown"' "$out/devices-before.json" "$device"
bounded 15 'target-consumers-prepared.rb' /usr/bin/ruby "$root/helpers/target-consumers-prepared.rb" "$device" "$old" "$root" "$out/target-consumers-before.json" > "$out/target-consumers-before.log" 2>&1
bounded 12 "$device" /usr/libexec/PlistBuddy -c 'Print :state' "/Users/pui-mac-core/Library/Developer/CoreSimulator/Devices/$device/device.plist" > "$out/plist-state-before.txt"
test "$(cat "$out/plist-state-before.txt")" = 1
fresh_state_verified=1
bounded 20 "$device" xcrun simctl get_app_container "$device" com.pui-core.truthorlie data > "$out/app-data-path.txt" 2> "$out/app-data-path.stderr"
bounded 20 "$device" xcrun simctl get_app_container "$device" com.pui-core.truthorlie app > "$out/app-bundle-path.txt" 2> "$out/app-bundle-path.stderr"
app_data=$(cat "$out/app-data-path.txt")
app_bundle=$(cat "$out/app-bundle-path.txt")
case "$app_data" in /Users/pui-mac-core/Library/Developer/CoreSimulator/Devices/"$device"/data/Containers/Data/Application/*) ;; *)exit 2;;esac
case "$app_bundle" in /Users/pui-mac-core/Library/Developer/CoreSimulator/Devices/"$device"/data/Containers/Bundle/Application/*/TruthOrLie.app) ;; *)exit 2;;esac
bounded 12 'MCMMetadataIdentifier' /usr/libexec/PlistBuddy -c 'Print :MCMMetadataIdentifier' "$app_data/.com.apple.mobile_container_manager.metadata.plist" > "$out/data-bundle-id.txt"
test "$(cat "$out/data-bundle-id.txt")" = com.pui-core.truthorlie
bounded 12 'CFBundleIdentifier' /usr/libexec/PlistBuddy -c 'Print :CFBundleIdentifier' "$app_bundle/Info.plist" > "$out/app-bundle-id.txt"
test "$(cat "$out/app-bundle-id.txt")" = com.pui-core.truthorlie
bounded 25 'shasum' shasum -a 256 "$app_bundle/TruthOrLie" "$old/capture/harness/CaptureTests/CaptureTests.swift" "$old/capture/harness/project.yml" "$old/capture/run-ui-capture.sh" > "$out/protected-before.sha256"
test "$(head -1 "$out/protected-before.sha256" | cut -d ' ' -f 1)" = 51bcf0e740e1253a44edbcc2f038d765cc9d7716804b0ec35e0c34d04b988d70
cp -p "/Users/pui-mac-core/Library/Developer/CoreSimulator/Devices/$device/device.plist" "$root/backup/device-before.plist"
cp -p "$app_bundle/Info.plist" "$root/backup/installed-Info.plist"
bounded 45 'TruthOrLie' cp -p "$app_bundle/TruthOrLie" "$root/backup/installed-TruthOrLie"
cp -p "$old/capture/harness/CaptureTests/CaptureTests.swift" "$root/backup/old-CaptureTests.swift"
cp -p "$old/capture/harness/project.yml" "$root/backup/old-project.yml"
cp -p "$old/capture/run-ui-capture.sh" "$root/backup/old-run-ui-capture.sh"
bounded 80 'cold-manifest-prepared.rb' /usr/bin/ruby "$root/helpers/cold-manifest-prepared.rb" "$app_data" "$root/backup/data-before.json" > "$out/data-before.log" 2>&1
bounded 20 'plutil' /usr/bin/plutil -convert xml1 -o "$root/backup/preferences-before.xml" "$app_data/Library/Preferences/com.pui-core.truthorlie.plist" > "$out/plutil-before.log" 2>&1
bounded 20 'history-data-inspect-prepared.rb' /usr/bin/ruby "$root/helpers/history-data-inspect-prepared.rb" "$root/backup/preferences-before.xml" "$root/backup/history-before.json" > "$out/history-before.log" 2>&1
# Confirm target is still cold immediately before copying its data.
bounded 12 "$device" /usr/libexec/PlistBuddy -c 'Print :state' "/Users/pui-mac-core/Library/Developer/CoreSimulator/Devices/$device/device.plist" > "$out/plist-state-before-archive.txt"
test "$(cat "$out/plist-state-before-archive.txt")" = 1
if bounded 15 'ditto' /usr/bin/ditto -h > "$out/native-ditto-help.txt" 2>&1;then :;else
 rc=$?;test "$rc" = 1 || exit "$rc"
 grep -q 'ditto' "$out/native-ditto-help.txt"
fi
bounded 150 'app-data.zip' /usr/bin/ditto -c -k --sequesterRsrc --keepParent "$app_data" "$root/backup/app-data.zip" > "$out/archive.log" 2>&1
mkdir "$root/verify-extract"
bounded 150 'app-data.zip' /usr/bin/ditto -x -k "$root/backup/app-data.zip" "$root/verify-extract" > "$out/extract.log" 2>&1
extracted="$root/verify-extract/$(basename "$app_data")"
bounded 80 'cold-manifest-prepared.rb' /usr/bin/ruby "$root/helpers/cold-manifest-prepared.rb" "$extracted" "$root/backup/data-extracted.json" > "$out/data-extracted.log" 2>&1
bounded 80 'cold-manifest-prepared.rb' /usr/bin/ruby "$root/helpers/cold-manifest-prepared.rb" "$app_data" "$root/backup/data-after.json" > "$out/data-after.log" 2>&1
bounded 20 'plutil' /usr/bin/plutil -convert xml1 -o "$root/backup/preferences-after.xml" "$app_data/Library/Preferences/com.pui-core.truthorlie.plist" > "$out/plutil-after.log" 2>&1
bounded 20 'history-data-inspect-prepared.rb' /usr/bin/ruby "$root/helpers/history-data-inspect-prepared.rb" "$root/backup/preferences-after.xml" "$root/backup/history-after.json" > "$out/history-after.log" 2>&1
bounded 25 'list devices' xcrun simctl list devices --json > "$out/devices-after.json" 2> "$out/devices-after.stderr"
/usr/bin/ruby -rjson -e 'j=JSON.parse(File.read(ARGV[0]));a=j.fetch("devices").values.flatten;d=a.find{|x|x["udid"]==ARGV[1]};abort "not Shutdown" unless d&&d["state"]=="Shutdown"' "$out/devices-after.json" "$device"
bounded 15 'target-consumers-prepared.rb' /usr/bin/ruby "$root/helpers/target-consumers-prepared.rb" "$device" "$old" "$root" "$out/target-consumers-after.json" > "$out/target-consumers-after.log" 2>&1
bounded 25 'shasum' shasum -a 256 -c "$out/protected-before.sha256" > "$out/protected-after-check.txt" 2>&1
bounded 25 'verify-cold.rb' /usr/bin/ruby "$root/helpers/verify-cold.rb" "$root" > "$out/verification.log" 2>&1
finished=1
