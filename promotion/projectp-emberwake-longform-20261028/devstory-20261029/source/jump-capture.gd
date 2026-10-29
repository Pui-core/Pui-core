extends SceneTree
var game: Node
var fixed_camera: Camera2D
var current_tick := 0
var jumps: Array = []
var landings: Array = []
var pressed := false
var report: Array = []
var output := ""
var selected_cases: Array=[]
func _initialize() -> void:
    for arg in OS.get_cmdline_user_args():
        if arg.begins_with("--out="): output=arg.trim_prefix("--out=")
        if arg.begins_with("--cases="): selected_cases=Array(arg.trim_prefix("--cases=").split(","))
    call_deferred("capture_all")
func key(state: bool) -> void:
    var e:=InputEventKey.new()
    e.physical_keycode=KEY_SPACE
    e.keycode=KEY_SPACE
    e.pressed=state
    Input.parse_input_event(e)
    pressed=state
func step() -> void:
    await physics_frame
    await process_frame
    await RenderingServer.frame_post_draw
func prepare() -> void:
    key(false)
    game.start_game("run")
    for i in 6: await step()
    fixed_camera.make_current()
    fixed_camera.position=Vector2(240,1092)
    current_tick=0
    jumps.clear()
    landings.clear()
func capture_all() -> void:
    if output.is_empty(): quit(2); return
    DirAccess.make_dir_recursive_absolute(output)
    game=load("res://scenes/main.tscn").instantiate()
    game.store.path="user://projectp146-only.json"
    for p in game.store.get_property_list():
        if p.name=="legacy_path": game.store.set("legacy_path","user://projectp146-only.no-legacy")
    game.store.data=EmberSave.defaults()
    root.add_child(game)
    await process_frame
    game.audio.set_muted(true)
    game.player.jumped.connect(func(): jumps.append(current_tick))
    game.player.landed.connect(func(_strength): landings.append(current_tick))
    fixed_camera=Camera2D.new()
    fixed_camera.position=Vector2(240,1092)
    fixed_camera.position_smoothing_enabled=false
    game.add_child(fixed_camera)
    fixed_camera.make_current()
    var contact:=46
    var cases: Array=["hold60","tap0","tap2","buffer1","buffer7","repeat20"] if selected_cases.is_empty() else selected_cases
    # Full-hold flight is measured before relative buffer conditions, even in a subset.
    if not selected_cases.is_empty(): cases=["hold60"]+selected_cases
    for case_name in cases:
        await prepare()
        var dir: String=output+"/"+str(case_name)
        DirAccess.make_dir_recursive_absolute(dir)
        var samples: Array=[]
        var peak:=1160.0
        for i in 180:
            current_tick=i
            if i==0: key(true)
            if case_name=="tap0" and i==0: key(false)
            if case_name=="tap2" and i==2: key(false)
            if case_name=="tap6" and i==6: key(false)
            if case_name=="hold60" and i==60: key(false)
            if case_name.begins_with("buffer"):
                var lead:=int(str(case_name).trim_prefix("buffer"))
                if i==25: key(false)
                if i==contact-lead: key(true)
                if i==contact-lead+1: key(false)
            if case_name=="repeat20":
                if i%20==0: key(true)
                if i%20==2: key(false)
            await step()
            peak=minf(peak,game.player.position.y)
            var image:=root.get_texture().get_image()
            var sx:=float(image.get_width())/480.0
            var sy:=float(image.get_height())/270.0
            var region:=Rect2i(roundi(40*sx),roundi(108*sy),roundi(140*sx),roundi(130*sy))
            var crop:=image.get_region(region)
            crop.save_png(dir+"/frame-%04d.png"%i)
            samples.append({"step":i,"physics_frame":Engine.get_physics_frames(),"position":[game.player.position.x,game.player.position.y],"velocity":[game.player.velocity.x,game.player.velocity.y],"on_floor":game.player.is_on_floor(),"space_held":pressed})
        if case_name=="hold60" and not landings.is_empty(): contact=int(landings[0])
        report.append({"case":case_name,"height":1160.0-peak,"jumps":jumps.duplicate(),"landings":landings.duplicate(),"measured_full_flight_contact":contact,"samples":samples})
        print("PROJECTP146_CASE "+case_name+" height="+str(1160.0-peak)+" jumps="+str(jumps)+" landings="+str(landings))
    key(false)
    var f:=FileAccess.open(output+"/capture.json",FileAccess.WRITE)
    f.store_string(JSON.stringify({"scope":"InputEventKey process-private scripted comparison; fixed-camera fixture; cropped entry only; not ordinary play or route completion","physics_hz":60,"logical_crop":[40,108,140,130],"camera":[240,1092],"cases":report},"  "))
    quit()
