# Issue117 episode-2 continuation pilot driver.
# Product logic/scenes are the untouched pinned archive (commit 71584a6...).
# This driver sends ordinary InputEventKey to the actual GUI; game properties are read only.
# Continuation: it REQUIRES the known legitimate episode-1-cleared private save to be
# present (exact SHA256) inside the owned 117 prefix. It never fabricates progress and
# never disables the product's own existing-save guard generally.
extends SceneTree

const EXPECTED_SAVE_SHA := "f5eae6b0b22ff83476b9d9e7846ce6da6fef79f53ebf0fadfdefcf875afb1494"

var game: Node
var out_dir := ""
var active := false
var count := 0
var events: Array = []
var input_events: Array = []
var user_proof: Dictionary = {}
var started_ms := 0
var finishing := false

func _initialize() -> void:
	started_ms = Time.get_ticks_msec()
	var args := OS.get_cmdline_user_args()
	for i in args.size():
		if args[i] == "--out": out_dir = args[i+1]
	if out_dir.is_empty():
		push_error("Missing owned capture output")
		quit(2)
		return
	DirAccess.make_dir_recursive_absolute(out_dir.path_join("frames"))
	var expected := OS.get_environment("PROJECTP_CAPTURE_DATA_ROOT").simplify_path()
	var actual := OS.get_user_data_dir().simplify_path()
	var save := ProjectSettings.globalize_path("user://emberwake-campaign-1.0-jump-1.1.json").simplify_path()
	var save_sha := FileAccess.get_sha256(save) if FileAccess.file_exists(save) else ""
	user_proof = {"expected_data_root":expected,"actual_user_data_dir":actual,"actual_save_path":save,
		"xdg_data_home":OS.get_environment("XDG_DATA_HOME"),"xdg_config_home":OS.get_environment("XDG_CONFIG_HOME"),
		"xdg_cache_home":OS.get_environment("XDG_CACHE_HOME"),"save_existed_before_scene":FileAccess.file_exists(save),
		"backup_existed_before_scene":FileAccess.file_exists(save+".bak"),"save_sha256_before_scene":save_sha,
		"expected_save_sha256":EXPECTED_SAVE_SHA,"main_scene_instantiated":false}
	# The actual Godot user path must resolve inside the owned 117 prefix.
	if expected.is_empty() or not actual.begins_with(expected+"/") or not save.begins_with(expected+"/"):
		fail("Actual Godot user data path is not inside the owned prefix; main scene was not loaded")
		return
	# Continuation guard: only the known legitimate episode-1-cleared private save, by exact SHA.
	if not user_proof.save_existed_before_scene:
		fail("Continuation save absent; this episode-2 pilot requires the known private save")
		return
	if save_sha != EXPECTED_SAVE_SHA:
		fail("Continuation save SHA mismatch; refusing unknown/overwritten save")
		return
	root.content_scale_size = Vector2i(480,270)
	root.content_scale_mode = Window.CONTENT_SCALE_MODE_CANVAS_ITEMS
	root.size = Vector2i(1920,1080)
	RenderingServer.frame_post_draw.connect(save_frame)
	call_deferred("pilot")

func _process(_delta: float) -> bool:
	if not finishing and Time.get_ticks_msec()-started_ms > 90000:
		fail("Owned pilot exceeded 90s wallclock; no restart")
	return false

func save_frame() -> void:
	if not active: return
	if count >= 420:
		fail("Pilot frame bound reached")
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
	events.append(item)
	print("PROJECTP117_EVENT ",JSON.stringify(item))

func press_focused_text(text: String) -> bool:
	for i in 60:
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
	var data := {"schemaVersion":1,"status":status,"reason":reason,"mode":"ep2-pilot","episode":2,
		"sourceCommit":"71584a6bd0c8852885157de71032fd9252e7a04c","gameVersion":"0.12.0",
		"godot":Engine.get_version_info(),"owned_pid":OS.get_process_id(),"display":OS.get_environment("DISPLAY"),
		"render_size":[1920,1080],"logical_size":[480,270],"fps":30,"frame_count":count,
		"userdata_proof":user_proof,"save_exists_after":FileAccess.file_exists(save),
		"save_sha256_after":FileAccess.get_sha256(save) if FileAccess.file_exists(save) else "",
		"selected_episode_final":game.get("selected_episode") if is_instance_valid(game) else null,
		"state_final":game.get("state") if is_instance_valid(game) else null,
		"input":"Actual focused-GUI InputEventKey (TAB/ENTER) only; no start_game/dialogue/progress/player/clock calls or writes",
		"audio":"Dummy; gameplay sound is not recorded/verified",
		"clock":"PNG encoding wait is included by wallclock HUD; not RTA/PB or first-human-play evidence",
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
	# The loaded continuation profile must be episode-1 cleared, episode 1 selected.
	var completed = game.get("profile").data.completed if is_instance_valid(game) and game.get("profile") else null
	var selected_initial = game.get("selected_episode")
	user_proof.profile_completed_before_input=completed
	user_proof.selected_episode_before_input=selected_initial
	if str(completed)!="[1]" or int(selected_initial)!=1:
		fail("Loaded profile is not the expected episode-1-cleared continuation state")
		return
	event("ordinary-title")
	await frames(15)
	# Ordinary episode-2 selection through the actual title grid button "1:2".
	if not await press_focused_text("1:2"):
		fail("Could not activate the actual episode-2 (1:2) title button through focus/Enter")
		return
	await frames(10)
	event("after-episode2-select")
	if int(game.get("selected_episode"))!=2:
		fail("Episode-2 selection did not take through ordinary UI")
		return
	# Begin the episode via the ordinary story button.
	if not await press_focused_text("物語を進める"):
		fail("Could not activate actual title start button through focus/Enter")
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
	if game.get("state")!="play" or int(game.get("selected_episode"))!=2:
		fail("Normal title/conversation input did not reach episode-2 play")
		return
	event("ordinary-depart-play")
	while count<300: await frames(1)
	active=false
	finishing=true
	receipt("PASS_PILOT_PENDING_ROOT_VISUAL_REVIEW","Ordinary title to episode-2 select to conversation to depart only; no route/dash/merge/result claim yet")
	print("PROJECTP117_PILOT_COMPLETE frames=",count)
	quit(0)
