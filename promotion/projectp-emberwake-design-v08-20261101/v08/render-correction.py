import production as p
R=p.R
p.native('ec-v2-save',p.EC,['--empty','script',(R/'source-circuit-v2.jsx').as_posix(),'--save-as',(R/'projects/circuit-preview-v2.ecproj').as_posix(),'--json'])
p.native('ec-v2-reopen',p.EC,['--gpu','--project',(R/'projects/circuit-preview-v2.ecproj').as_posix(),'info','--json'])
p.native('ec-v2-render',p.EC,['--gpu','--project',(R/'projects/circuit-preview-v2.ecproj').as_posix(),'render','--comp','156 v08 code circuit preview17','--out',(R/'media/circuit-picture-v2.mov').as_posix(),'--format','prores','--prores','standard','--audio','off','--progress','--json'],timeout=180)
