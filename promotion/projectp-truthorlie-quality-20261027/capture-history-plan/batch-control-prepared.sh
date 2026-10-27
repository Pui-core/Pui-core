#!/bin/bash
# PREPARED, NOT RUN ON MAC. Root finite-window coordination only.
# No product/Runner install, no source edit, no automatic GUI action.
set -euo pipefail
: "${PP129_ROOT_WINDOW_FILE:?Root announces a finite window and provides this actual file}"
: "${PP129_RUN_ROOT:?fresh private Mac output root required}"
case "$PP129_RUN_ROOT" in /Users/pui-mac-core/codex-install/projectp129-history-*) ;; *) exit 2;; esac
case "$PP129_ROOT_WINDOW_FILE" in "$PP129_RUN_ROOT"/root-window.json) ;; *) exit 2;; esac
root="$PP129_RUN_ROOT"
device=6FC6BC4F-4CD9-4946-83F6-944ABAE9D15E
test ! -e "$root/root-ui-released"
test ! -e "$root/root-target-window-confirmed.json"
test ! -e "$root/other-target-use-detected"
test -f "$root/backup/verified-manifest.json"
test -f "$root/helpers/target-consumers-prepared.rb"
# The template deliberately fails. Root fills facts only after fresh ownership/backup checks.
/usr/bin/ruby -rjson -e '
 j=JSON.parse(File.read(ARGV[0]));now=Time.now.to_i
 ok=j["status"]=="ROOT_FINITE_WINDOW" && j["issuer"]=="/root" &&
 j["runRoot"]==ARGV[1] && j["targetUdid"]==ARGV[2] &&
 j["targetExclusiveForThisBatch"]==true && j["otherMacUsersChecked"]==true &&
 j["rootMacUiWindowConfirmed"]==true && j["coldBackupVerified"]==true &&
 j["coldBackupManifestSha256"].to_s.match?(/\A[0-9a-f]{64}\z/) &&
 j["readOnlyNavigationOnly"]==true && j["allowProductInstall"]==false &&
 j["allowOldHarnessInstall"]==false && j["allowNewRunnerInstall"]==false &&
 j["startEpoch"].is_a?(Integer) && j["expiresEpoch"].is_a?(Integer) &&
 j["startEpoch"]<=now && now<j["expiresEpoch"] && j["expiresEpoch"]-j["startEpoch"]<=900 &&
 j["captureSecondsLimit"].is_a?(Integer) && (30..180).include?(j["captureSecondsLimit"])
 abort "Root window incomplete/expired; no Mac mutation" unless ok
' "$PP129_ROOT_WINDOW_FILE" "$root" "$device"
expected_backup=$(/usr/bin/ruby -rjson -e 'puts JSON.parse(File.read(ARGV[0]))["coldBackupManifestSha256"]' "$PP129_ROOT_WINDOW_FILE")
actual_backup=$(shasum -a 256 "$root/backup/verified-manifest.json" | cut -d ' ' -f 1)
test "$actual_backup" = "$expected_backup"
window_stop=$(/usr/bin/ruby -rjson -e 'puts JSON.parse(File.read(ARGV[0]))["expiresEpoch"]' "$PP129_ROOT_WINDOW_FILE")
mkdir "$root/batch"
out="$root/batch"
mkdir "$root/active-owner.lock"
cp "$PP129_ROOT_WINDOW_FILE" "$out/root-window-original.json"
boot_accepted=0
boot_attempted=0
rec_pid=; rec_birth=; rec_needle=
cmd_pid=; cmd_birth=; cmd_needle=
hold=0
unsafe_to_shutdown=0
cleanup_mode=0
uid=$(id -u)
state() { /usr/libexec/PlistBuddy -c 'Print :state' "/Users/pui-mac-core/Library/Developer/CoreSimulator/Devices/$device/device.plist"; }
release_valid() {
 /usr/bin/ruby -rjson -e '
  w=JSON.parse(File.read(ARGV[0]));r=JSON.parse(File.read(ARGV[1])); now=Time.now.to_i
  ok=r["issuer"]=="/root" && r["rootWindowId"]==w["rootWindowId"] &&
  r["targetUdid"]==w["targetUdid"] && r["rootInputFinished"]==true &&
  r["otherTargetUsersChecked"]==true && r["otherTargetUsersPresent"]==false &&
  r["releasedEpoch"].is_a?(Integer) && (0..90).include?(now-r["releasedEpoch"])
  abort "Root release stale/incomplete" unless ok
 ' "$PP129_ROOT_WINDOW_FILE" "$root/root-ui-released"
}
identity() {
 local p="$1" birth="$2" needle="$3" pp owner actual args
 test -n "$p" && test "$p" != 0 && test "$p" != 1 && test -n "$birth" && test -n "$needle" || return 1
 pp=$(ps -p "$p" -o ppid= 2>/dev/null | tr -d ' ' || true)
 owner=$(ps -p "$p" -o uid= 2>/dev/null | tr -d ' ' || true)
 actual=$(ps -p "$p" -o lstart= 2>/dev/null || true)
 args=$(ps -ww -p "$p" -o args= 2>/dev/null || true)
 test "$pp" = "$$" && test "$owner" = "$uid" && test "$actual" = "$birth" || return 1
 case "$args" in *"$needle"*) return 0;; *) return 1;; esac
}
stop_child() {
 local p="$1" birth="$2" needle="$3" signal="$4" label="$5" i
 if kill -0 "$p" 2>/dev/null; then
  if ! identity "$p" "$birth" "$needle"; then printf '%s IDENTITY_UNCERTAIN\n' "$label" >> "$out/HOLD.txt"; hold=1; unsafe_to_shutdown=1; return 75; fi
  ps -ww -p "$p" -o pid=,ppid=,uid=,lstart=,args= >> "$out/owned-stop-log.txt"
  kill -"$signal" "$p" 2>/dev/null || true
  for i in $(seq 1 30); do kill -0 "$p" 2>/dev/null || break; sleep 1; done
 fi
 if kill -0 "$p" 2>/dev/null; then printf '%s STILL_RUNNING\n' "$label" >> "$out/HOLD.txt"; hold=1; unsafe_to_shutdown=1; return 75; fi
 set +e; wait "$p"; child_exit=$?; set -e
 return 0
}
bounded() {
 local limit="$1" needle="$2" start="$SECONDS" rc remaining
 shift 2
 if test "$cleanup_mode" = 0; then
  remaining=$((window_stop-$(date +%s)-60))
  test "$remaining" -gt 0 || return 124
  if test "$limit" -gt "$remaining"; then limit="$remaining"; fi
 fi
 "$@" & cmd_pid=$!
 cmd_birth=$(ps -p "$cmd_pid" -o lstart= 2>/dev/null || true)
 cmd_needle="$needle"
 printf '%s\n' "$cmd_pid" >> "$out/command-pids.txt"
 while kill -0 "$cmd_pid" 2>/dev/null; do
  if test $((SECONDS-start)) -ge "$limit"; then
   stop_child "$cmd_pid" "$cmd_birth" "$cmd_needle" TERM command || return 75
   cmd_pid=; return 124
  fi
  sleep 1
 done
 set +e; wait "$cmd_pid"; rc=$?; set -e
 cmd_pid=; return "$rc"
}
cleanup() {
 local rc=$? s
 trap - EXIT HUP TERM INT
 cleanup_mode=1
 if test -n "$cmd_pid"; then stop_child "$cmd_pid" "$cmd_birth" "$cmd_needle" TERM command || true; fi
 if test -n "$rec_pid"; then
  if stop_child "$rec_pid" "$rec_birth" "$rec_needle" INT recorder; then
   printf '%s\n' "${child_exit:-75}" > "$out/recorder.exit"
   test "${child_exit:-75}" = 0 || hold=1
   rec_pid=
  fi
 fi
 # Root releases its UI use explicitly after the entire capture batch, including failed UI attempts.
 # This marker is coordination with Root, not an extra owner approval gate.
 if test "$boot_accepted" = 1 && test "$unsafe_to_shutdown" = 0 && test -f "$root/root-ui-released"; then
  if test -f "$root/other-target-use-detected" || ! release_valid; then
   printf 'TARGET_USE_CHANGED do not shutdown\n' >> "$out/HOLD.txt"; hold=1
  elif ! bounded 15 'target-consumers-prepared.rb' /usr/bin/ruby "$root/helpers/target-consumers-prepared.rb" "$device" /Users/pui-mac-core/codex-install/projectp121-truthorlie-20261027 "$root" "$out/target-consumers-final.json" > "$out/target-consumers-final.log" 2>&1; then
   printf 'TARGET_CONSUMERS_UNRESOLVED do not shutdown\n' >> "$out/HOLD.txt"; hold=1
  else
   if bounded 35 "$device" xcrun simctl shutdown "$device" > "$out/shutdown.log" 2>&1; then :; else hold=1; fi
   s=$(state 2>/dev/null || true)
   printf '%s\n' "$s" > "$out/final-target-plist-state.txt"
   test "$s" = 1 || hold=1
   if bounded 25 'list devices' xcrun simctl list devices --json > "$out/devices-after.json" 2> "$out/devices-after.stderr"; then
    /usr/bin/ruby -rjson -e 'j=JSON.parse(File.read(ARGV[0])); a=j.fetch("devices").values.flatten; d=a.find{|x|x["udid"]==ARGV[1]}; abort "target not Shutdown" unless d && d["state"]=="Shutdown"' "$out/devices-after.json" "$device" || hold=1
   else hold=1; fi
  fi
 elif test "$boot_attempted" = 1; then
  printf 'BOOT_OR_OWNERSHIP_UNRESOLVED target state=%s; Root follow-up required\n' "$(state 2>/dev/null || true)" >> "$out/HOLD.txt"
  hold=1
 fi
 if test "$hold" = 0; then
  if ! rmdir "$root/active-owner.lock"; then hold=1; rc=75; fi
 else rc=75; fi
 printf '%s\n' "$rc" > "$out/batch.exit"
 printf 'complete=0 (until Root verifies state/data/MP4); exit=%s\n' "$rc" > "$out/terminal.txt"
 exit "$rc"
}
trap cleanup EXIT
trap 'exit 143' HUP TERM INT
# Fresh preflight after the cold backup: any pre-existing Booted target is not ours.
bounded 25 'list devices' xcrun simctl list devices --json > "$out/devices-before.json"
/usr/bin/ruby -rjson -e 'j=JSON.parse(File.read(ARGV[0])); a=j.fetch("devices").values.flatten; d=a.find{|x|x["udid"]==ARGV[1]}; abort "target not Shutdown" unless d && d["state"]=="Shutdown"' "$out/devices-before.json" "$device"
bounded 15 'target-consumers-prepared.rb' /usr/bin/ruby "$root/helpers/target-consumers-prepared.rb" "$device" /Users/pui-mac-core/codex-install/projectp121-truthorlie-20261027 "$root" "$out/target-consumers-before.json" > "$out/target-consumers-before.log" 2>&1
test "$(state)" = 1
printf '%s\n' "$$ uid=$uid device=$device" > "$out/operator.txt"
printf '%s\n' "boot requested at $(date -u '+%Y-%m-%dT%H:%M:%SZ')" > "$out/boot-requested.txt"
boot_attempted=1
if bounded 30 "$device" xcrun simctl boot "$device" > "$out/boot.log" 2>&1; then
 boot_accepted=1
 printf 'accepted by simctl boot; owner=%s pid=%s\n' "$uid" "$$" > "$out/boot-owned.txt"
else
 # A timeout may boot later. Request alone is not proof of ownership: cleanup keeps HOLD.
 exit 75
fi
bounded 120 "$device" xcrun simctl bootstatus "$device" -b > "$out/bootstatus.log" 2>&1
bounded 25 "$device" xcrun simctl io "$device" screenshot --type=png "$out/target-before-ui.png" > "$out/screenshot-before-ui.log" 2>&1
shasum -a 256 "$out/target-before-ui.png" > "$out/target-before-ui.sha256"
xcrun simctl io "$device" recordVideo --codec=h264 --mask=ignored "$out/history-normal-ui.mov" > "$out/recorder.log" 2>&1 &
rec_pid=$!
rec_birth=$(ps -p "$rec_pid" -o lstart= 2>/dev/null || true)
rec_needle="$out/history-normal-ui.mov"
printf '%s\n' "$rec_pid" > "$out/recorder.pid"
ps -ww -p "$rec_pid" -o pid=,ppid=,uid=,lstart=,args= > "$out/recorder-owner.txt"
ready=0
for i in $(seq 1 40); do
 if grep -q 'Recording started' "$out/recorder.log"; then ready=1; break; fi
 kill -0 "$rec_pid" 2>/dev/null || break
 sleep .25
done
test "$ready" = 1
printf '%s\n' 'Root: first compare the named target Simulator window with batch/target-before-ui.png; record root-target-window-confirmed.json BEFORE INPUT. Then ordinary history navigation only and fresh JSON root-ui-released.' > "$root/recording.READY"
start=$SECONDS
limit=$(/usr/bin/ruby -rjson -e 'puts JSON.parse(File.read(ARGV[0]))["captureSecondsLimit"]' "$PP129_ROOT_WINDOW_FILE")
while test ! -f "$root/root-ui-released"; do
 kill -0 "$rec_pid" 2>/dev/null || exit 75
 test $((SECONDS-start)) -lt "$limit" || exit 124
 test "$(date +%s)" -lt "$window_stop" || exit 124
 sleep 1
done
test -f "$root/root-target-window-confirmed.json"
/usr/bin/ruby -rjson -e '
 w=JSON.parse(File.read(ARGV[0]));c=JSON.parse(File.read(ARGV[1])); sha=File.read(ARGV[2]).split.first
 abort "GUI target not confirmed" unless c["issuer"]=="/root" &&
 c["rootWindowId"]==w["rootWindowId"] && c["targetUdid"]==w["targetUdid"] &&
 c["foregroundSimulatorName"]=="ProjectP121 TruthOrLie Capture" &&
 c["nativeTargetScreenshotSha256"]==sha && c["onlyTargetWindowInput"]==true &&
 c["confirmedEpoch"].is_a?(Integer) && c["confirmedEpoch"]>=w["startEpoch"]
' "$PP129_ROOT_WINDOW_FILE" "$root/root-target-window-confirmed.json" "$out/target-before-ui.sha256"
# Stop/wait in cleanup; the whole batch owns a single recorder and a single boot.
exit 0
