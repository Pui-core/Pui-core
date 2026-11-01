# Issue127. Ordinary input and unmodified pinned product physics only.
# External driver state below belongs to recording, never game state.
extends SceneTree
const KEY_DASH := KEY_X
var game: Node
var out_dir := ""
var episode_number := 1
var expected_save_sha := ""
var take_branch := false
var active := false
var count := 0
var events: Array = []
var input_events: Array = []
var user_proof: Dictionary = {}
var started_ms := 0
var finishing := false
var axis := 0
var dashes_used := 0
var target_rect := Rect2()
func rect_array(r: Rect2) -> Array:
	return [r.position.x,r.position.y,r.size.x,r.size.y]
func _initialize() -> void:
	started_ms=Time.get_ticks_msec()
	var args := OS.get_cmdline_user_args()
	for i in args.size():
		if args[i]=="--out": out_dir=args[i+1]
		if args[i]=="--episode": episode_number=int(args[i+1])
		if args[i]=="--seed-sha": expected_save_sha=args[i+1]
		if args[i]=="--branch": take_branch=args[i+1]=="true"
	if out_dir.is_empty() or episode_number<1 or episode_number>15:
		push_error("Invalid owned output/episode")
		quit(2)
		return
	DirAccess.make_dir_recursive_absolute(out_dir.path_join("frames"))
	var expected := OS.get_environment("PROJECTP_CAPTURE_DATA_ROOT").simplify_path()
	var actual := OS.get_user_data_dir().simplify_path()
	var save := ProjectSettings.globalize_path("user://emberwake-campaign-1.0-jump-1.1.json").simplify_path()
	var exists := FileAccess.file_exists(save)
	var sha := FileAccess.get_sha256(save) if exists else ""
	user_proof={"expected_data_root":expected,"actual_user_data_dir":actual,"actual_save_path":save,"save_existed_before_scene":exists,"backup_existed_before_scene":FileAccess.file_exists(save+".bak"),"save_sha256_before_scene":sha,"expected_save_sha256":expected_save_sha,"main_scene_instantiated":false,"xdg_data_home":OS.get_environment("XDG_DATA_HOME"),"xdg_config_home":OS.get_environment("XDG_CONFIG_HOME"),"xdg_cache_home":OS.get_environment("XDG_CACHE_HOME")}
	if expected.is_empty() or not actual.begins_with(expected+"/") or not save.begins_with(expected+"/"):
		fail("User data escaped owned prefix before scene load")
		return
	if FileAccess.file_exists(save+".bak") or (episode_number==1 and exists) or (episode_number>1 and (not exists or expected_save_sha.is_empty() or sha!=expected_save_sha)):
		fail("Fresh/continuation user-data precondition mismatch before scene load")
		return
	root.content_scale_size=Vector2i(480,270)
	root.content_scale_mode=Window.CONTENT_SCALE_MODE_CANVAS_ITEMS
	root.size=Vector2i(1920,1080)
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
			item.expected_footing=rect_array(target_rect)
			item.actual_footing_rects=[]
			if game.player.is_on_floor():
				for r in game.world.platforms:
					if absf(r.position.y-game.player.position.y)<2 and game.player.position.x>=r.position.x-3 and game.player.position.x<=r.end.x+3: item.actual_footing_rects.append(rect_array(r))
		if is_instance_valid(game.get("world")):
			item.hearths=game.world.hearth_lit.duplicate()
			item.switches=game.world.switch_lit.duplicate()
			item.collected=game.world.collected.duplicate()
		item.falls=game.get("falls")
	events.append(item)
	print("PROJECTP127_EVENT ",JSON.stringify(item))

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
	var data := {"schemaVersion":1,"status":status,"reason":reason,"mode":"issue127-episode","episode":episode_number,"takeBranch":take_branch,"sourceCommit":"71584a6bd0c8852885157de71032fd9252e7a04c","gameVersion":"0.12.0","godot":Engine.get_version_info(),"owned_pid":OS.get_process_id(),"display":OS.get_environment("DISPLAY"),"render_size":[1920,1080],"logical_size":[480,270],"fps":30,"frame_count":count,"dashes_used":dashes_used,"userdata_proof":user_proof,"save_exists_after":FileAccess.file_exists(save),"save_sha256_after":FileAccess.get_sha256(save) if FileAccess.file_exists(save) else "","selected_episode_final":game.get("selected_episode") if is_instance_valid(game) else null,"completed_final":game.profile.data.completed.duplicate(true) if is_instance_valid(game) else null,"state_final":game.get("state") if is_instance_valid(game) else null,"hearth_lit_final":game.world.hearth_lit.duplicate() if is_instance_valid(game) else null,"switch_lit_final":game.world.switch_lit.duplicate() if is_instance_valid(game) else null,"falls_final":game.get("falls") if is_instance_valid(game) else null,"input":"Ordinary Focus/Enter/Tab and movement/Space/X/E InputEventKey; no product setters or callbacks","audio":"Dummy; actual game audio not recorded","clock":"PNG wait enters wallclock HUD; not RTA/PB or human first-play evidence","events":events,"input_events":input_events}
	var f := FileAccess.open(out_dir.path_join("capture.json"),FileAccess.WRITE)
	if f: f.store_string(JSON.stringify(data,"  ")+"\n")
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
	target_rect=target
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
# accept: footing rects that count as a successful crossing (defaults to [target]). This
# must be the real branch tile only — the powered route tile is a DIFFERENT platform and
# is never a substitute for landing on the optional branch itself.
# launch_x / land_x: when >=0, override the default take-off / aim x. Needed for branch B,
# whose only exposed footing is its left lip (x<route[6] start); aiming at the branch
# centre lands on the powered route tile that overhangs it, which does not count.
func dash_hop(target: Rect2, label_value: String, accept: Array = [], launch_x: float = -1.0, land_x: float = -1.0) -> bool:
	target_rect=target
	if accept.is_empty(): accept=[target]
	var current := current_floor()
	if current.size==Vector2.ZERO:
		event("no-starting-floor-"+label_value)
		return false
	var direction := 1 if target.get_center().x>current.get_center().x else -1
	var destination := target.position.x+22 if direction>0 else target.end.x-22
	var launch := current.end.x-8 if direction>0 else current.position.x+8
	if land_x>=0.0: destination=land_x
	if launch_x>=0.0: launch=launch_x
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
		fail("Unexpected pinned main scene")
		return
	game=load(scene).instantiate()
	root.add_child(game)
	user_proof.main_scene_instantiated=true
	await frames(8)
	var completed: Array=game.profile.data.completed.duplicate(true)
	user_proof.profile_completed_before_input=completed.duplicate(true)
	user_proof.selected_episode_before_input=game.selected_episode
	if completed!=range(1,episode_number):
		fail("Continuation completed sequence does not match previous normal episode")
		return
	active=true
	event("ordinary-title")
	await frames(15)
	if episode_number>1:
		var chapter_index: int=(episode_number-1)/3+1
		var chapter_episode: int=(episode_number-1)%3+1
		if not await press_focused_text("%d:%d"%[chapter_index,chapter_episode]):
			fail("Actual unlocked episode grid button not activated")
			return
		await frames(10)
	if game.selected_episode!=episode_number:
		fail("Normal grid selection mismatch")
		return
	event("actual-selected-title")
	if not await press_focused_text("物語を進める"):
		fail("Actual title start button not activated")
		return
	for page in 10:
		if game.state=="play": break
		event("actual-intro-page")
		await frames(120)
		var focused := root.gui_get_focus_owner()
		if not focused is Button or focused.text not in ["次へ","出発"]:
			fail("Actual intro button not focused")
			return
		if not await press_focused_text(focused.text):
			fail("Could not advance actual intro")
			return
	if game.state!="play" or game.selected_episode!=episode_number:
		fail("Normal intro did not reach requested play")
		return
	event("ordinary-depart-play")
	await play_episode()
func play_episode() -> void:
	await frames(30)
	var stage: Dictionary=game.episode.duplicate(true)
	var route: Array=stage.route
	if route.size()!=12 or stage.hearths.size()!=3 or stage.switches.size()!=2:
		fail("Unexpected pinned stage geometry")
		return
	for i in 4:
		if not await hop(route[i]):
			fail("Real arrival jump failed at "+str(i))
			return
	event("arrival-island-dash-status")
	if not await operate(stage.hearths[0],"hearth-1") or not await operate(stage.switches[0],"switch-1"):
		fail("Actual first island interaction failed")
		return
	if not game.world.switch_lit.has(0):
		fail("First actual switch not lit")
		return
	if take_branch:
		if episode_number!=2 or stage.branches.size()!=2:
			fail("Branch recipe only qualified for episode2")
			return
		if not await dash_hop(stage.branches[0],"branch-a"):
			fail("Real optional branch A not landed")
			return
		if not await dash_hop(stage.branches[1],"branch-b",[stage.branches[1]],stage.branches[0].get_center().x,stage.branches[1].position.x+8.0):
			fail("Real branch B not landed; powered route tile never substitutes")
			return
		if not await hop(route[7]):
			fail("Actual branch merge failed")
			return
		event("actual-branch-merge-on-island")
	else:
		for i in range(4,8):
			if not await hop(route[i]):
				fail("Real middle route jump failed at "+str(i))
				return
	if not await operate(stage.hearths[1],"hearth-2") or not await operate(stage.switches[1],"switch-2"):
		fail("Actual second island interaction failed")
		return
	if not game.world.switch_lit.has(1):
		fail("Second actual switch not lit")
		return
	for i in range(8,12):
		if not await hop(route[i]):
			fail("Real upper route jump failed at "+str(i))
			return
	if not await operate(stage.hearths[2],"hearth-3"):
		fail("Final actual hearth interaction failed")
		return
	move(0)
	key(KEY_SPACE,false)
	if episode_number==15 and game.state=="story":
		var ending_page_limit: int=game.narrative.ending.size()+1
		for page in ending_page_limit:
			if game.state!="story": break
			event("actual-ending-page")
			await frames(150)
			var ending_button := root.gui_get_focus_owner()
			if not ending_button is Button or ending_button.text not in ["次へ","朝へ"]:
				fail("Actual ending button unavailable")
				return
			if not await press_focused_text(ending_button.text): return
	await frames(30)
	if game.state!="result" or game.world.hearth_lit.size()!=3 or game.profile.data.completed!=range(1,episode_number+1):
		fail("Actual result/completed sequence missing")
		return
	event("actual-result")
	await frames(180)
	if not await press_focused_text("話を選ぶ"):
		fail("Actual result-to-title button unavailable")
		return
	await frames(30)
	event("actual-title-after-result")
	if not await press_focused_text("手帳"):
		fail("Actual notebook button unavailable")
		return
	for page in 4:
		if game.state!="story": break
		event("actual-notebook-page")
		await frames(60 if page==0 else 120)
		var notebook_button := root.gui_get_focus_owner()
		if not notebook_button is Button or notebook_button.text not in ["次へ","閉じる"]:
			fail("Actual notebook next/close unavailable")
			return
		if not await press_focused_text(notebook_button.text): return
	await frames(30)
	event("actual-final-title")
	active=false
	finishing=true
	receipt("PASS_EPISODE_CAPTURE_PENDING_REVIEW","Normal menu/story/play/result/notebook; no product state setters")
	quit(0)
