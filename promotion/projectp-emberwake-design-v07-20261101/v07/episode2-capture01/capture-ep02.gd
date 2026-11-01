extends "capture-base.gd"

var trajectory: Array=[]
func _initialize() -> void:
	started_ms=Time.get_ticks_msec()
	episode_number=2
	var args := OS.get_cmdline_user_args()
	for i in args.size():
		if args[i]=="--out": out_dir=args[i+1]
	if out_dir.is_empty(): quit(2);return
	var actual := OS.get_user_data_dir().simplify_path()
	var expected := OS.get_environment("XDG_DATA_HOME").simplify_path()
	if expected.is_empty() or not actual.begins_with(expected+"/"): quit(2);return
	user_proof={"actual_user_data_dir":actual,"isolated_data_root":expected,"no_save_setters":true}
	root.content_scale_size=Vector2i(480,270)
	root.content_scale_mode=Window.CONTENT_SCALE_MODE_CANVAS_ITEMS
	root.size=Vector2i(960,540)
	RenderingServer.frame_post_draw.connect(save_frame)
	call_deferred("drive")

func save_frame() -> void:
	count+=1
	if is_instance_valid(game) and game.state=="play":
		trajectory.append({"frame":count,"position":[game.player.position.x,game.player.position.y],"falls":game.falls,"checkpoint":[game.checkpoint.x,game.checkpoint.y],"completed":game.profile.data.completed.duplicate(),"hearths":game.world.hearth_lit.duplicate()})
	if count>4800: fail("frame bound reached")

func receipt(status: String, reason: String) -> void:
	var result := {"status":status,"reason":reason,"sourceCommit":"71584a6bd0c8852885157de71032fd9252e7a04c","gameVersion":"0.12.0","godot":Engine.get_version_info(),"pid":OS.get_process_id(),"frames":count,"fps":30,"renderSize":[960,540],"events":events,"inputEvents":input_events,"trajectory":trajectory,"userdata":user_proof,"ordinaryInputOnly":true,"noProductStateSetters":true,"recording":"Godot MovieWriter AVI; inspect audio stream before claiming recorded game audio","wholeRealtimeWatch":false,"subjectiveListen":false}
	var f := FileAccess.open(out_dir.path_join("capture.json"),FileAccess.WRITE)
	if f:f.store_string(JSON.stringify(result,"  ")+"\n")

func drive() -> void:
	game=load("res://scenes/campaign.tscn").instantiate()
	root.add_child(game)
	await frames(10)
	if game.profile.data.completed!=[1]:fail("Expected legitimate completed episode1 only");return
	if not await press_focused_text("1:2"):fail("Stage2 button not reached");return
	await frames(10)
	event("episode2-title-before-input-memory1")
	await frames(60)
	if not await press_focused_text("物語を進める"):fail("Normal start not reached");return
	await frames(5)
	if not await press_focused_text("スキップ"):fail("Normal skip not reached");return
	await frames(30)
	if game.state!="play" or game.selected_episode!=2 or game.run.mode!="practice":fail("Wrong play conditions");return
	var stage: Dictionary=game.episode.duplicate(true)
	for i in 4:
		if not await hop(stage.route[i]):fail("Actual first-route jump failed "+str(i));return
	if not await operate(stage.hearths[0],"hearth-1") or not await operate(stage.switches[0],"switch-1"):fail("First-island inputs failed");return
	for i in range(4,8):
		if not await hop(stage.route[i]):fail("Actual middle-route jump failed "+str(i));return
	if not await operate(stage.hearths[1],"hearth-2"):fail("Second hearth input failed");return
	if game.world.hearth_lit!=[0,1] or game.falls!=0:fail("Unexpected pre-fall conditions");return
	event("second-checkpoint-before-fall")
	await frames(60)
	move(1)
	for i in 180:
		await frames(1)
		if game.falls==1:break
	move(0)
	await frames(3)
	if game.falls!=1 or game.world.hearth_lit!=[0,1] or game.profile.data.completed!=[1] or game.player.position.distance_to(game.checkpoint)>40:fail("Actual checkpoint return not observed");return
	event("actual-fall-return-second-checkpoint")
	await frames(75)
	await tap(KEY_ESCAPE)
	await frames(5)
	event("pause-after-fall")
	if game.state!="pause":fail("Pause input not accepted");return
	await frames(75)
	if not await press_focused_text("話を選ぶ"):fail("Title navigation unavailable");return
	await frames(10)
	event("episode2-title-after-memory1-without-clear")
	if game.selected_episode!=2 or game.profile.data.completed!=[1] or game.world.hearth_lit.size()>=3:fail("Episode changed or completed");return
	await frames(90)
	finishing=true
	receipt("PASS_NEW_CAPTURE_PENDING_REVIEW","Normal episode2 practice, second checkpoint, one actual fall, no clear, memory1 before/after")
	quit(0)
