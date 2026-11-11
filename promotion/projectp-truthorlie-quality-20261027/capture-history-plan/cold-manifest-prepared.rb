#!/usr/bin/ruby
# Only reads the requested directory; output must be outside it and not pre-existing.
require 'find'
require 'json'
require 'digest'
require 'pathname'
input, output = ARGV
abort 'usage: ruby cold-manifest-prepared.rb container-dir new-manifest.json' unless input && output
input = File.realpath(input)
output = File.expand_path(output)
abort 'output is inside source or already exists' if output.start_with?(input + '/') || File.exist?(output)
rows = []
Find.find(input) do |p|
  next if p == input
  rel = Pathname.new(p).relative_path_from(Pathname.new(input)).to_s
  s = File.lstat(p)
  if s.symlink?
    rows << { 'path' => rel, 'kind' => 'symlink', 'target' => File.readlink(p) }
    Find.prune
  elsif s.file?
    rows << { 'path' => rel, 'kind' => 'file', 'bytes' => s.size,
      'sha256' => Digest::SHA256.file(p).hexdigest, 'mode' => s.mode & 07777 }
  elsif s.directory?
    rows << { 'path' => rel, 'kind' => 'directory', 'mode' => s.mode & 07777 }
  else
    abort 'special file not automatically archived/accepted: ' + rel
  end
end
rows.sort_by! { |r| r['path'] }
result = { 'sourceRoot' => input, 'files' => rows,
  'fileListSha256' => Digest::SHA256.hexdigest(JSON.generate(rows)),
  'scope' => 'data forks, symlink targets, mode; xattrs/ACL require separate native archive evidence' }
File.open(output, File::WRONLY | File::CREAT | File::EXCL, 0600) { |f| f.write(JSON.pretty_generate(result) + "\n") }
puts result['fileListSha256']
