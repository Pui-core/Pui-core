#!/usr/bin/ruby
# RO process filter. Does not stop anything. Only target-related capture/test consumers are exported.
require 'json'
require 'digest'
udid, old_root, run_root, output = ARGV
abort 'four arguments required' unless udid && old_root && run_root && output
abort 'refuse overwrite' if File.exist?(output)
text = IO.popen(['ps', '-axo', 'pid=,ppid=,uid=,lstart=,args='], &:read)
abort 'ps failed' unless $?.success?
rows_raw = text.lines.map do |line|
  m = line.match(/^\s*(\d+)\s+(\d+)\s+(\d+)\s+(.*)$/)
  next unless m && m[1].to_i != Process.pid
  rest = m[4]
  next unless rest.include?(udid) || rest.include?(old_root) || rest.include?(run_root)
  next unless rest.match?(/(?:xcodebuild|simctl.*recordVideo|CaptureTests.*Runner|XCTRunner)/)
  { 'pid' => m[1].to_i, 'ppid' => m[2].to_i, 'uid' => m[3].to_i, 'birthAndArgs' => rest.strip }
end
rows = rows_raw.compact
result = { 'recordedEpoch' => Time.now.to_i, 'targetUdid' => udid,
  'consumerCount' => rows.length, 'consumers' => rows,
  'scope' => 'target-related test/record consumers only; GUI use requires the Root finite-window records',
  'stopActions' => 0 }
File.open(output, File::WRONLY | File::CREAT | File::EXCL, 0600) { |f| f.write(JSON.pretty_generate(result) + "\n") }
abort 'target has capture/test consumer; do not boot/shutdown' unless rows.empty?
puts 'target-related capture/test consumers0; GUI use not inferred'
