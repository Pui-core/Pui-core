import production as p,json,pathlib
R=p.R
quotes=json.loads((R/'code-pin.json').read_text(encoding='utf8'))['quotes']
for name,quote,heading,caption,size in [('draw',quotes[0],'同じスイッチの状態から、','輪郭の色を、切り替える。',34),('collision',quotes[1],'表示だけ、ではなく。','渡れる判定も、同じ状態から。',44)]:
    project=(R/f'projects/code-{name}.pcraft').as_posix()
    commands=[('type.create',{'text':heading,'x':60,'y':85,'size':48,'font':'Meiryo','style':'Bold','color':'#f4bc68','name':'editor explanation'}),
              ('type.create',{'text':quote['displayFragment'],'x':60,'y':210,'size':size,'font':'Consolas','color':'#d6eee4','name':'exact product code fragment'}),
              ('type.create',{'text':caption,'x':60,'y':330,'size':43,'font':'Meiryo','style':'Bold','color':'#ffffff','name':'editor interpretation, not author quotation'}),
              ('type.create',{'text':f"実ゲームコードの抜粋（L{quote['lineStart']}の一部）",'x':60,'y':420,'size':27,'font':'Meiryo','color':'#9eb9b4','name':'excerpt disclosure'}),
              ('type.create',{'text':'scripts/campaign/world.gd  @71584a6 / 0.12.0','x':60,'y':475,'size':27,'font':'Consolas','color':'#9eb9b4','name':'source pin'})]
    args=['run','--new',json.dumps({'width':1080,'height':520,'background':'#112e35','name':'v08 exact source '+name})]
    for command,params in commands:args+=['--cmd',command,'--params',json.dumps(params,ensure_ascii=False)]
    args+=['--out',project]
    p.native('code-'+name+'-save',p.PC,args)
    p.native('code-'+name+'-reopen',p.PC,['info',project,'--compact'])
    p.native('code-'+name+'-render',p.PC,['convert',project,(R/f'media/code-{name}.png').as_posix()])
for name,source,x in [('before','detail-01.png',240),('after','detail-03.png',120)]:
    project=(R/f'projects/circle-{name}.pcraft').as_posix()
    p.native('circle-'+name+'-save',p.PC,['run',(R/'frames'/source).as_posix(),'--cmd','image.crop','--params',json.dumps({'x':x,'y':390,'width':790,'height':300,'targetWidth':1000,'targetHeight':380,'resample':'lanczos','deleteCroppedPixels':True}),'--out',project])
    p.native('circle-'+name+'-render',p.PC,['convert',project,(R/f'media/circle-{name}.png').as_posix()])
