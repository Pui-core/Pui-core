extends SceneTree
var game: Node
var camera: Camera2D
var output := ""
var records: Array=[]
var failures: Array=[]
func _initialize() -> void:
    for arg in OS.get_cmdline_user_args():
        if arg.begins_with("--out="): output=arg.trim_prefix("--out=")
    call_deferred("capture_all")
func key(code: int, down: bool) -> void:
    var e:=InputEventKey.new()
    e.keycode=code
    e.physical_keycode=code
    e.pressed=down
    Input.parse_input_event(e)
    Input.flush_buffered_events()
func frame() -> void:
    await physics_frame
    await process_frame
    await RenderingServer.frame_post_draw
func fixture(at: Vector2, hearths: int) -> void:
    for code in [KEY_D,KEY_E,KEY_Q,KEY_SPACE]: key(code,false)
    game.start_game("practice",false,1)
    game.world.portable.cores[0]={"place":"carried"}
    for i in hearths: game.world.hearth_lit.append(i)
    game.world.update_gates()
    game.player.position=at
    game.player.reset_motion()
    game.checkpoint=at
    camera.position=Vector2(575,950) if hearths==1 else Vector2(240,1092)
    camera.make_current()
    for i in 8: await frame()
func capture_all() -> void:
    if output.is_empty(): quit(2); return
    DirAccess.make_dir_recursive_absolute(output)
    game=load("res://scenes/main.tscn").instantiate()
    for store in [game.store,game.episode_two_store,game.episode_three_store]:
        for p in store.get_property_list():
            if p.name=="path": store.set("path","user://146-carry-"+str(store.episode_id)+".json")
            elif p.name in ["legacy_path","previous_course_path","legacy_jump_path"]: store.set(p.name,"user://146-missing-"+p.name)
    root.add_child(game)
    await process_frame
    game.audio.set_muted(true)
    camera=Camera2D.new()
    camera.position_smoothing_enabled=false
    game.add_child(camera)
    var cases: Array=["conflict"]
    if InputMap.has_action("drop"): cases.append_array(["safe_floor","airborne"])
    for case_name in cases:
        await fixture(Vector2(575,1016) if case_name=="conflict" else Vector2(95,1160),1 if case_name=="conflict" else 0)
        var dir: String=output+"/"+str(case_name)
        DirAccess.make_dir_recursive_absolute(dir)
        var samples: Array=[]
        for i in 240:
            if case_name=="conflict":
                if i in [30,75]: key(KEY_E,true)
                if i in [31,76]: key(KEY_E,false)
                if i==105: key(KEY_Q,true)
                if i==106: key(KEY_Q,false)
                if i>=135 and i<178 and game.world.carried_core()==-1:
                    var target: float=game.world.portable.cores[0].at[0]
                    key(KEY_D,game.player.position.x<target-1.5)
                if i==178: key(KEY_D,false)
                if i==190: key(KEY_E,true)
                if i==191: key(KEY_E,false)
            elif case_name=="safe_floor":
                if i==45: key(KEY_Q,true)
                if i==46: key(KEY_Q,false)
            elif case_name=="airborne":
                if i==30: key(KEY_SPACE,true)
                if i==36: key(KEY_Q,true)
                if i==37: key(KEY_Q,false)
                if i==43: key(KEY_SPACE,false)
            await frame()
            var im:=root.get_texture().get_image()
            var sx: float=float(im.get_width())/480.0
            var sy: float=float(im.get_height())/270.0
            var box:=Rect2(170,125,145,125) if case_name=="conflict" else Rect2(40,108,140,130)
            var region:=Rect2i(roundi(box.position.x*sx),roundi(box.position.y*sy),roundi(box.size.x*sx),roundi(box.size.y*sy))
            im.get_region(region).save_png(dir+"/frame-%04d.png"%i)
            samples.append({"step":i,"physics_frame":Engine.get_physics_frames(),"position":[game.player.position.x,game.player.position.y],"floor":game.player.is_on_floor(),"carried":game.world.carried_core(),"core0":game.world.portable.cores[0].duplicate(true),"rejected":game.world.portable.rejected,"nearby_kind":game.nearby.get("kind","")})
        records.append({"case":case_name,"samples":samples})
        if case_name=="conflict":
            if samples[85].carried!=0: failures.append("E refusal must retain core")
            if InputMap.has_action("drop") and (samples[115].carried!=-1 or samples[220].carried!=0): failures.append("Q must drop and E must reacquire in new version")
            if not InputMap.has_action("drop") and samples[115].carried!=0: failures.append("old Q must not release")
        if case_name=="safe_floor" and samples[60].carried!=-1: failures.append("safe floor release")
        if case_name=="airborne" and samples[40].carried!=0: failures.append("airborne refusal must keep core")
        print("146_CARRY_CASE "+str(case_name)+" completed")
    for code in [KEY_D,KEY_E,KEY_Q,KEY_SPACE]: key(code,false)
    var f:=FileAccess.open(output+"/capture.json",FileAccess.WRITE)
    f.store_string(JSON.stringify({"scope":"Explicit initial state fixture, subsequent real InputEventKey and physics; fixed local crop; not ordinary playthrough or puzzle solution","physics_hz":60,"failures":failures,"cases":records},"  "))
    quit(0 if failures.is_empty() else 1)
