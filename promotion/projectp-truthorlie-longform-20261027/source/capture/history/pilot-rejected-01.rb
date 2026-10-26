require 'json'
require 'fileutils'
require 'open3'
require 'digest'
require 'time'

ROOT = '/Users/pui-mac-core/codex-install/projectp121-truthorlie-20261027'
PIN = '5b11516bba2be105f44c444eb6352eb757a8abd3'
abort 'Pinned source mismatch' unless File.read(File.join(ROOT, 'source-pin.txt')).strip == PIN
OUT = File.join(ROOT, 'capture', 'pilot01')
FileUtils.mkdir_p(OUT)
File.open(File.join(OUT, 'started.lock'), File::WRONLY|File::CREAT|File::EXCL, 0600) { |f| f.puts(Process.pid) }
state = {schemaVersion: 1, sourcePin: PIN, owner: 'Coder121', phase: 'starting', startedAt: Time.now.utc.iso8601}
recorder = nil
save = lambda do |phase|
  state[:phase] = phase
  state[:updatedAt] = Time.now.utc.to_s
  File.write(File.join(OUT, 'state.json'), JSON.pretty_generate(state))
end
finish_recorder = lambda do
  if recorder
    begin
      Process.kill('INT', recorder)
      Process.wait(recorder)
      state[:recordingExit] = $?.exitstatus
    rescue Errno::ESRCH, Errno::ECHILD
      state[:recordingAlreadyStopped] = true
    ensure
      recorder = nil
    end
  end
end
%w[HUP TERM INT].each { |signal| Signal.trap(signal) { finish_recorder.call; save.call('interrupted'); exit 128 } }
at_exit { finish_recorder.call }
run = lambda do |name, args|
  File.open(File.join(OUT, name+'.log'), 'w', 0600) do |log|
    child = Process.spawn(*args, out: log, err: log)
    state[:childPid] = child
    save.call(name)
    Process.wait(child)
    state[name+'Exit'] = $?.exitstatus
    state.delete(:childPid)
    abort "#{name} failed" unless state[name+'Exit'] == 0
  end
end
uuid, error, status = Open3.capture3('/usr/bin/xcrun','simctl','create','ProjectP121 TruthOrLie Capture','com.apple.CoreSimulator.SimDeviceType.iPhone-15-Pro','com.apple.CoreSimulator.SimRuntime.iOS-17-2')
abort error unless status.success?
uuid = uuid.strip
abort 'Invalid UUID' unless uuid.match?(/\A[0-9A-F-]{36}\z/)
state[:udid] = uuid
File.write(File.join(ROOT,'capture','owned-udid.txt'), uuid+"\n")
save.call('device-created')
run.call('boot',['/usr/bin/xcrun','simctl','boot',uuid])
run.call('bootstatus',['/usr/bin/xcrun','simctl','bootstatus',uuid,'-b'])
app = File.join(ROOT,'capture/DerivedData/Build/Products/Release-iphonesimulator/TruthOrLie.app')
plist, error, status = Open3.capture3('/usr/bin/plutil','-convert','json','-o','-',File.join(app,'Info.plist'))
abort error unless status.success?
info = JSON.parse(plist)
abort 'Wrong product identity/version' unless info['CFBundleIdentifier']=='com.pui-core.truthorlie' && info['CFBundleShortVersionString']=='1.03' && info['CFBundleVersion']=='23'
state[:app] = {bundle: info['CFBundleIdentifier'], version: info['CFBundleShortVersionString'], build: info['CFBundleVersion'], sdk: info['DTSDKName'], executableSha256: Digest::SHA256.file(File.join(app,info.fetch('CFBundleExecutable'))).hexdigest}
run.call('install',['/usr/bin/xcrun','simctl','install',uuid,app])
run.call('launch',['/usr/bin/xcrun','simctl','launch',uuid,info['CFBundleIdentifier']])
sleep 3
run.call('fresh-title',['/usr/bin/xcrun','simctl','io',uuid,'screenshot',File.join(OUT,'fresh-title.png')])
log = File.open(File.join(OUT,'recorder.log'),'w',0600)
recorder = Process.spawn('/usr/bin/xcrun','simctl','io',uuid,'recordVideo','--codec=h264','--mask=ignored',File.join(OUT,'fresh-native-pilot.mov'),out:log,err:log)
state[:recorderPid] = recorder
save.call('recording-owned-device')
sleep 8
finish_recorder.call
log.close
state.delete(:recorderPid)
run.call('pilot-ui-test',['/usr/bin/nice','-n','10','/usr/bin/xcrun','xcodebuild','test-without-building','-project',File.join(ROOT,'capture/harness/ProjectP121Capture.xcodeproj'),'-scheme','ProjectP121Capture','-configuration','Release','-destination',"platform=iOS Simulator,id=#{uuid}",'-derivedDataPath',File.join(ROOT,'capture/DerivedData'),'-resultBundlePath',File.join(OUT,'pilot.xcresult'),'-parallel-testing-enabled','NO','-maximum-concurrent-test-simulator-destinations','1','-only-testing:ProjectP121CaptureTests/ProjectP121CaptureTests/test01PilotNavigate','CODE_SIGNING_ALLOWED=NO'])
run.call('export-attachments',['/usr/bin/xcrun','xcresulttool','export','attachments','--path',File.join(OUT,'pilot.xcresult'),'--output-path',File.join(OUT,'attachments')])
save.call('pilot-navigation-ready-for-review')
puts JSON.pretty_generate(state)
