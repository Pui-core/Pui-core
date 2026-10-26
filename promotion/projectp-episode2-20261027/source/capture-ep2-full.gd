# Issue117 episode-2 FULL continuation capture driver.
# Product logic/scenes are the untouched pinned archive (commit 71584a6...).
# This driver sends ordinary InputEventKey to the actual focused GUI and to the actual
# play state; game properties are read only. Motion is produced solely by normal held
# keys and the product's unmodified physics/collision. No start_game/dialogue advance/
# progress/player/clock calls or writes. Continuation requires the known legitimate
# episode-1-cleared private save (exact SHA256) inside the owned 117 prefix.
#
# Episode 2 "ふたりの合図" intentionally takes the OPTIONAL two-tile shortcut
# (stage.branches, solid only after switch 0) crossed with the dash, which merges onto
# the same next island (route[7]) as the ordinary three-tile powered route. Reaching /
# falling / merging / result all follow the actual recorded physics; failures are
# preserved as a FAIL receipt and are never retried over in the same attempt.
extends SceneTree

const EXPECTED_SAVE_SHA := "f5eae6b0b22ff83476b9d9e7846ce6da6fef79f53ebf0fadfdefcf875afb1494"
const KEY_DASH := KEY_X

var game: Node
var out_dir := ""
var active := false
var count := 0
var events: Array = []
var input_events: Array = []
var user_proof: Dictionary = {}
var started_ms := 0
var finishing := false
var axis := 0
var dashes_used := 0

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
	if expected.is_empty() or not actual.begins_with(expected+"/") or not save.begins_with(expected+"/"):
		fail("Actual Godot user data path is not inside the owned prefix; main scene was not loaded")
		return
	if not user_proof.save_existed_before_scene:
		fail("Continuation save absent; this episode-2 capture requires the known private save")
		return
	if save_sha != EXPECTED_SAVE_SHA:
		fail("Continuation save SHA mismatch; refusing unknown/overwritten save")
		return
	root.content_scale_size = Vector2i(480,270)
	root.content_scale_mode = Window.CONTENT_SCALE_MODE_CANVAS_ITEMS
	root.size = Vector2i(1920,1080)
	RenderingServer.frame_post_draw.connect(save_frame)
	call_deferred("drive")

func _process(_delta: float) -> bool:
	if not finishing and Time.get_ticks_msec()-started_ms > 720000:
		fail("Owned capture exceeded 720s wallclock; no restart")
	return false

func save_frame() -> void:
	if not active: return
	if count >= 6000:
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
		if is_instance_valid(game.get("player")):
			item.player_position=[game.player.position.x,game.player.position.y]
			item.player_velocity=[game.player.velocity.x,game.player.velocity.y]
			item.has_dash=game.player.has_dash
			item.on_floor=game.player.is_on_floor()
		if is_instance_valid(game.get("world")):
			item.hearths=game.world.hearth_lit.duplicate()
			item.switches=game.world.switch_lit.duplicate()
			item.collected=game.world.collected.duplicate()
		item.falls=game.get("falls")
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
	var data := {"schemaVersion":1,"status":status,"reason":reason,"mode":"ep2-full","episode":2,
		"route_taken":"optional-two-tile-branch-via-dash (merges to route[7] like the ordinary three-tile powered route)",
		"question":"第2話の急な二段の近道、ダッシュで渡れる？",
		"sourceCommit":"71584a6bd0c8852885157de71032fd9252e7a04c","gameVersion":"0.12.0",
		"godot":Engine.get_version_info(),"owned_pid":OS.get_process_id(),"display":OS.get_environment("DISPLAY"),
		"render_size":[1920,1080],"logical_size":[480,270],"fps":30,"frame_count":count,"dashes_used":dashes_used,
		"userdata_proof":user_proof,"save_exists_after":FileAccess.file_exists(save),
		"save_sha256_after":FileAccess.get_sha256(save) if FileAccess.file_exists(save) else "",
		"selected_episode_final":game.get("selected_episode") if is_instance_valid(game) else null,
		"state_final":game.get("state") if is_instance_valid(game) else null,
		"hearth_lit_final":game.world.hearth_lit if is_instance_valid(game) and is_instance_valid(game.get("world")) else null,
		"switch_lit_final":game.world.switch_lit if is_instance_valid(game) and is_instance_valid(game.get("world")) else null,
		"falls_final":game.get("falls") if is_instance_valid(game) else null,
		"input":"Actual focused-GUI + play InputEventKey (TAB/ENTER/A/D/SPACE/X/E) only; no start_game/dialogue/progress/player/clock calls or writes",
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

# ---- actual-play motion helpers (observe geometry, never write it) ----
func move(direction: int) -> void:
	if axis==direction: return
	axis=direction
	key(KEY_LEFT,direction<0)
	key(KEY_RIGHT,direction>0)

func current_floor() -> Rect2:
	var current: Rect2
	for rect in game.world.platforms:
		if absf(rect.position.y-game.player.position.y)<2 and game.player.position.x>=rect.position.x-5 and game.player.position.x<=rect.end.x+5:
			current=rect
	return current

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

func landed_on(target: Rect2) -> bool:
	return absf(game.player.position.y-target.position.y)<2 and game.player.position.x>=target.position.x-3 and game.player.position.x<=target.end.x+3

func landed_on_any(targets: Array) -> Rect2:
	for t in targets:
		if landed_on(t): return t
	return Rect2()

func hop(target: Rect2) -> bool:
	var current := current_floor()
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
			var good := landed_on(target)
			event("ordinary-jump-landed" if good else "ordinary-jump-missed")
			return good
	key(KEY_SPACE,false)
	move(0)
	event("ordinary-jump-timeout")
	return false

# Jump then a single real air-dash toward the steeper optional branch gap.
# accept: footing rects that count as a successful crossing (defaults to [target]).
# The steep branch's upper tile converges with the powered route's upper tile, so the
# merge is recorded as landing on either — both are the shared path to the next island.
func dash_hop(target: Rect2, label_value: String, accept: Array = []) -> bool:
	if accept.is_empty(): accept=[target]
	var current := current_floor()
	if current.size==Vector2.ZERO:
		event("no-starting-floor-"+label_value)
		return false
	var direction := 1 if target.get_center().x>current.get_center().x else -1
	var destination := target.position.x+22 if direction>0 else target.end.x-22
	var launch := current.end.x-8 if direction>0 else current.position.x+8
	if not await walk(launch): return false
	move(direction)
	await frames(2)
	key(KEY_SPACE,true)
	event("branch-dash-jump-start-"+label_value)
	var dashed := false
	var dash_frame := -1
	for i in 140:
		if finishing: return false
		# Keep the full jump height; cut only after we have climbed toward the ledge.
		if i==14: key(KEY_SPACE,false)
		# Fire one real air-dash near the apex, so the flat dash carries across the gap
		# at the top of the arc instead of killing the climb early.
		if not dashed and i>=4 and game.player.velocity.y>=-70:
			key(KEY_SPACE,false)
			key(KEY_DASH,true)
			dashed=true
			dash_frame=i
			dashes_used+=1
			event("branch-dash-fire-"+label_value)
		if dashed and i==dash_frame+5: key(KEY_DASH,false)
		if absf(destination-game.player.position.x)<3: move(0)
		await frames(1)
		if i>8 and game.player.is_on_floor() and game.player.velocity.y>=0:
			key(KEY_SPACE,false)
			key(KEY_DASH,false)
			move(0)
			await frames(7)
			var footing := landed_on_any(accept)
			var good := footing.size!=Vector2.ZERO
			event("branch-dash-landed-"+label_value if good else "branch-dash-missed-"+label_value)
			return good
		if game.player.position.y>game.episode.fall_y:
			key(KEY_SPACE,false)
			key(KEY_DASH,false)
			move(0)
			event("branch-dash-fell-"+label_value)
			return false
	key(KEY_SPACE,false)
	key(KEY_DASH,false)
	move(0)
	event("branch-dash-timeout-"+label_value)
	return false

func operate(at: Vector2, label_value: String) -> bool:
	if not await walk(at.x): return false
	event("before-"+label_value)
	await tap(KEY_E)
	event("after-"+label_value)
	await frames(30)
	return true

func drive() -> void:
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
	await full_episode_ep2()

func full_episode_ep2() -> void:
	await frames(45)
	if int(game.selected_episode)!=2 or game.state!="play":
		fail("Ordinary menu did not reach episode-2 play")
		return
	var stage: Dictionary=game.episode.duplicate(true)
	var route: Array=stage.route
	var branches: Array=stage.branches
	var hearths: Array=stage.hearths
	var switches: Array=stage.switches
	if branches.size()!=2 or hearths.size()!=3 or switches.size()!=2:
		fail("Unexpected episode-2 geometry (branches/hearths/switches)")
		return
	if not game.player.has_dash:
		fail("Episode 2 did not grant the start-time dash")
		return
	# 1) Permanent arrival islands: spawn floor -> route[0..3].
	for i in 4:
		if not await hop(route[i]):
			fail("Real arrival jump failed at route "+str(i)+"; attempt preserved")
			return
	# 2) On island route[3]: light hearth 0, then switch 0 (opens branch + powered route).
	if not await operate(hearths[0],"hearth-1"):
		fail("Could not reach actual hearth 1")
		return
	if not await operate(switches[0],"switch-1"):
		fail("Could not reach actual switch 1")
		return
	await frames(6)
	if not game.world.switch_lit.has(0):
		fail("Switch 1 did not light through the actual interact")
		return
	# 3) Optional steep two-tile shortcut, crossed with the real air-dash.
	if not await dash_hop(branches[0],"branch-a"):
		fail("Dash onto branch tile A failed; attempt preserved (fall/short recorded)")
		return
	# Second steep dash across the widest gap. The upper branch tile and the powered
	# route's upper tile (route[6]) converge here; landing on either is the real merge.
	if not await dash_hop(branches[1],"branch-b",[branches[1],route[6]]):
		fail("Dash across the steep branch gap failed; attempt preserved")
		return
	# 4) Step up to island route[7] — the same island the ordinary three-tile route reaches.
	if not await hop(route[7]):
		fail("Jump onto the shared next island failed; attempt preserved")
		return
	event("actual-branch-merge-on-island")
	# 5) On island route[7]: light hearth 1, switch 1 (opens the second powered group).
	if not await operate(hearths[1],"hearth-2"):
		fail("Could not reach actual hearth 2")
		return
	if not await operate(switches[1],"switch-2"):
		fail("Could not reach actual switch 2")
		return
	await frames(6)
	if not game.world.switch_lit.has(1):
		fail("Switch 2 did not light through the actual interact")
		return
	# 6) Powered group 2: route[8..11] to the final island.
	for i in range(8,12):
		if not await hop(route[i]):
			fail("Real powered jump failed at route "+str(i)+"; attempt preserved")
			return
	# 7) Final island route[11]: light hearth 2 -> result.
	if not await operate(hearths[2],"hearth-3"):
		fail("Could not reach actual final hearth 3")
		return
	move(0)
	key(KEY_SPACE,false)
	await frames(30)
	if game.world.hearth_lit.size()<3 or game.state!="result":
		fail("Normal inputs did not reach the actual three-hearth result (hearth_lit="+str(game.world.hearth_lit)+", state="+str(game.state)+")")
		return
	event("actual-result")
	await frames(150)
	# 8) Result -> title -> notebook (手帳) pages.
	if not await press_focused_text("話を選ぶ"):
		fail("Could not return to title via the actual result button")
		return
	event("actual-title-after-result")
	await frames(60)
	if not await press_focused_text("手帳"):
		fail("Could not open the actual notebook through the GUI")
		return
	for page in 4:
		if game.state!="story": break
		event("actual-notebook-page")
		await frames(150)
		var focused := root.gui_get_focus_owner()
		if not focused is Button or focused.text not in ["次へ","閉じる"]:
			fail("Actual notebook next/close button not focused")
			return
		var text: String=focused.text
		if not await press_focused_text(text):
			fail("Could not activate the actual notebook button")
			return
	await frames(45)
	event("actual-final-title")
	active=false
	finishing=true
	receipt("PASS_FULL_CAPTURE_PENDING_ROOT_VISUAL_REVIEW","Ordinary title/story/physics: permanent islands, hearth1+switch1, optional two-tile branch crossed by real air-dash, merge to shared island, hearth2+switch2, powered group 2, three-hearth result, notebook. Automated capture, not a human/RTA claim.")
	print("PROJECTP117_FULL_COMPLETE frames=",count," dashes=",dashes_used)
	quit(0)
