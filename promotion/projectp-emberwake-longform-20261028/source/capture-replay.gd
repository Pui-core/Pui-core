# Issue127. Replay control comparison through ordinary input only.
# Base helpers manipulate recording/input state; pinned product state is read-only.
extends "capture-episode.gd"

var control_comparison: Dictionary = {"scenario":"episode1-replay-short-vs-hold","actual_trials":[],"completed_expected":[1],"outcome_not_predetermined":true}

func _initialize() -> void:
	started_ms=Time.get_ticks_msec()
	var args := OS.get_cmdline_user_args()
	for i in args.size():
		if args[i]=="--out": out_dir=args[i+1]
		if args[i]=="--episode": episode_number=int(args[i+1])
		if args[i]=="--seed-sha": expected_save_sha=args[i+1]
	if out_dir.is_empty() or episode_number!=1:
		push_error("Replay comparison is scoped to owned episode1")
		quit(2)
		return
	DirAccess.make_dir_recursive_absolute(out_dir.path_join("frames"))
	var expected := OS.get_environment("PROJECTP_CAPTURE_DATA_ROOT").simplify_path()
	var actual := OS.get_user_data_dir().simplify_path()
	var save := ProjectSettings.globalize_path("user://emberwake-campaign-1.0-jump-1.1.json").simplify_path()
	var exists := FileAccess.file_exists(save)
	var sha := FileAccess.get_sha256(save) if exists else ""
	user_proof={"expected_data_root":expected,"actual_user_data_dir":actual,"actual_save_path":save,"save_existed_before_scene":exists,"backup_existed_before_scene":FileAccess.file_exists(save+".bak"),"save_sha256_before_scene":sha,"expected_save_sha256":expected_save_sha,"main_scene_instantiated":false,"replay_of_completed_episode":true}
	if expected.is_empty() or not actual.begins_with(expected+"/") or not save.begins_with(expected+"/") or not exists or expected_save_sha.is_empty() or sha!=expected_save_sha or FileAccess.file_exists(save+".bak"):
		fail("Owned legitimate replay save precondition mismatch")
		return
	root.content_scale_size=Vector2i(480,270)
	root.content_scale_mode=Window.CONTENT_SCALE_MODE_CANVAS_ITEMS
	root.size=Vector2i(1920,1080)
	RenderingServer.frame_post_draw.connect(save_frame)
	call_deferred("drive")

func receipt(status: String, reason: String) -> void:
	super.receipt(status,reason)
	var p := out_dir.path_join("capture.json")
	if not FileAccess.file_exists(p): return
	var data: Dictionary=JSON.parse_string(FileAccess.get_file_as_string(p))
	data.control_comparison=control_comparison
	var f := FileAccess.open(p,FileAccess.WRITE)
	if f: f.store_string(JSON.stringify(data,"  ")+"\n")

func check_replay_progress(label_value: String) -> bool:
	var completed: Array=game.profile.data.completed.duplicate(true)
	control_comparison[label_value]={"frame":count,"completed":completed,"falls":game.falls,"state":game.state}
	event(label_value)
	if completed!=[1]:
		fail("Replay changed completed memory list")
		return false
	return true

func skip_story_normally() -> bool:
	if game.state=="story":
		if not await press_focused_text("スキップ"): return false
	await frames(8)
	return game.state=="play"

func retry_normally(label_value: String) -> bool:
	move(0)
	key(KEY_SPACE,false)
	event("before-retry-"+label_value)
	key(KEY_R,true)
	await frames(24)
	key(KEY_R,false)
	await frames(5)
	if not await skip_story_normally():
		fail("R retry did not return through normal story controls")
		return false
	if game.falls!=0 or not game.world.hearth_lit.is_empty():
		fail("R retry did not reset actual episode falls/hearths")
		return false
	return check_replay_progress("after-retry-"+label_value)

func trial(hold_frames: int, label_value: String) -> Dictionary:
	var target: Rect2=game.episode.route[1]
	if not await walk(291.0): return {"error":"ordinary launch walk failed"}
	target_rect=target
	var data := {"label":label_value,"start_frame":count,"maximum_hold_display_frames":hold_frames,"actual_release_frame":-1,"start_position":[game.player.position.x,game.player.position.y],"start_velocity":[game.player.velocity.x,game.player.velocity.y],"on_floor_at_start":game.player.is_on_floor(),"start_falls":game.falls,"target":rect_array(target),"trajectory":[],"outcome":"BOUNDED_OBSERVATION_NOT_LANDED"}
	data.start_floor=rect_array(current_floor())
	data.start_world={"has_dash":game.player.has_dash,"collected":game.world.collected.duplicate(),"hearths":game.world.hearth_lit.duplicate(),"switches":game.world.switch_lit.duplicate()}
	if not game.player.is_on_floor(): return {"error":"launch is not on actual floor"}
	event("before-"+label_value)
	move(1)
	key(KEY_SPACE,true)
	var start_falls: int=game.falls
	for i in 180:
		if i==hold_frames:
			key(KEY_SPACE,false)
			data.actual_release_frame=count
		if absf(322.0-game.player.position.x)<3: move(0)
		await frames(1)
		data.trajectory.append({"frame":count,"x":game.player.position.x,"y":game.player.position.y,"vx":game.player.velocity.x,"vy":game.player.velocity.y,"on_floor":game.player.is_on_floor(),"falls":game.falls})
		if game.falls>start_falls:
			data.outcome="ACTUAL_FALL_AND_CHECKPOINT_RETURN"
			break
		if i>10 and game.player.is_on_floor() and landed_on(target):
			data.outcome="ACTUAL_TARGET_LANDING"
			break
		if i>90 and game.player.is_on_floor():
			data.outcome="RETURNED_TO_DIFFERENT_FLOOR"
			break
	key(KEY_SPACE,false)
	if int(data.actual_release_frame)<0: data.actual_release_frame=count
	data.actual_hold_display_frames=int(data.actual_release_frame)-int(data.start_frame)
	move(0)
	await frames(8)
	data.end_frame=count
	data.end_position=[game.player.position.x,game.player.position.y]
	data.end_falls=game.falls
	data.min_y=1124.0
	for p in data.trajectory: data.min_y=minf(float(data.min_y),float(p.y))
	control_comparison.actual_trials.append(data)
	event("after-"+label_value)
	return data

func drive() -> void:
	game=load("res://scenes/campaign.tscn").instantiate()
	root.add_child(game)
	user_proof.main_scene_instantiated=true
	await frames(8)
	if game.profile.data.completed!=[1]:
		fail("Replay requires exact legitimate completed[1]")
		return
	active=true
	game.player.jumped.connect(func(): event("actual-player-jumped"))
	game.player.landed.connect(func(_strength: float): event("actual-player-landed"))
	if not check_replay_progress("replay-title-before-input"): return
	await frames(45)
	if not await press_focused_text("1:1 ✓") or not await press_focused_text("物語を進める") or not await skip_story_normally():
		fail("Normal replay menu/start failed")
		return
	if not await hop(game.episode.route[0]):
		fail("Actual first floor not reached")
		return
	var short_result := await trial(1,"short-press")
	if short_result.has("error"):
		fail(str(short_result.error))
		return
	if not check_replay_progress("after-short-input"): return
	await frames(35)
	if not await retry_normally("before-hold"): return
	if not await hop(game.episode.route[0]):
		fail("Actual first floor after retry not reached")
		return
	var hold_result := await trial(24,"long-hold")
	if hold_result.has("error") or hold_result.outcome!="ACTUAL_TARGET_LANDING":
		fail("Long hold did not actually land; preserve failed comparison")
		return
	var start_delta := {"x":absf(float(short_result.start_position[0])-float(hold_result.start_position[0])),"y":absf(float(short_result.start_position[1])-float(hold_result.start_position[1])),"vx":absf(float(short_result.start_velocity[0])-float(hold_result.start_velocity[0])),"vy":absf(float(short_result.start_velocity[1])-float(hold_result.start_velocity[1]))}
	var equivalent: bool=start_delta.x<=0.5 and start_delta.y<=0.01 and start_delta.vx<=0.05 and start_delta.vy<=0.05 and short_result.start_floor==hold_result.start_floor and short_result.start_world==hold_result.start_world
	control_comparison.start_condition_delta=start_delta
	control_comparison.start_conditions_equivalent=equivalent
	control_comparison.start_condition_tolerances={"x":0.5,"y":0.01,"vx":0.05,"vy":0.05,"same_actual_floor":true,"same_dash_collect_hearth_switch_state":true}
	control_comparison.comparisonEstablished=equivalent and short_result.outcome in ["ACTUAL_FALL_AND_CHECKPOINT_RETURN","RETURNED_TO_DIFFERENT_FLOOR"] and hold_result.outcome=="ACTUAL_TARGET_LANDING"
	control_comparison.capture_completion_is_not_comparison_acceptance=true
	if not check_replay_progress("after-long-input"): return
	await frames(35)
	if not await retry_normally("before-reclear"): return
	# The inherited normal play function starts from the actual UI reset, finishes
	# all three hearths, opens result/title/journal, and checks completed[1] again.
	await super.play_episode()
