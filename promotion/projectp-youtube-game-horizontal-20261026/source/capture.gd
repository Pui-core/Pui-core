# External production capture. Product logic/scenes are the untouched pinned archive.
# This driver sends ordinary InputEventKey to the actual GUI; game properties are read only.
extends SceneTree

var game: Node
var out_dir := ""
var active := false
var count := 0
var events: Array = []
var input_events: Array = []
var user_proof: Dictionary = {}
var started_ms := 0
var finishing := false
var mode := "pilot"
var axis := 0

func _initialize() -> void:
	started_ms = Time.get_ticks_msec()
	var args := OS.get_cmdline_user_args()
	for i in args.size():
		if args[i] == "--out": out_dir = args[i+1]
		if args[i] == "--mode": mode = args[i+1]
	if mode not in ["pilot","full"]:
		push_error("Unknown capture mode")
		quit(2)
		return
	if out_dir.is_empty():
		push_error("Missing owned capture output")
		quit(2)
		return
	DirAccess.make_dir_recursive_absolute(out_dir.path_join("frames"))
	var expected := OS.get_environment("PROJECTP_CAPTURE_DATA_ROOT").simplify_path()
	var actual := OS.get_user_data_dir().simplify_path()
	var save := ProjectSettings.globalize_path("user://emberwake-campaign-1.0-jump-1.1.json").simplify_path()
	user_proof = {"expected_data_root":expected,"actual_user_data_dir":actual,"actual_save_path":save,
		"xdg_data_home":OS.get_environment("XDG_DATA_HOME"),"xdg_config_home":OS.get_environment("XDG_CONFIG_HOME"),
		"xdg_cache_home":OS.get_environment("XDG_CACHE_HOME"),"save_existed_before_scene":FileAccess.file_exists(save),
		"backup_existed_before_scene":FileAccess.file_exists(save+".bak"),"main_scene_instantiated":false}
	if expected.is_empty() or not actual.begins_with(expected+"/") or not save.begins_with(expected+"/"):
		fail("Actual Godot user data path is not inside the owned prefix; main scene was not loaded")
		return
	if user_proof.save_existed_before_scene or user_proof.backup_existed_before_scene:
		fail("Capture profile is not fresh; main scene was not loaded")
		return
	root.content_scale_size = Vector2i(480,270)
	root.content_scale_mode = Window.CONTENT_SCALE_MODE_CANVAS_ITEMS
	root.size = Vector2i(1920,1080)
	RenderingServer.frame_post_draw.connect(save_frame)
	call_deferred("pilot")

func _process(_delta: float) -> bool:
	if not finishing and Time.get_ticks_msec()-started_ms > (90000 if mode=="pilot" else 720000):
		fail("Owned capture wallclock bound reached; no automatic restart")
	return false

func save_frame() -> void:
	if not active: return
	if count >= (420 if mode=="pilot" else 5000):
		fail("Capture frame bound reached")
		return
	var image := root.get_texture().get_image()
	if image.get_size()!=Vector2i(1920,1080):
		fail("Unexpected native viewport size")
		return
	var error := image.save_png(out_dir.path_join("frames/frame-%06d.png" % count))
	if error!=OK:
		fail("Actual viewport PNG save failed")
		return
	count+=1

func frames(number: int) -> void:
	for i in number:
		await physics_frame
		await process_frame

func key(code: Key, pressed: bool) -> void:
	var input := InputEventKey.new()
	input.keycode=code
	input.physical_keycode=code
	input.pressed=pressed
	input_events.append({"frame":count,"key":OS.get_keycode_string(code),"pressed":pressed})
	Input.parse_input_event(input)

func tap(code: Key) -> void:
	key(code,true)
	await frames(2)
	key(code,false)
	await frames(3)

func buttons(node: Node, result: Array) -> void:
	if node is Button and node.is_visible_in_tree():
		result.append({"text":node.text,"disabled":node.disabled,"focus":node.has_focus(),"path":str(node.get_path())})
	for child in node.get_children(): buttons(child,result)

func labels(node: Node, result: Array) -> void:
	if node is Label and node.is_visible_in_tree() and not node.text.is_empty(): result.append(node.text)
	for child in node.get_children(): labels(child,result)

func event(label_value: String) -> void:
	var focused := root.gui_get_focus_owner()
	var visible_buttons: Array=[]
	var visible_labels: Array=[]
	if is_instance_valid(game):
		buttons(game,visible_buttons)
		labels(game,visible_labels)
	var item := {"label":label_value,"frame":count,"seconds_at30fps":count/30.0,
		"wall_ms":Time.get_ticks_msec()-started_ms,"focused":focused.text if focused is Button else "",
		"buttons":visible_buttons,"labels":visible_labels}
	if is_instance_valid(game):
		item.state=game.get("state")
		item.selected_episode=game.get("selected_episode")
		item.story_page=game.get("story_page")
		item.player_position=[game.player.position.x,game.player.position.y]
		item.player_velocity=[game.player.velocity.x,game.player.velocity.y]
		item.hearths=game.world.hearth_lit.duplicate()
		item.switches=game.world.switch_lit.duplicate()
		item.collected=game.world.collected.duplicate()
		item.completed=game.profile.data.completed.duplicate()
		item.falls=game.falls
	events.append(item)
	print("PROJECTP112_EVENT ",JSON.stringify(item))

func press_focused_text(text: String) -> bool:
	for i in 45:
		var focused := root.gui_get_focus_owner()
		if focused is Button and focused.is_visible_in_tree() and not focused.disabled and focused.text==text:
			event("before-button-"+text)
			await tap(KEY_ENTER)
			event("after-button-"+text)
			return true
		await tap(KEY_TAB)
	event("button-not-focused-"+text)
	return false

func receipt(status: String, reason: String) -> void:
	var save := str(user_proof.get("actual_save_path",""))
	var data := {"schemaVersion":1,"status":status,"reason":reason,"mode":mode,
		"sourceCommit":"71584a6bd0c8852885157de71032fd9252e7a04c","gameVersion":"0.12.0",
		"godot":Engine.get_version_info(),"owned_pid":OS.get_process_id(),"display":OS.get_environment("DISPLAY"),
		"render_size":[1920,1080],"logical_size":[480,270],"fps":30,"frame_count":count,
		"userdata_proof":user_proof,"save_exists_after":FileAccess.file_exists(save),
		"input":"Actual focusedGUI InputEventKey only; no start_game/dialogue/progress/player/clock calls or writes",
		"audio":"Dummy; gameplay sound is not recorded/verified",
		"clock":"PNG encoding wait is included by wallclockHUD; not RTA/PB or firsthumanplay evidence",
		"events":events,"input_events":input_events}
	var file := FileAccess.open(out_dir.path_join("capture.json"),FileAccess.WRITE)
	if file: file.store_string(JSON.stringify(data,"  ")+"\n")

func fail(reason: String) -> void:
	if finishing: return
	finishing=true
	active=false
	receipt("FAIL",reason)
	push_error(reason)
	quit(1)

func pilot() -> void:
	if finishing: return
	var scene := str(ProjectSettings.get_setting("application/run/main_scene"))
	if scene!="res://scenes/campaign.tscn":
		fail("Unexpected pinned product main scene")
		return
	game=load(scene).instantiate()
	root.add_child(game)
	user_proof.main_scene_instantiated=true
	await frames(8)
	active=true
	event("ordinary-title")
	await frames(15)
	if not await press_focused_text("物語を進める"):
		fail("Could not activate actual title button through focus/Enter")
		return
	for page in 8:
		if game.get("state")=="play": break
		event("actual-intro-page")
		await frames(40)
		var focused := root.gui_get_focus_owner()
		if not focused is Button or focused.text not in ["次へ","出発"]:
			fail("Actual story next/depart button is not focused")
			return
		var text: String=focused.text
		if not await press_focused_text(text):
			fail("Could not activate actual story button")
			return
	if game.get("state")!="play":
		fail("Normal title/conversation input did not reach play")
		return
	event("ordinary-depart-play")
	if mode=="full":
		await full_episode()
		return
	while count<300: await frames(1)
	active=false
	finishing=true
	receipt("PASS_PILOT_PENDING_ROOT_VISUAL_REVIEW","Ordinary title/story/depart only; no route or firstforgetting claim yet")
	print("PROJECTP112_PILOT_COMPLETE frames=",count)
	quit(0)

# Geometry and state are observed, never written. Motion is generated only by
# normal held keys and the product's unmodified physics/collision system.
func move(direction: int) -> void:
	if axis==direction: return
	axis=direction
	key(KEY_LEFT,direction<0)
	key(KEY_RIGHT,direction>0)

func walk(destination: float) -> bool:
	for i in 500:
		if finishing or game.state!="play": return false
		var distance: float=destination-game.player.position.x
		if absf(distance)<3:
			move(0)
			await frames(7)
			return absf(destination-game.player.position.x)<8
		move(1 if distance>0 else -1)
		await frames(1)
	move(0)
	event("walk-timeout")
	return false

func hop(target: Rect2) -> bool:
	var current: Rect2
	for rect in game.world.platforms:
		if absf(rect.position.y-game.player.position.y)<2 and game.player.position.x>=rect.position.x-5 and game.player.position.x<=rect.end.x+5:
			current=rect
	if current.size==Vector2.ZERO:
		event("no-starting-floor")
		return false
	var direction := 1 if target.get_center().x>current.get_center().x else -1
	var overlap := minf(current.end.x,target.end.x)-maxf(current.position.x,target.position.x)
	var destination := target.position.x+22 if direction>0 else target.end.x-22
	var launch := current.end.x-13 if direction>0 else current.position.x+13
	if overlap>28:
		destination=clampf(game.player.position.x,maxf(current.position.x,target.position.x)+14,minf(current.end.x,target.end.x)-14)
		launch=destination
	if not await walk(launch): return false
	move(direction if absf(destination-game.player.position.x)>5 else 0)
	key(KEY_SPACE,true)
	event("ordinary-jump-start")
	for i in 100:
		if finishing: return false
		if i==24: key(KEY_SPACE,false)
		if absf(destination-game.player.position.x)<3: move(0)
		await frames(1)
		if i>10 and game.player.is_on_floor() and game.player.velocity.y>=0:
			key(KEY_SPACE,false)
			move(0)
			await frames(7)
			var good: bool=absf(game.player.position.y-target.position.y)<1 and game.player.position.x>=target.position.x-3 and game.player.position.x<=target.end.x+3
			event("ordinary-jump-landed" if good else "ordinary-jump-missed")
			return good
	key(KEY_SPACE,false)
	move(0)
	event("ordinary-jump-timeout")
	return false

func operate(at: Vector2, label_value: String) -> bool:
	if not await walk(at.x): return false
	event("before-"+label_value)
	await tap(KEY_E)
	event("after-"+label_value)
	await frames(36)
	return true

func full_episode() -> void:
	await frames(45)
	var stage: Dictionary=game.episode.duplicate(true)
	if game.selected_episode!=1:
		fail("Ordinary menu did not select episode1")
		return
	for i in stage.route.size():
		if not await hop(stage.route[i]):
			fail("Real route jump failed at landing "+str(i)+"; attempt preserved")
			return
		if i%4==3:
			var hearth_index: int=i/4
			if not await operate(stage.hearths[hearth_index],"hearth-"+str(hearth_index+1)):
				fail("Could not reach actual hearth interaction")
				return
			if hearth_index<2:
				if not await operate(stage.switches[hearth_index],"switch-"+str(hearth_index+1)):
					fail("Could not reach actual switch interaction")
					return
	move(0)
	key(KEY_SPACE,false)
	if game.world.hearth_lit!=[0,1,2] or game.state!="result":
		fail("Normal inputs did not reach actual three-hearth result")
		return
	event("actual-result")
	await frames(180)
	if not await press_focused_text("話を選ぶ"):
		fail("Could not return via actual result button")
		return
	event("actual-title-after-result")
	await frames(90)
	if not await press_focused_text("手帳"):
		fail("Could not open actual journal through GUI")
		return
	for page in 4:
		if game.state!="story": break
		event("actual-journal-page")
		await frames(180)
		var focused := root.gui_get_focus_owner()
		if not focused is Button or focused.text not in ["次へ","閉じる"]:
			fail("Actual journal next/close button not focused")
			return
		var text: String=focused.text
		if not await press_focused_text(text):
			fail("Could not activate actual journal button")
			return
	await frames(45)
	event("actual-final-title")
	active=false
	finishing=true
	receipt("PASS_FULL_CAPTURE_PENDING_VIDEO_REVIEW","Normal title/story/physics keys/three-hearth result/title/journal; automated capture, not a human or RTA claim")
	print("PROJECTP112_FULL_COMPLETE frames=",count)
	quit(0)
