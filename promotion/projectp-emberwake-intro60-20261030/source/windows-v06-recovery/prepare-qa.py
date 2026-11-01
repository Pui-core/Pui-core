from run import *
p=ROOT/'attempt01/source'
(p/'background.mjs').write_text((ROOT/'background.windows.mjs').read_text(encoding='utf8'),encoding='utf8')
config=p/'v06-config.mjs'
s=config.read_text(encoding='utf8').replace("'/home/pui/private-use/projectp156-v06-case-20261031'",repr((ROOT/'attempt01').as_posix())).replace("'/mnt/f/Videos/ProjectP-EMBERWAKE-Intro60-2026-10-30/intro65-v01'",repr((ROOT/'attempt01/dependencies').as_posix()))
config.write_text(s,encoding='utf8')
s=(p/'v06-checks.mjs').read_text(encoding='utf8').replace("j.startsWith('/')","(j.startsWith('/')||/^[A-Za-z]:[\\\\/]/.test(j))")
(p/'v06-checks.mjs').write_text(s,encoding='utf8')
s=(p/'v06-lamp-qa.mjs').read_text(encoding='utf8').replace('file=${fs_[i]}','file=${fs_[i].slice(out.length+1).replace(/^/,\'attempt01/\')}')
(p/'v06-lamp-qa.mjs').write_text(s,encoding='utf8')
