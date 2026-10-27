#!/usr/bin/ruby
# Offline parser only: input is an XML copy from plutil, never a live app write.
require 'rexml/document'
require 'base64'
require 'json'
require 'digest'
input, output = ARGV
abort 'usage: ruby history-data-inspect-prepared.rb preferences.xml output.json' unless input && output
abort 'refuse overwrite' if File.exist?(output)
doc = REXML::Document.new(File.binread(input))
dict = doc.elements['plist/dict']
abort 'missing plist dict' unless dict
key = dict.elements.to_a.find { |e| e.name == 'key' && e.text == 'gameHistory.records' }
abort 'missing exact gameHistory.records key' unless key
data = key.next_element
abort 'gameHistory.records is not Data' unless data && data.name == 'data'
bytes = Base64.strict_decode64(data.text.to_s.gsub(/\s+/, ''))
records = JSON.parse(bytes)
abort 'history is not an array' unless records.is_a?(Array)
fictional_names = ['操作例AA', '操作例BB'].sort
selected = records.select do |r|
  r.is_a?(Hash) && r['totalRounds'] == 4 &&
    (r['playerNames'] || {}).values.map { |n| n.to_s.gsub(/[[:space:]]/, '') }.sort == fictional_names
end
matches = selected.map do |r|
  rounds = r['rounds'] || []
  r1 = rounds.find { |x| x['number'] == 1 }
  answers = r1 && r1['answers'].is_a?(Array) ? r1['answers'] : []
  { 'id' => r['id'], 'completedAt' => r['completedAt'], 'totalRounds' => r['totalRounds'],
    'roundCount' => rounds.length, 'score' => r['score'],
    'containsActualR1RedBicycle' => answers.any? { |a| a['response'] == '赤い自転車' },
    'round1LieIndex' => r1 && r1['lieIndex'],
    'classification' => 'existing saved bytes, not new UI observation' }
end
result = { 'exactKey' => 'gameHistory.records', 'historyDataBytes' => bytes.bytesize,
  'historyDataSha256' => Digest::SHA256.hexdigest(bytes), 'totalRecordCount' => records.length,
  'recordIdsSha256' => Digest::SHA256.hexdigest(JSON.generate(records.map { |r| r['id'] })),
  'fixture4RMatches' => matches, 'otherRecordBodiesExported' => false,
  'sourceXmlSha256' => Digest::SHA256.file(input).hexdigest,
  'newRuntimeCapture' => false, 'uiValidated' => false, 'productWrites' => false }
File.open(output, File::WRONLY | File::CREAT | File::EXCL, 0600) { |f| f.write(JSON.pretty_generate(result) + "\n") }
puts JSON.generate({ 'exactKey' => result['exactKey'], 'records' => records.length,
  'fixture4RMatches' => matches.length, 'uiValidated' => false })
