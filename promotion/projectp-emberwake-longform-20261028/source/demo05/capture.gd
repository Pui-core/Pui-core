# ProjectP #127 / demo05. Dedicated rendered capture of unchanged demo gameplay.
# Game launch/course selection is explicit test setup; route actions are ordinary
# InputEventKey from the product's existing known-route controller. No actor,
# puzzle, timer or collision state is written by this recording driver.
extends SceneTree

var game: Node
var driver: RefCounted
var directory := ""
var course := 1
var variant := "main"
var maximum_frames := 6000
var frame_count := 0
var draw_count := 0
var active := false
var ending := false
var started_ms := 0
var events: Array = []
var captured: Array = []

func _initialize() -> void:
	started_ms = Time.get_ticks_msec()
	var args := OS.get_cmdline_user_args()
	for i in args.size():
		if i+1 >= args.size(): continue
		match args[i]:
			"--capture-root": directory = args[i+1]
			"--course": course = int(args[i+1])
			"--case": variant = args[i+1]
			"--max-frames": maximum_frames = int(args[i+1])
	if directory.is_empty() or course < 1 or course > 5 or maximum_frames < 60 or maximum_frames > 9000:
		push_error("Explicit owned output, course1..5, bounded frames required")
		quit(2)
		return
	root.content_scale_size = Vector2i(480,270)
	root.content_scale_mode = Window.CONTENT_SCALE_MODE_CANVAS_ITEMS
	root.size = Vector2i(1920,1080)
	RenderingServer.frame_post_draw.connect(capture_frame)
	call_deferred("record")

func _process(_delta: float) -> bool:
	if not ending and Time.get_ticks_msec()-started_ms > 700000:
		finish(false,"Internal wall limit")
	return false

func snapshot(label_value: String) -> void:
	var item := {"label":label_value,"captureFrame":frame_count,"physicsFrame":Engine.get_physics_frames(),"drawn":Engine.get_frames_drawn()}
	if is_instance_valid(game):
		item.state = game.state
		item.falls = game.falls
		item.position = [game.player.position.x,game.player.position.y]
		item.velocity = [game.player.velocity.x,game.player.velocity.y]
		item.hearths = game.world.hearth_lit.duplicate()
		item.collected = game.world.collected.duplicate()
		item.configurations = game.world.configurations.duplicate()
		if course in [1,4,5]: item.coreLocations = game.world.portable.cores.duplicate(true)
		if course == 2: item.ferryPhase = game.world.phase_ticks
	events.append(item)
	print("DEMO05_EVENT ",JSON.stringify(item))

func capture_frame() -> void:
	if not active or ending: return
	draw_count += 1
	# Product physics and known input routes run at 60 Hz; store every second
	# actually rendered frame, retaining a truthful 30fps source timeline.
	if draw_count % 2 != 0: return
	if frame_count >= maximum_frames:
		finish(false,"Frame limit; partial recording preserved")
		return
	var screen := root.get_texture().get_image()
	if screen.get_size() != Vector2i(1920,1080):
		finish(false,"Unexpected viewport dimensions")
		return
	var name := "frame-%06d.png" % frame_count
	if screen.save_png(directory.path_join(name)) != OK:
		finish(false,"PNG save failed")
		return
	captured.append({"file":name,"physicsFrame":Engine.get_physics_frames(),"drawn":Engine.get_frames_drawn()})
	frame_count += 1

func finish(ok: bool, reason: String) -> void:
	if ending: return
	ending = true
	active = false
	snapshot("recording-finished")
	var result := {"schemaVersion":1,"status":"RECORDED_PENDING_VISUAL_REVIEW" if ok else "FAILED_PRESERVED","reason":reason,"ownedPid":OS.get_process_id(),"course":course,"variant":variant,"productMode":"Original five-course demo bundled with EMBERWAKE0.12.0, not the fifteen-episode campaign","renderSize":[1920,1080],"physicsFps":60,"captureFps":30,"frameCount":frame_count,"duration":frame_count/30.0,"gameAudioRecorded":false,"inputMethod":"Explicit fresh development-course start followed by known-route ordinary InputEventKey; not a human first play or RTA","events":events,"frames":captured,"routeTrace":driver.trace if is_instance_valid(driver) else [],"routeFailure":driver.failed if is_instance_valid(driver) else ""}
	var file := FileAccess.open(directory.path_join("capture.json"),FileAccess.WRITE)
	if file == null:
		push_error("Cannot save recording receipt")
		quit(2)
		return
	file.store_string(JSON.stringify(result,"  ")+"\n")
	file.close()
	print("DEMO05_DONE ",JSON.stringify(result.duplicate().merged({"frames":[],"events":[],"routeTrace":[]},true)))
	quit(0 if ok else 2)

func record() -> void:
	var expected := OS.get_environment("PROJECTP_DEMO05_DATA_ROOT").simplify_path()
	if expected.is_empty() or not OS.get_user_data_dir().simplify_path().begins_with(expected+"/"):
		finish(false,"Dedicated XDG user data is required")
		return
	DirAccess.make_dir_recursive_absolute(directory)
	game = load("res://scenes/main.tscn").instantiate()
	for save in game.all_stores():
		save.path = "user://projectp-demo05-%d.json" % save.episode_id
		save.legacy_path = save.path+".absent"
		save.previous_course_path = save.path+".absent-course"
		save.legacy_jump_path = save.path+".absent-jump"
	root.add_child(game)
	await process_frame
	game.audio.set_muted(true)
	game.start_game("practice",false,course)
	var controller := "res://tests/belfry_route.gd"
	if course == 1 and variant == "choices": controller = get_script().resource_path.get_base_dir().path_join("belfry-choices.gd")
	if course in [2,3]: controller = "res://tests/chapters_route.gd"
	if course == 4: controller = "res://tests/aqueduct_route.gd"
	if course == 5: controller = "res://tests/dawn_route.gd"
	driver = load(controller).new(self,game)
	driver.observer = func(label_value): snapshot(label_value)
	active = true
	snapshot("fresh-course-start")
	await driver.frames(30)
	var ok := false
	match course:
		1: ok = await driver.play()
		2:
			if variant == "ferry":
				ok = await driver.board_ferry()
				if ok:
					snapshot("actual-ferry-boarded")
					ok = await driver.exit_ferry()
				if ok:
					snapshot("actual-ferry-rejoined")
					ok = await driver.wind_middle()
				if ok: ok = await driver.wind_finish(false)
			else: ok = await driver.play_wind(variant == "growth")
		3: ok = await driver.play_moon(variant == "growth")
		4: ok = await driver.play(variant == "well")
		5: ok = await driver.play(variant == "exposed")
	if not ok:
		finish(false,"Known route failed: "+driver.failed)
		return
	snapshot("actual-route-result")
	await driver.frames(45)
	finish(game.state == "result","Known-key selected demo course complete")
