"""
Renders the spacecraft's yaw frames for the Command Deck.

    blender -b -P scripts/render-ship-frames.py -- ship.glb --contact     # camera study
    blender -b -P scripts/render-ship-frames.py -- ship.glb --elevation 43.4
    blender -b -P scripts/render-ship-frames.py -- ship.glb                # uses the default

Output: public/ship/yaw-00.png … yaw-75.png, RGBA with a transparent film.
Convert to WebP afterwards (see the note at the bottom), then flip
SPRITE_ENABLED in src/features/spacecraft/shipFrames.ts.

WHY THESE NUMBERS. Everything here is derived from constants in the app and
must not be picked by eye:

  ELEVATION   from SHIP_CAMERA_TILT in shipFrames.ts, which is DELIBERATELY
              decoupled from the plane's own ORBIT_TILT. sin(phi) is the ellipse
              squash under an orthographic projection, so 0.55 puts this camera
              at 33.4deg while the plane is drawn at 39.8deg. Low, so the engine
              bells face the viewer. The app compensates for the gap in exactly
              one place; the reasoning and its limits are on the constant. Do
              not "fix" it to match ORBIT_TILT without reading that note.

  LIGHTING    three sources, and the count is the point. A key alone gives a lit
              object with a dead shadow side; adding a warm bounce from the
              engines and a cool ambient from the void gives it depth, because
              the shadow side is then described by a DIFFERENT colour rather
              than by less of the same one.

  ORTHOGRAPHIC because the deck's own projection is a plain scale with no
              vanishing point. A perspective camera introduces a second,
              conflicting projection. If you want a little lens character use a
              very long focal length (135mm+), never a wide one.

  YAW RANGE   the hull is CAPPED at SHIP_YAW_LIMIT (22deg) and never rendered
              turned further, however far off the bearing is — see that constant
              for why. Measured peak is 20.8deg. So 0-30 in 2deg steps covers the
              working range with headroom at a granularity fine enough that the
              crossfade barely has to work. The hull is bilaterally symmetric, so
              only the starboard half is rendered and the app mirrors it.

  KEY LIGHT   upper RIGHT. Every distant body in starfield.data.ts is lit from
              74% 28%, and the ship's floor shadow was rebuilt to match. A
              render lit from the left will fight the entire scene.

Keep this file and src/features/spacecraft/shipFrames.ts in step: FRAME_STEP,
FRAME_COUNT and FRAME_PIXELS appear in both.
"""

import math
import os
import sys

import bpy

# ----------------------------------------------------------------- contract
# THE HULL RENDERS FROM A DIFFERENT ELEVATION THAN THE PLANE, on purpose. See
# the note on SHIP_CAMERA_TILT in src/features/spacecraft/shipFrames.ts.
#
# The plane is drawn at 39.79deg (ORBIT_TILT 0.64). The hull is now 3.6deg ABOVE
# that, where it used to be 6.4deg below — so the two elevations disagree by
# LESS than they did, not more. <ShipSprite> absorbs the remaining mismatch by
# mapping bearings to frames through this SAME constant, so the nose still lines
# up with its bearing.
SHIP_CAMERA_TILT = 0.6871                # shipFrames.ts — NOT ORBIT_TILT

# HERO CAMERA LOCKED AT 43.4 DEGREES. Chosen off the elevation contact sheet:
# it is the highest angle at which the engine bells still read as three distinct
# apertures at yaw 0, and the lowest at which the wing planform stays legible at
# yaw 22 — the hull's rendered angle when the ship aims at AURORA, the widest
# bearing on the deck. 51.3 was rendered alongside it and rejected again: the
# bells go to slivers and the ship reads as seen from above rather than behind.
#
# THIS NUMBER IS NOW A CONTRACT. src/features/spacecraft/shipFrames.ts must carry
# the same value in SHIP_CAMERA_TILT (0.6871) or the rendered nose stops matching
# the bearing vector the deck draws — the one error on the deck a viewer can
# check by eye, against a line that is right there.
ELEVATION_DEG = math.degrees(math.asin(SHIP_CAMERA_TILT))   # 33.37
YAW_START, YAW_END, YAW_STEP = 0, 30, 2               # shipFrames.ts
FRAME_PIXELS = 800                                    # shipFrames.ts

# Resolved from THIS FILE, not from the working directory. Blender is usually
# launched from wherever the .exe lives, so a relative path would scatter frames
# into Program Files without saying so.
OUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "public", "ship")

# Blender 4.x writes WebP with alpha directly, so there is no separate cwebp
# step and nothing extra to install. Falls back to PNG automatically on older
# builds; convert those by hand before enabling the sprite.
OUT_FORMAT = "WEBP"     # or "PNG"
WEBP_QUALITY = 90

# Fraction of the frame height the hull should fill. Matches the vector ship's
# proportion inside its 196px box, so swapping representations does not change
# how big the ship reads on the deck.
FILL = 0.72

# ---------------------------------------------------------------- contact sheet
# CAMERA ELEVATIONS TO COMPARE, in degrees above the orbital plane.
#
# The current render sits at 33.37 (SHIP_CAMERA_TILT 0.55). The brief asks for
# 8-12 degrees higher, so the sweep brackets that: one step below current as a
# control, current itself, then the requested band, then 51.3 — the elevation an
# earlier pass tried and rejected — so the failure mode is visible on the same
# sheet rather than remembered from a comment.
ELEVATION_SWEEP = [29.0, 33.37, 37.0, 41.4, 43.4, 45.4, 51.3]

# YAWS TO RENDER AT EACH ELEVATION.
#
# 0 is the hero pose. 22 is the one that actually decides this: it is the
# hull's rendered yaw when the ship aims at AURORA, which at 66.6 degrees is the
# widest bearing on the deck. `renderYaw` saturates through a tanh at
# SHIP_YAW_LIMIT, so that figure is 21.8 at EVERY elevation in the sweep — the
# camera choice does not change how far the hull turns, only what the turn looks
# like. 10 and 16 fill in the middle so a silhouette that collapses partway
# through the arc cannot hide between the ends.
CONTACT_YAWS = [0, 10, 16, 22]

# Contact sheets go somewhere the app will never load. public/ship/ is the live
# sprite set and must not be touched by an exploratory render.
CONTACT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "render-study")

# Which local axis the model's nose points down, BEFORE any correction, in
# BLENDER axes (Z-up) after glTF import.
#
# Set for "Spaceship COLAID1 50k". That model's nose is on glTF +Z — backwards
# from the glTF convention of -Z forward, which is common and harmless. Blender's
# importer maps glTF (x, y, z) to (x, -z, y), so glTF +Z arrives as Blender -Y,
# and this value applies the 180deg correction that turns the tail toward camera.
#
# For a different model: inspect it once, set this, and confirm with the check
# printed at the end of the run.
#   "+Y" nose already points away from camera | "-Y" | "+X" | "-X" | "+Z" | "-Z"
NOSE_AXIS = "-Y"

# Blender's +Z rotation is counter-clockwise seen from above, so it swings a
# nose that points away from camera toward the LEFT. The app's angle convention
# is degrees CLOCKWISE from screen-up, and <ShipSprite> indexes frames by
# STARBOARD yaw, mirroring them with scaleX(-1) for port turns. Left-turning
# frames would therefore be wrong in BOTH directions, not just one. Negating
# here is what reconciles the two conventions.
FLIP_YAW = True

# CYCLES is physically correct and slow; on CPU expect minutes per frame, so
# sixteen frames is a coffee break. EEVEE Next is roughly 50x faster and, for a
# hard-surface hull whose realism lives in baked PBR textures rather than in
# global illumination, gets remarkably close. Start with EEVEE to check framing
# and orientation, then re-run with CYCLES for the frames you ship.
# ------------------------------------------------------------------ lighting
# The cinematic rig, in one place. See setup_lights() for what each one does and
# why it moved. Previous values are kept in the comments as the reference point
# the current look was judged against.
KEY_ENERGY = 5.0            # was 3.2
FILL_ENERGY = 0.10          # was 0.30 — this is the contrast
RIM_ENERGY = 3.6            # was 2.6, and now genuinely blue rather than tinted
BOUNCE_ENERGY = 300.0       # was 220
AMBIENT_STRENGTH = 0.07     # was 0.16 — this is the occlusion in the recesses

# Occlusion multiplied into base colour, on top of what Cycles computes. The
# model is normalised to two units across, so the distance is in that space:
# 0.06 reaches into panel gaps and engine recesses without darkening whole
# surfaces the way a metre-scale radius would.
# Roughness is SCALED, not set, so the artist's variation between the canopy,
# the flats and the recesses survives — the whole range is simply pulled toward
# specular. These were locals inside sharpen_materials() and, because that
# function only ever touched unlinked sockets, had never applied to anything.
ROUGHNESS_SCALE = 0.72
SPECULAR_LEVEL = 0.62

AO_STRENGTH = 0.5
AO_DISTANCE = 0.06

ENGINE = "CYCLES"          # or "BLENDER_EEVEE_NEXT"
SAMPLES = 256              # 96-128 is usually enough with denoising on


def argv_after_dashes():
    return sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []


def clear_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def import_model(path):
    ext = os.path.splitext(path)[1].lower()
    if ext in (".glb", ".gltf"):
        bpy.ops.import_scene.gltf(filepath=path)
    elif ext == ".fbx":
        bpy.ops.import_scene.fbx(filepath=path)
    elif ext == ".obj":
        bpy.ops.wm.obj_import(filepath=path)
    else:
        raise SystemExit(f"Unsupported model format: {ext}")
    return [o for o in bpy.context.scene.objects if o.type == "MESH"]


def select_only(objects, active=None):
    bpy.ops.object.select_all(action="DESELECT")
    for o in objects:
        o.hide_set(False)
        o.hide_viewport = False
        o.hide_render = False
        o.select_set(True)
    bpy.context.view_layer.objects.active = active or objects[0]


def consolidate(meshes):
    """Collapses the import into ONE mesh object with every transform baked in.

    The previous version built an Empty and parented the meshes to it. That was
    the source of an empty render: setting the empty's location to the origin
    already shifts its children by -centre, and the code then shifted them by
    -centre a SECOND time. On a model whose bounding box is 400+ units from the
    origin, the ship simply left the frame — and because the film is
    transparent, the result was a valid, plausible-looking, entirely blank
    image. Nothing errored.

    Baking everything into a single object removes the whole class of problem:
    after this there is exactly one transform in play, and `rotation_euler.z` is
    unambiguously the yaw."""
    select_only(meshes)
    # glTF often parents meshes to empties; drop those but keep world placement.
    bpy.ops.object.parent_clear(type="CLEAR_KEEP_TRANSFORM")
    select_only(meshes)
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    if len(meshes) > 1:
        bpy.ops.object.join()
    obj = bpy.context.view_layer.objects.active
    obj.name = "Ship"

    # THE glTF IMPORTER LEAVES OBJECTS IN QUATERNION MODE, and assigning
    # `rotation_euler` to a quaternion-mode object is SILENTLY IGNORED — no
    # error, no warning, the value simply has no effect. That single line cost a
    # full render cycle: the nose correction baked an identity rotation and
    # every frame came out at yaw 0, so all sixteen were the same picture of a
    # ship facing the wrong way. Set the mode once, here, where the object is
    # created; everything downstream then behaves the way it reads.
    obj.rotation_mode = "XYZ"
    return obj


def normalise(obj):
    """Centres the hull on the origin and scales it to two units across, so the
    camera framing is independent of whatever scale the model shipped in."""
    select_only([obj])
    bpy.ops.object.origin_set(type="ORIGIN_GEOMETRY", center="BOUNDS")
    obj.location = (0.0, 0.0, 0.0)
    bpy.context.view_layer.update()

    span = max(obj.dimensions)
    if span <= 0:
        raise SystemExit("Model has zero size after import — nothing to render")
    obj.scale = (2.0 / span,) * 3
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    bpy.context.view_layer.update()
    return 2.0


def orient_nose(obj):
    """Bakes the nose onto +Y — directly AWAY from the camera, which is what yaw
    0 means for the deck (ship pointing up-screen, engines toward the viewer).

    Applied to the mesh object, so it actually bakes. On an Empty it silently
    would not, and the per-frame yaw below would then overwrite it."""
    corrections = {
        "+Y": (0, 0, 0),
        "-Y": (0, 0, math.pi),
        "+X": (0, 0, math.pi / 2),
        "-X": (0, 0, -math.pi / 2),
        "+Z": (-math.pi / 2, 0, 0),
        "-Z": (math.pi / 2, 0, 0),
    }
    if NOSE_AXIS not in corrections:
        raise SystemExit(f"NOSE_AXIS must be one of {list(corrections)}")
    select_only([obj])
    obj.rotation_mode = "XYZ"
    obj.rotation_euler = corrections[NOSE_AXIS]
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=False)
    bpy.context.view_layer.update()
    print(f"  nose baked from {NOSE_AXIS} onto +Y (away from camera)")


def kill_emission(meshes):
    """Zeroes emissive materials.

    The engine glow stays a LIVE layer in the app so it can respond to
    targeting state and to reduced-motion. Baking it in would mean rendering a
    second set of sixteen frames for the engaged state, and the glow could
    never react to anything."""
    for m in meshes:
        for slot in m.material_slots:
            mat = slot.material
            if not mat or not mat.use_nodes:
                continue
            for node in mat.node_tree.nodes:
                if node.type == "EMISSION":
                    node.inputs["Strength"].default_value = 0.0
                elif node.type == "BSDF_PRINCIPLED":
                    for key in ("Emission Strength",):
                        if key in node.inputs:
                            node.inputs[key].default_value = 0.0


def sharpen_materials(meshes):
    """Tightens roughness and deepens occlusion, on a fully textured asset.

    THIS FUNCTION USED TO DO NOTHING AT ALL. It only touched roughness sockets
    that were NOT linked, and this model drives every channel from textures —
    base colour from an image, metallic and roughness unpacked from one ORM map
    through a Separate Color node. It printed "sharpened 0 unlinked roughness
    input(s)" on every run since it was written, which read like a report and was
    actually a no-op. ROUGHNESS_SCALE and SPECULAR_LEVEL have never once applied.

    So it now works the only way it can on an asset like this: by inserting
    adjustment nodes BETWEEN the texture and the shader, which scales what the
    artist authored rather than replacing it. Panel-to-panel variation, the
    canopy against the hull, the recesses against the flats — all preserved, the
    whole range simply pulled toward specular.

    The occlusion node is the second half of the brief's ask. Cycles already
    computes contact darkening from global illumination, and dropping the ambient
    deepens that for free; this adds a controlled amount on top, at a radius
    small enough to find panel gaps and engine recesses without shading whole
    surfaces.
    """
    touched_rough = 0
    touched_ao = 0

    for mesh in meshes:
        for slot in mesh.material_slots:
            mat = slot.material
            if not mat or not mat.use_nodes:
                continue
            nodes = mat.node_tree.nodes
            links = mat.node_tree.links

            for bsdf in [n for n in nodes if n.type == "BSDF_PRINCIPLED"]:
                rough = bsdf.inputs.get("Roughness")
                if rough is not None:
                    if rough.is_linked:
                        source = rough.links[0].from_socket
                        scale = nodes.new("ShaderNodeMath")
                        scale.operation = "MULTIPLY"
                        scale.use_clamp = True
                        scale.location = (bsdf.location.x - 260, bsdf.location.y - 220)
                        scale.inputs[1].default_value = ROUGHNESS_SCALE
                        links.new(scale.inputs[0], source)
                        links.new(rough, scale.outputs[0])
                        touched_rough += 1
                    else:
                        rough.default_value = max(0.04, rough.default_value * ROUGHNESS_SCALE)
                        touched_rough += 1

                for key in ("Specular IOR Level", "Specular"):
                    spec = bsdf.inputs.get(key)
                    if spec is not None and not spec.is_linked:
                        spec.default_value = SPECULAR_LEVEL
                        break

                base = bsdf.inputs.get("Base Color")
                if base is None or AO_STRENGTH <= 0:
                    continue

                occl = nodes.new("ShaderNodeAmbientOcclusion")
                occl.samples = 16
                occl.inside = False
                occl.only_local = True
                occl.location = (bsdf.location.x - 520, bsdf.location.y + 260)
                occl.inputs["Distance"].default_value = AO_DISTANCE

                try:
                    mixer = nodes.new("ShaderNodeMixRGB")
                    mixer.blend_type = "MULTIPLY"
                    mixer.inputs["Fac"].default_value = AO_STRENGTH
                    a_in, b_in, out = mixer.inputs["Color1"], mixer.inputs["Color2"], mixer.outputs["Color"]
                except RuntimeError:
                    # 4.x replacement, should MixRGB ever be removed.
                    mixer = nodes.new("ShaderNodeMix")
                    mixer.data_type = "RGBA"
                    mixer.blend_type = "MULTIPLY"
                    mixer.inputs[0].default_value = AO_STRENGTH
                    a_in, b_in, out = mixer.inputs[6], mixer.inputs[7], mixer.outputs[2]
                mixer.location = (bsdf.location.x - 260, bsdf.location.y + 200)

                if base.is_linked:
                    links.new(a_in, base.links[0].from_socket)
                else:
                    try:
                        a_in.default_value = base.default_value
                    except (TypeError, ValueError):
                        pass
                links.new(b_in, occl.outputs["Color"])
                links.new(base, out)
                touched_ao += 1

    print(f"  roughness scaled on {touched_rough} input(s), "
          f"occlusion added to {touched_ao} shader(s)")


def setup_camera(span, elevation_deg=None):
    cam_data = bpy.data.cameras.new("DeckCam")
    cam_data.type = "ORTHO"
    cam_data.ortho_scale = span / FILL
    cam_data.clip_start = 0.01
    cam_data.clip_end = 1000.0
    cam = bpy.data.objects.new("DeckCam", cam_data)
    bpy.context.scene.collection.objects.link(cam)

    # Camera on -Y, raised to the deck's elevation, looking at the origin, so
    # "away from the camera" is +Y. Rotating a camera by (90deg - phi) about X
    # turns its -Z view axis onto (0, cos phi, -sin phi), which is exactly the
    # direction from this position back to the origin.
    phi = math.radians(ELEVATION_DEG if elevation_deg is None else elevation_deg)
    dist = 10.0
    cam.location = (0.0, -dist * math.cos(phi), dist * math.sin(phi))
    cam.rotation_euler = (math.radians(90.0) - phi, 0.0, 0.0)

    bpy.context.scene.camera = cam
    print(f"  camera at {tuple(round(v, 2) for v in cam.location)}, "
          f"elevation {math.degrees(phi):.2f}deg, ortho_scale {cam_data.ortho_scale:.2f}")
    return cam


def setup_lights():
    """THE CINEMATIC RIG.

    A viewport render and a cinematic one differ in exactly one thing: how much
    of the frame is allowed to be dark. Every value below moves in that
    direction — the key goes up, everything that fills shadow comes down, and the
    only lights that survive at strength are the ones that describe an edge.

        KEY      the sun. Harder and brighter, and its ANGLE is what matters as
                 much as its energy: a 1.1deg source throws a crisp terminator
                 where a 2deg one throws a soft one, and a soft terminator on a
                 hard-surface hull is the single clearest "viewport" tell.
        FILL     cut to a third. This is the contrast, and it is the ask.
                 Everything the key does not reach is now genuinely dark instead
                 of merely dimmer.
        RIM      cool blue, and now unmistakably so rather than a blue-tinted
                 white. It only ever catches surfaces turned away from camera, so
                 it draws the silhouette without touching the lit faces — which
                 is what separates the hull from space.
        BOUNCE   warm orange off the engines onto the rear fuselage. Raised, and
                 pulled closer so it falls on the belly and nacelle inners rather
                 than washing the whole tail.
        AMBIENT  halved again. Ambient is what fills recesses, so this is most of
                 the panel-gap and engine-recess occlusion the brief asks for —
                 in Cycles the occlusion is computed, not faked, so it deepens on
                 its own the moment there is less sky to fill it.

    DIRECTIONS ARE UNCHANGED. Every angle here is the one that was already
    established: key from upper right, matching the deck's own key light, the
    planets, the hull shading and the floor shadow. This pass changes how hard
    the lights are, never where they are.
    """
    def add_sun(name, energy, rotation, colour=(1, 1, 1), angle_deg=2.0):
        data = bpy.data.lights.new(name, type="SUN")
        data.energy = energy
        data.angle = math.radians(angle_deg)
        data.color = colour
        obj = bpy.data.objects.new(name, data)
        obj.rotation_euler = rotation
        bpy.context.scene.collection.objects.link(obj)
        return obj

    # KEY — upper right. Brighter and much harder than before.
    add_sun("Key", KEY_ENERGY, (math.radians(52), 0, math.radians(-125)),
            (1.0, 0.985, 0.96), angle_deg=1.1)

    # FILL — cool, and now barely present. The contrast lives here.
    add_sun("Fill", FILL_ENERGY, (math.radians(65), 0, math.radians(70)),
            (0.60, 0.73, 0.96), angle_deg=6.0)

    # RIM — two sources, both cool blue. The hard one draws the edge; the soft
    # one keeps the shadow side from going to pure black at the silhouette.
    add_sun("RimHard", RIM_ENERGY, (math.radians(112), 0, math.radians(28)),
            (0.46, 0.67, 1.0), angle_deg=1.6)
    add_sun("RimSoft", RIM_ENERGY * 0.13, (math.radians(88), 0, math.radians(-40)),
            (0.54, 0.71, 1.0), angle_deg=9.0)

    # ENGINE BOUNCE. A warm area source behind and below the tail, standing in
    # for light the exhaust throws back onto the hull. This is the only warm
    # thing in the rig, and it is what stops the underside reading as a flat dark
    # plate: the belly, the inner nacelle faces and the trailing edges pick up an
    # orange that exists nowhere else on the model. It also ties the rendered
    # hull to the live CSS plume — both are the same light, one baked, one drawn.
    bounce_data = bpy.data.lights.new("EngineBounce", type="AREA")
    bounce_data.energy = BOUNCE_ENERGY
    bounce_data.size = 1.9
    bounce_data.color = (1.0, 0.42, 0.14)
    bounce = bpy.data.objects.new("EngineBounce", bounce_data)
    # Camera sits on -Y, so the tail faces -Y. Closer in than before so the
    # falloff concentrates it on the rear fuselage instead of the whole hull.
    bounce.location = (0.0, -1.85, -0.82)
    bounce.rotation_euler = (math.radians(-64), 0.0, 0.0)
    bpy.context.scene.collection.objects.link(bounce)

    world = bpy.data.worlds.new("Void")
    world.use_nodes = True
    # Cool, not neutral. The void the deck lives in is blue, so ambient arriving
    # from it has to be blue as well — a grey ambient would make the hull read as
    # sitting in a photographic studio rather than in this scene.
    world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.04, 0.08, 0.17, 1)
    world.node_tree.nodes["Background"].inputs["Strength"].default_value = AMBIENT_STRENGTH
    bpy.context.scene.world = world
    print(f"  rig: key {KEY_ENERGY} / fill {FILL_ENERGY} / rim {RIM_ENERGY} / "
          f"bounce {BOUNCE_ENERGY} / ambient {AMBIENT_STRENGTH}")


def setup_render(fast):
    """`fast` swaps Cycles for EEVEE.

    USED BY THE CONTACT SHEET AS WELL AS --test, and that is the right default
    for it: the sweep is 28 renders, and at Cycles 256 on CPU that is hours for a
    decision that is entirely about camera elevation. EEVEE resolves silhouette,
    foreshortening and whether the engine bells still face the viewer exactly as
    well. Pass --cycles if a final-quality comparison is wanted instead.
    """
    scene = bpy.context.scene
    engine = "BLENDER_EEVEE_NEXT" if fast else ENGINE
    samples = 64 if fast else SAMPLES
    try:
        scene.render.engine = engine
    except TypeError:
        # Older builds call it BLENDER_EEVEE.
        engine = "BLENDER_EEVEE" if engine.startswith("BLENDER_EEVEE") else "CYCLES"
        scene.render.engine = engine
    if engine == "CYCLES":
        scene.cycles.samples = samples
        scene.cycles.use_denoising = True
    else:
        scene.eevee.taa_render_samples = samples
    print(f"  engine {engine}, {samples} samples")
    scene.render.resolution_x = FRAME_PIXELS
    scene.render.resolution_y = FRAME_PIXELS
    scene.render.resolution_percentage = 100
    scene.render.film_transparent = True
    scene.render.image_settings.color_mode = "RGBA"

    fmt = OUT_FORMAT
    try:
        scene.render.image_settings.file_format = fmt
    except TypeError:
        print(f"  {fmt} unsupported by this Blender build, falling back to PNG")
        fmt = "PNG"
        scene.render.image_settings.file_format = "PNG"

    if fmt == "WEBP":
        scene.render.image_settings.quality = WEBP_QUALITY
    else:
        scene.render.image_settings.compression = 15

    # VIEW TRANSFORM — AgX, DELIBERATELY, AND THIS REVERSES AN EARLIER CALL.
    #
    # The original code intended "Standard" and never applied it: the assignment
    # sat after `return fmt` and was dead, so every frame ever shipped went
    # through Blender 4.x's default AgX by accident. I made it Standard when I
    # found the bug, which was right for the goal at the time — a flat, faithful
    # output to judge a camera angle on.
    #
    # It is the wrong choice for THIS goal. The brief asks for a much harder key
    # and a white hull that does not clip, and those two things are in direct
    # tension under Standard: it has no highlight roll-off at all, so a light
    # grey albedo under a 5.0 sun goes to flat 255 and every panel line in the lit
    # area disappears. AgX compresses the top end instead, which is the entire
    # reason film transforms exist — it is what lets the key be pushed this far
    # and still leave detail in the brightest faces.
    #
    # So: AgX with a contrast look, chosen rather than inherited.
    try:
        scene.view_settings.view_transform = "AgX"
    except TypeError:
        print("  AgX unavailable on this build, leaving the default transform")

    for look in ("AgX - Medium High Contrast", "Medium High Contrast", "AgX - Base Contrast"):
        try:
            scene.view_settings.look = look
            print(f"  view transform {scene.view_settings.view_transform}, look '{look}'")
            break
        except TypeError:
            continue

    return fmt


def render_frames(obj, fmt, test):
    os.makedirs(OUT_DIR, exist_ok=True)
    ext = "webp" if fmt == "WEBP" else "png"
    sign = -1.0 if FLIP_YAW else 1.0
    # Test mode renders only the two frames the orientation check looks at.
    # Getting NOSE_AXIS wrong is the most likely mistake and the most expensive
    # to discover after sixteen full-quality renders.
    yaws = [YAW_START, YAW_END] if test else list(range(YAW_START, YAW_END + 1, YAW_STEP))
    sizes = []
    obj.rotation_mode = "XYZ"  # see the note in consolidate(); never assume
    for i, yaw in enumerate(yaws, 1):
        # The nose correction is already BAKED into the mesh, so this is a
        # clean absolute yaw rather than something layered on top of it.
        obj.rotation_euler = (0.0, 0.0, sign * math.radians(yaw))
        bpy.context.view_layer.update()
        path = os.path.join(OUT_DIR, f"yaw-{yaw:02d}.{ext}")
        bpy.context.scene.render.filepath = path
        bpy.ops.render.render(write_still=True)
        size = os.path.getsize(path) if os.path.exists(path) else 0
        sizes.append(size)
        flag = "  <-- SUSPICIOUSLY SMALL, likely blank" if size < 4000 else ""
        print(f"  [{i}/{len(yaws)}] {os.path.basename(path)}  {size:,} bytes{flag}")

    # Identical frames are the other silent failure: if the yaw never applies,
    # sixteen renders of the same picture come back looking entirely healthy.
    # Frames 75deg apart cannot compress to nearly the same size.
    if len(sizes) >= 2 and sizes[0] > 0:
        drift = abs(sizes[-1] - sizes[0]) / sizes[0]
        if drift < 0.02:
            print(
                f"\n  WARNING: first and last frame differ by only {drift * 100:.1f}% in size.\n"
                "  They are probably the same image, which means the yaw is not\n"
                "  being applied. Check that rotation_mode is XYZ."
            )
    return ext


def render_contact(obj, fmt):
    """Renders the elevation x yaw grid and writes an HTML sheet beside it.

    ONE CELL PER COMBINATION, as separate files rather than a composited image.
    Blender can paste tiles together with numpy, but a folder of full-resolution
    renders plus a page that lays them out is better for the job: the sheet can
    be zoomed to inspect an engine bell, individual cells can be dropped into
    other tools, and nothing has to be re-rendered to change the layout.

    The page is black because that is what these will be seen against. A hull
    judged on a grey contact sheet is judged against a background it will never
    appear on, and silhouette decisions made that way do not survive contact
    with the deck.
    """
    os.makedirs(CONTACT_DIR, exist_ok=True)
    ext = "webp" if fmt == "WEBP" else "png"
    sign = -1.0 if FLIP_YAW else 1.0
    obj.rotation_mode = "XYZ"

    total = len(ELEVATION_SWEEP) * len(CONTACT_YAWS)
    done = 0
    cells = {}

    for elev in ELEVATION_SWEEP:
        setup_camera(2.0, elev)
        for yaw in CONTACT_YAWS:
            obj.rotation_euler = (0.0, 0.0, sign * math.radians(yaw))
            bpy.context.view_layer.update()
            name = f"elev-{elev:05.2f}_yaw-{yaw:02d}.{ext}"
            path = os.path.join(CONTACT_DIR, name)
            bpy.context.scene.render.filepath = path
            bpy.ops.render.render(write_still=True)
            cells[(elev, yaw)] = name
            done += 1
            size = os.path.getsize(path) if os.path.exists(path) else 0
            flag = "  <-- SUSPICIOUSLY SMALL, likely blank" if size < 4000 else ""
            print(f"  [{done}/{total}] {name}  {size:,} bytes{flag}")

    write_contact_sheet(cells, ext)


def write_contact_sheet(cells, ext):
    """Lays the cells out as a black HTML page, one row per elevation."""
    rows = []
    for elev in ELEVATION_SWEEP:
        current = " · current" if abs(elev - ELEVATION_DEG) < 0.01 else ""
        delta = elev - ELEVATION_DEG
        note = f"{delta:+.1f} vs current" if abs(delta) > 0.01 else "reference"
        tiles = "".join(
            f'<figure><img src="{cells[(elev, y)]}" alt="elevation {elev} yaw {y}">'
            f'<figcaption>yaw {y}&deg;</figcaption></figure>'
            for y in CONTACT_YAWS
        )
        rows.append(
            f'<section><h2>{elev:.2f}&deg;{current}'
            f'<span>sin &phi; {math.sin(math.radians(elev)):.3f} &middot; {note}</span></h2>'
            f'<div class="row">{tiles}</div></section>'
        )

    html = """<!doctype html>
<meta charset="utf-8">
<title>Ship camera - elevation study</title>
<style>
  :root { color-scheme: dark; }
  body { margin:0; background:#000; color:#f2f5f8;
         font:13px/1.6 ui-sans-serif,-apple-system,"Segoe UI",sans-serif; padding:40px 28px 80px; }
  h1 { font-size:24px; font-weight:600; letter-spacing:-.02em; margin:0 0 6px; }
  p.lede { color:#98a2ad; max-width:70ch; margin:0 0 8px; }
  p.note { color:#5b646e; max-width:78ch; margin:0 0 28px; font-size:12px; }
  section { border-top:1px solid rgb(255 255 255/.08); padding:16px 0 8px; }
  h2 { font:500 11px/1 ui-monospace,monospace; letter-spacing:.16em; text-transform:uppercase;
       color:#f2f5f8; margin:0 0 12px; display:flex; gap:14px; align-items:baseline; }
  h2 span { color:#5b646e; letter-spacing:.1em; }
  .row { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; }
  figure { margin:0; }
  img { width:100%; display:block; background:#000; }
  figcaption { font:10px/1 ui-monospace,monospace; letter-spacing:.14em; color:#5b646e;
               text-transform:uppercase; padding-top:7px; }
</style>
<h1>Hero camera &mdash; elevation study</h1>
<p class="lede">Seven elevations against the four yaws the deck actually uses. Judge the
engine bells at yaw&nbsp;0 and the silhouette at yaw&nbsp;22.</p>
<p class="note">Yaw&nbsp;22&deg; is the hull's rendered angle when the ship aims at AURORA &mdash; the
widest bearing on the deck at 66.6&deg;. Because <code>renderYaw</code> saturates through a tanh at
SHIP_YAW_LIMIT, that figure is 21.8&deg; at every elevation here: the camera changes what the turn
looks like, never how far it goes. Lighting and materials are unchanged throughout; this pass is
camera only.</p>
""" + "\n".join(rows) + "\n"

    # Created here as well as in render_contact(): this is callable on its own to
    # relayout an existing set of renders, and it should not depend on having
    # just rendered them.
    os.makedirs(CONTACT_DIR, exist_ok=True)
    out = os.path.join(CONTACT_DIR, "index.html")
    with open(out, "w", encoding="utf-8") as handle:
        handle.write(html)
    print(f"\n  contact sheet -> {out}")


def main():
    args = argv_after_dashes()
    if not args:
        raise SystemExit("Usage: blender -b -P scripts/render-ship-frames.py -- <model>")

    test = "--test" in args
    contact = "--contact" in args
    model = next(a for a in args if not a.startswith("--"))

    # --elevation <deg> overrides the camera for a normal render, so the angle
    # chosen off the contact sheet can be shot without editing this file first.
    elevation = ELEVATION_DEG
    if "--elevation" in args:
        elevation = float(args[args.index("--elevation") + 1])

    mode = "  [CONTACT SHEET]" if contact else ("  [TEST: 2 frames, fast]" if test else "")
    print(f"Rendering {model}{mode}")
    if contact:
        print(f"  elevation sweep {ELEVATION_SWEEP}")
        print(f"  yaws {CONTACT_YAWS}")
    else:
        print(f"  camera elevation {elevation:.2f}deg "
              f"(default {ELEVATION_DEG:.2f} from SHIP_CAMERA_TILT {SHIP_CAMERA_TILT})")
    print(f"  yaw {YAW_START}..{YAW_END} step {YAW_STEP} at {FRAME_PIXELS}px")
    print(f"  nose axis {NOSE_AXIS}, flip yaw {FLIP_YAW}")

    clear_scene()
    meshes = import_model(model)
    if not meshes:
        raise SystemExit("No meshes found in the model")
    print(f"  imported {len(meshes)} mesh object(s)")

    obj = consolidate(meshes)
    print(f"  consolidated: {len(obj.data.vertices)} verts, {len(obj.data.polygons)} faces")

    span = normalise(obj)
    print(f"  normalised dimensions {tuple(round(v, 3) for v in obj.dimensions)}")

    orient_nose(obj)
    kill_emission([obj])
    sharpen_materials([obj])
    setup_camera(span, elevation)
    setup_lights()
    fmt = setup_render(test or (contact and "--cycles" not in args))

    # A blank frame is a valid image, so it cannot be caught after the fact —
    # check the hull is actually inside the orthographic frame before spending
    # minutes rendering nothing. This is the exact failure the first version
    # shipped: the ship was hundreds of units off-frame and every render came
    # back a plausible-looking empty square.
    half = (span / FILL) / 2.0
    reach = max(abs(v) for v in obj.dimensions) / 2.0
    if reach > half * 1.05:
        print(f"  WARNING: hull half-extent {reach:.2f} exceeds frame half-width {half:.2f}")
    if max(abs(v) for v in obj.location) > 0.001:
        raise SystemExit(f"Hull is not at the origin: {tuple(obj.location)}")

    if contact:
        # A camera study only. public/ship/ is never written in this mode, so an
        # exploratory run can never clobber the live sprite set.
        render_contact(obj, fmt)
        print("\nOpen render-study/index.html and pick an elevation.")
        print("Then: blender -b -P scripts/render-ship-frames.py -- <model> --elevation <deg>")
        print("and set SHIP_CAMERA_TILT in src/features/spacecraft/shipFrames.ts to sin(that)." + chr(10))
        return

    ext = render_frames(obj, fmt, test)

    print(f"\nWrote {OUT_DIR}")
    print(
        "\nCHECK TWO THINGS BEFORE ENABLING:\n"
        f"  1. yaw-00.{ext} must show the ship from directly BEHIND — engine\n"
        "     nozzles toward you, nose pointing away up-screen. If you are\n"
        "     looking at the nose instead, NOSE_AXIS is wrong.\n"
        f"  2. yaw-75.{ext} must show it turned to the RIGHT (starboard). If it\n"
        "     turned left, set FLIP_YAW = True and re-run.\n"
    )
    if ext == "png":
        print(
            "  This build wrote PNG. Convert to WebP before enabling, or set\n"
            "  the frame extension in shipFrames.ts to match.\n"
        )
    print("Then set SPRITE_ENABLED = true in src/features/spacecraft/shipFrames.ts\n")


if __name__ == "__main__":
    main()
