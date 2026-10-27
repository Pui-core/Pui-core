#!/usr/bin/ruby
require 'json'
require 'digest'
root = ARGV.fetch(0)
read = lambda { |n| JSON.parse(File.read(File.join(root, 'backup', n))) }
a = read.call('data-before.json')
b = read.call('data-extracted.json')
c = read.call('data-after.json')
abort 'archive extraction/source drift' unless a['files'] == b['files'] && a['files'] == c['files']
h1 = read.call('history-before.json')
h2 = read.call('history-after.json')
abort 'history Data drift' unless h1['historyDataSha256'] == h2['historyDataSha256'] &&
  h1['recordIdsSha256'] == h2['recordIdsSha256'] && h1['totalRecordCount'] == h2['totalRecordCount']
lines = File.readlines(File.join(root, 'receipts', 'protected-before.sha256'))
names = ['installed-TruthOrLie', 'old-CaptureTests.swift', 'old-project.yml', 'old-run-ui-capture.sh']
abort 'protected source count' unless lines.length == names.length
names.each_with_index do |n, i|
  abort 'protected backup copy differs: ' + n unless Digest::SHA256.file(File.join(root, 'backup', n)).hexdigest == lines[i].split.first
end
output = File.join(root, 'backup', 'verified-manifest.json')
abort 'refuse overwrite' if File.exist?(output)
result = { 'status' => 'PASS_COLD_APP_DATA_ARCHIVE_EXTRACT_SOURCE_IDENTICAL_NO_UI',
  'verifiedAtUtc' => Time.now.utc.strftime('%Y-%m-%dT%H:%M:%SZ'),
  'targetUdid' => '6FC6BC4F-4CD9-4946-83F6-944ABAE9D15E', 'root' => root,
  'archiveSha256' => Digest::SHA256.file(File.join(root, 'backup', 'app-data.zip')).hexdigest,
  'fileListSha256' => a['fileListSha256'], 'sourceBeforeAfterIdentical' => true,
  'archiveExtractIdentical' => true, 'fileEntryCount' => a['files'].length,
  'fileBytes' => a['files'].select { |r| r['kind'] == 'file' }.map { |r| r['bytes'] }.reduce(0, :+),
  'historyDataSha256' => h1['historyDataSha256'], 'historyDataBytes' => h1['historyDataBytes'],
  'historyRecordCount' => h1['totalRecordCount'], 'recordIdsSha256' => h1['recordIdsSha256'],
  'fixture4RMatches' => h1['fixture4RMatches'], 'oldProtectedCopiesIdentical' => true,
  'xattrAclIndependentlyMeasured' => false,
  'noWholeDeviceBytePreservationClaim' => true,
  'bootGuiRecordInstallShutdown' => 0, 'productAppDataWrites' => 0, 'uiSuccess' => false }
File.open(output, File::WRONLY | File::CREAT | File::EXCL, 0600) { |f| f.write(JSON.pretty_generate(result) + "\n") }
puts JSON.generate({ 'status' => result['status'], 'files' => result['fileEntryCount'],
  'historyRecords' => result['historyRecordCount'], 'fixture4RMatches' => result['fixture4RMatches'].length,
  'uiSuccess' => false })
