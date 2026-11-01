from run import *
sys.stdin.reconfigure(encoding='utf-8')
j=json.load(sys.stdin)
r=run(j['name'],j['args'],j['timeout'],j.get('input'))
