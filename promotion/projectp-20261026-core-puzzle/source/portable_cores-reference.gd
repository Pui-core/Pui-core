class_name EmberPortableCores
extends RefCounted

# Identity is the array index, never a second saved ID. Only these permanent
# floors can receive a dropped core; arrangements and growth stones cannot.
const FIXED := [
	[24,1160,161,24], [180,1198,410,18], [380,1016,240,24],
	[900,1016,150,24], [610,1100,480,18], [560,1064,70,18], [500,836,140,24],
	[500,800,120,18], [60,760,160,24], [90,900,410,18], [450,864,60,18], [490,828,60,18],
	[40,584,100,20], [150,548,100,18], [260,512,100,18], [360,476,160,28],
	[220,812,64,12], [290,856,64,12],
]
const HOMES := [Vector2(115,1160),Vector2(540,1016),Vector2(520,800)]
# x, feet y, matching identity. Both C sockets and both stone groups have 3 cuts.
const SOCKETS := [[145,1160,0],[575,1016,1],[946,1016,1],[560,800,2],[85,760,2]]
const RECOVERY := Rect2(920,1060,70,12)
var host: EmberBelfryWorld
var cores: Array = homes()
var actor_position := Vector2.ZERO
var actor_facing := 1
var actor_visible := false
var rejected := 0.0
var feedback := 0.0

static func homes() -> Array:
	var result: Array=[]
	for at in HOMES: result.append({"place":"ground","at":[int(at.x),int(at.y)]})
	return result

static func integer(value: Variant) -> bool:
	return (value is int or value is float) and is_finite(float(value)) and float(value)==floorf(float(value))

static func safe_floor(at: Vector2) -> bool:
	for raw in FIXED:
		if at.y==raw[1] and at.x>=raw[0]+6 and at.x<=raw[0]+raw[2]-6: return true
	return false

static func valid(value: Variant, passed_hearths: int) -> bool:
	if not value is Array or value.size()!=3: return false
	var held:=0
	var occupied: Array=[]
	var ground: Array[Vector2]=[]
	for i in 3:
		var item=value[i]
		if not item is Dictionary: return false
		match item.get("place",""):
			"ground":
				if item.size()!=2 or not item.get("at") is Array or item.at.size()!=2: return false
				if not integer(item.at[0]) or not integer(item.at[1]): return false
				var at:=Vector2(item.at[0],item.at[1])
				if not safe_floor(at): return false
				# Corrupt but syntactically valid saves cannot strand a required core
				# above the very route it powers. Passed rooms can carry their relic up.
				if (i==0 and passed_hearths==0 and at.y<1160) or (i==1 and passed_hearths<2 and at.y<1016) or (i==2 and at.y<760): return false
				for other in ground:
					if at.distance_to(other)<18: return false
				ground.append(at)
			"carried":
				if item.size()!=1: return false
				held+=1
			"socket":
				if item.size()!=2 or not integer(item.get("socket")): return false
				var socket:=int(item.socket)
				if socket<0 or socket>=SOCKETS.size() or SOCKETS[socket][2]!=i or occupied.has(socket): return false
				occupied.append(socket)
			_: return false
	if held>1: return false
	for socket in occupied:
		var at:=Vector2(SOCKETS[socket][0],SOCKETS[socket][1])
		for other in ground:
			if at.distance_to(other)<18: return false
	return true

static func bits_for(value: Array) -> Array:
	var result: Array=[0,0,0,0]
	for i in 3:
		if value[i].place!="socket": continue
		if i<2: result[i]=1
		else:
			result[2]=1
			result[3]=1 if int(value[i].socket)==4 else 0
	return result

func reset() -> void:
	cores=homes()
	rejected=0
	feedback=0
	actor_visible=false

func carried() -> int:
	for i in cores.size():
		if cores[i].place=="carried": return i
	return -1

func far_recovery(value: Array) -> bool:
	return value[1].place=="socket" and int(value[1].socket)==2

func targets() -> Array:
	var result: Array=[]
	for i in cores.size():
		if cores[i].place=="ground": result.append({"kind":"core","index":i,"position":Vector2(cores[i].at[0],cores[i].at[1])})
	for i in SOCKETS.size(): result.append({"kind":"socket","index":i,"position":Vector2(SOCKETS[i][0],SOCKETS[i][1])})
	return result

func fallback(at: Vector2) -> Dictionary:
	# Keep the action visible even when a drop is unsafe; failure preserves carry.
	if carried()<0: return {}
	return {"kind":"core_drop","index":carried(),"position":at}

func release_carried(actor: Rect2) -> bool:
	var held:=carried()
	if held<0: return false
	var feet:=Vector2(roundf(actor.get_center().x),roundf(actor.end.y))
	if absf(feet.y-actor.end.y)>0.25: return refuse()
	# The explicit action bypasses context selection, never floor/identity rules.
	# Prefer a visible spot in front, then find a free integer spot on this floor.
	for raw in FIXED:
		if feet.y!=raw[1] or feet.x<raw[0]+6 or feet.x>raw[0]+raw[2]-6: continue
		var offsets: Array=[actor_facing*20,-actor_facing*20]
		for distance in 49:
			offsets.append(distance*actor_facing)
			if distance>0: offsets.append(-distance*actor_facing)
		for offset in offsets:
			var at:=feet+Vector2(offset,0)
			if at.x<raw[0]+6 or at.x>raw[0]+raw[2]-6: continue
			var clear:=true
			for socket in SOCKETS:
				if at.distance_to(Vector2(socket[0],socket[1]))<18: clear=false
			if not clear: continue
			var next:=cores.duplicate(true)
			next[held]={"place":"ground","at":[int(at.x),int(at.y)]}
			if not valid(next,host.hearth_lit.size()): continue
			# Carried -> ground has the same derived arrangement, so no new stone
			# can materialize and no checkpoint or installed core changes here.
			cores=next
			host.update_gates()
			feedback=0.5
			host.burst(at+Vector2(0,-12),EmberWorld.AMBER,8)
			return true
	return refuse()

func operate(target: Dictionary, actor: Rect2) -> bool:
	var next: Array=cores.duplicate(true)
	var held:=carried()
	var index: int=target.get("index",-1)
	match target.get("kind",""):
		"core":
			if held>=0 or index<0 or index>=3 or cores[index].place!="ground": return refuse()
			next[index]={"place":"carried"}
		"socket":
			if index<0 or index>=SOCKETS.size(): return refuse()
			var identity: int=SOCKETS[index][2]
			if held>=0:
				if held!=identity: return refuse()
				next[held]={"place":"socket","socket":index}
			else:
				if cores[identity].place!="socket" or int(cores[identity].socket)!=index: return refuse()
				next[identity]={"place":"carried"}
		"core_drop":
			if held<0: return refuse()
			var feet:=Vector2(roundf(actor.get_center().x),roundf(actor.end.y))
			if absf(feet.y-actor.end.y)>0.25 or not safe_floor(feet): return refuse()
			next[held]={"place":"ground","at":[int(feet.x),int(feet.y)]}
		_: return false
	if not valid(next,host.hearth_lit.size()): return refuse()
	var bits:=bits_for(next)
	for group in 4:
		if bits[group]==host.configurations[group]: continue
		for rect in host.stone_rects[group][bits[group]]:
			if rect.intersects(actor.grow(0.25)): return refuse()
	if far_recovery(next) and not far_recovery(cores) and RECOVERY.intersects(actor.grow(0.25)): return refuse()
	cores=next
	host.update_gates()
	feedback=0.5
	host.burst(target.position+Vector2(0,-12),EmberWorld.AMBER,8)
	return true

func refuse() -> bool:
	rejected=0.6
	return false

func tick(delta: float) -> void:
	rejected=maxf(0,rejected-delta)
	feedback=maxf(0,feedback-delta)

func draw_core(at: Vector2, identity: int, filled: bool) -> void:
	var color:=EmberWorld.AMBER if filled else EmberWorld.MINT
	var rect:=Rect2(at+Vector2(-6,-19),Vector2(12,12))
	host.draw_rect(rect.grow(2),Color("294951"))
	host.draw_rect(rect,color,filled,-1.0 if filled else 1.0)
	if filled:
		host.draw_rect(Rect2(rect.position,Vector2(12,2)),Color("fff0ba"))
		host.draw_rect(Rect2(rect.position+Vector2(10,2),Vector2(2,10)),Color("9d7547"))
		host.draw_rect(rect.grow(-3),Color("d5924f"))
		host.draw_rect(Rect2(rect.position+Vector2(4,3),Vector2(4,5)),Color("fff0ba"))
	else:
		host.draw_rect(rect.grow(-2),Color("142d37"))
		host.draw_line(rect.position+Vector2(2,2),rect.position+Vector2(2,9),Color("426867"),1)
	for k in identity+1:
		host.draw_line(at+Vector2(-3+k*3,-24),at+Vector2(-3+k*3,-20),color,1.0)

func draw() -> void:
	for i in SOCKETS.size():
		var raw: Array=SOCKETS[i]
		var at:=Vector2(raw[0],raw[1])
		var identity: int=raw[2]
		var installed: bool=cores[identity].place=="socket" and int(cores[identity].socket)==i
		host.draw_rect(Rect2(at+Vector2(-10,-5),Vector2(20,5)),Color("7d9b8a"))
		host.draw_rect(Rect2(at+Vector2(-9,-23),Vector2(18,19)),Color("36575b"))
		host.draw_line(at+Vector2(-9,-23),at+Vector2(8,-23),Color("9eb3a2"),1)
		host.draw_rect(Rect2(at+Vector2(-9,-22),Vector2(2,16)),Color("668980"))
		host.draw_rect(Rect2(at+Vector2(7,-21),Vector2(2,16)),Color("182f3a"))
		draw_core(at,identity,installed)
		# Permanent engraved connections show the destination before installation.
		# B's remote socket is outside the near view: its line continues rightward.
		var groups: Array=[identity] if identity<2 else ([2,3] if i==4 else [2])
		for group in groups:
			var target: Rect2=host.stone_rects[group][1][0]
			var end:=target.get_center()+Vector2(0,-8)
			if identity==1: end=Vector2(760,1000) if i==1 else Vector2(862,966)
			for k in 30:
				var point: Vector2=(at+Vector2(0,-13)).lerp(end,k/30.0)
				host.draw_rect(Rect2(point.floor(),Vector2.ONE),Color(0.8,0.76,0.5,0.26+feedback*0.3))
	for i in cores.size():
		if cores[i].place=="ground": draw_core(Vector2(cores[i].at[0],cores[i].at[1]),i,true)
	var held:=carried()
	if held>=0 and actor_visible:
		draw_core((actor_position+Vector2(actor_facing*14,5)).floor(),held,true)
	if rejected>0 and actor_visible:
		var p:=actor_position+Vector2(0,-30)
		host.draw_line(p-Vector2(3,3),p+Vector2(3,3),EmberWorld.MINT)
		host.draw_line(p+Vector2(-3,3),p+Vector2(3,-3),EmberWorld.MINT)
