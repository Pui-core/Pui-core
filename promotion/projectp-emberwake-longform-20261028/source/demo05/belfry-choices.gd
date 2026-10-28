# Finite editorial comparison. Extends the unchanged ordinary-key route.
# All observations read actual state; only normal E/Q/arrow/space input acts.
extends "res://tests/belfry_route.gd"

func mark(label_value: String) -> void:
	if observer.is_valid(): await observer.call(label_value)

func play() -> bool:
	await frames(4)
	if not await operate(115): return false
	if not await operate(145): return false
	if not await stones(0): return false
	if not await hop(game.world.fixed_rects[2],"A exit"): return false
	if not await operate(430): return false
	if not await operate(540): return false
	# Try the visible near socket first, then actually retrieve B to restore
	# the flat crossing. This is a recorded deliberate comparison, not a
	# reconstructed human mistake or an assertion of being softlocked.
	if not await operate(575): return false
	await mark("B-near-socket-installed")
	await frames(60)
	if not await operate(575): return false
	await mark("B-retrieved-flat-crossing-restored")
	await frames(30)
	for rect in game.world.stone_rects[1][0]:
		if not await hop(rect,"B carry crossing"): return false
		if rect.position.x==760:
			await mark("B-changing-floor-drop-before")
			key(KEY_Q,true)
			await frames(1)
			key(KEY_Q,false)
			await frames(8)
			await mark("B-changing-floor-drop-after")
			if game.world.portable.carried()!=1:
				failed="Changing-floor Q did not preserve the carried B core"
				return false
			await frames(45)
	if not await hop(game.world.fixed_rects[3],"B far island"): return false
	if not await operate(946): return false
	if not await stones(1): return false
	if not await hop(Rect2(500,836,140,24),"B exit"): return false
	if not await operate(560): return false
	if not await hop(Rect2(500,800,120,18),"C near island"): return false
	if not await operate(520): return false
	# The near C socket changes the stair group but does not lift its separate
	# receiver. Read actual configurations and remove the same C core again.
	if not await operate(560): return false
	await mark("C-near-socket-stairs-only")
	await frames(60)
	if not await operate(560): return false
	await mark("C-retrieved-before-far-crossing")
	if not await stones(2): return false
	if not await hop(Rect2(60,760,160,24),"C far island"): return false
	if not await operate(85): return false
	await mark("C-far-socket-stairs-and-receiver")
	await frames(45)
	if not await hop(Rect2(220,812,64,12),"C descent1"): return false
	if not await hop(Rect2(290,856,64,12),"C descent2"): return false
	if not await walk(390): return false
	await frames(25)
	if absf(game.player.position.y-900)>1:
		failed="C actual receiving floor missing"
		return false
	if not await walk(470): return false
	if not await hop(Rect2(450,864,60,18),"C return1"): return false
	if not await hop(Rect2(490,828,60,18),"C return2"): return false
	if not await hop(Rect2(500,800,120,18),"C return near"): return false
	if not await stones(2): return false
	if not await stones(3): return false
	if not await hop(Rect2(40,584,100,20),"C exit"): return false
	if not await walk(90): return false
	if not await hop(Rect2(150,548,100,18),"summit1"): return false
	if not await hop(Rect2(260,512,100,18),"summit2"): return false
	if not await hop(Rect2(360,476,160,28),"summit"): return false
	if not await operate(430): return false
	return game.state=="result"
