"""
Renders the spacecraft's yaw frames for the Command Deck.

    blender --background --python scripts/render-ship-frames.py -- path/to/ship.glb

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
# 0.55 is 33.4deg — a LOW rear three-quarter. An earlier pass ran this at 51deg
# chasing "more top surface" and that was the wrong read of the reference: at
# 51deg you are looking down steeply enough that the engine bells foreshorten to
# slivers and stop facing the viewer, which is the single most recognisable
# thing about the hero shot. The bells reading as circles pointed at camera is
# worth more than the extra dorsal detail.
#
# <ShipSprite> absorbs the plane/ship mismatch by mapping bearings to frames
# through this SAME constant, so the nose still lines up with its bearing.
SHIP_CAMERA_TILT = 0.55                 # shipFrames.ts — NOT ORBIT_TILT
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
    """Tightens roughness and lifts specular for metallic contrast.

    The model ships with game-engine-friendly materials: fairly rough, fairly
    flat, tuned to look acceptable under any lighting. That is the right choice
    for a game and the wrong one for a hero render, where the hull only reads as
    METAL if highlights are tight enough to travel across a panel as it turns.

    Scaling roughness rather than setting it preserves the artist's variation
    between materials — the canopy stays glossier than the hull, the recesses
    stay duller than the flats — while pulling the whole range toward specular.
    Setting a flat value would erase exactly the material distinctions that make
    the thing look built.

    Only touches roughness and specular level. Base colour, metallic and normal
    maps are left alone: those carry the model's identity."""
    ROUGHNESS_SCALE = 0.72
    SPECULAR_LEVEL = 0.62
    touched = 0
    for m in meshes:
        for slot in m.material_slots:
            mat = slot.material
            if not mat or not mat.use_nodes:
                continue
            for node in mat.node_tree.nodes:
                if node.type != "BSDF_PRINCIPLED":
                    continue
                rough = node.inputs.get("Roughness")
                # Skip if roughness is driven by a texture — scaling the socket
                # default would do nothing and quietly mislead.
                if rough is not None and not rough.is_linked:
                    rough.default_value = max(0.04, rough.default_value * ROUGHNESS_SCALE)
                    touched += 1
                for key in ("Specular IOR Level", "Specular"):
                    spec = node.inputs.get(key)
                    if spec is not None and not spec.is_linked:
                        spec.default_value = SPECULAR_LEVEL
                        break
    print(f"  sharpened {touched} unlinked roughness input(s)")


def setup_camera(span):
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
    phi = math.radians(ELEVATION_DEG)
    dist = 10.0
    cam.location = (0.0, -dist * math.cos(phi), dist * math.sin(phi))
    cam.rotation_euler = (math.radians(90.0) - phi, 0.0, 0.0)

    bpy.context.scene.camera = cam
    print(f"  camera at {tuple(round(v, 2) for v in cam.location)}, ortho_scale {cam_data.ortho_scale:.2f}")
    return cam


def setup_lights():
    """One key from the upper right, a weak cool fill, and a rim.

    Deliberately low fill: diffuse fill is what flattens a form, and the deck's
    CSS lighting was cut 15% for the same reason. Let the key describe the hull
    and keep the fill just strong enough that the shadow side is not black."""
    def add_sun(name, energy, rotation, colour=(1, 1, 1)):
        data = bpy.data.lights.new(name, type="SUN")
        data.energy = energy
        data.angle = math.radians(2.0)
        data.color = colour
        obj = bpy.data.objects.new(name, data)
        obj.rotation_euler = rotation
        bpy.context.scene.collection.objects.link(obj)
        return obj

    # Energies are deliberately restrained. The first pass ran the key at 4.5
    # and the hull clipped to flat white — every panel line and every bevel that
    # made this model worth choosing washed out. On a light grey albedo under a
    # Standard view transform there is no highlight roll-off to save you, so the
    # key has to sit below clipping and let the material do the work.
    add_sun("Key", 3.2, (math.radians(52), 0, math.radians(-125)), (1.0, 0.98, 0.95))
    add_sun("Fill", 0.30, (math.radians(65), 0, math.radians(70)), (0.66, 0.76, 0.95))
    # TWO rims, not one. A single broad rim lifts the whole silhouette evenly,
    # which is just fill from behind. A hard, narrow rim opposite the key is
    # what actually draws the EDGE — it catches only surfaces turned away from
    # camera and leaves the flats dark, so panel breaks and bevels read as
    # geometry instead of as texture. The second, softer one keeps the shadow
    # side from going to pure black.
    add_sun("RimHard", 2.6, (math.radians(112), 0, math.radians(28)), (0.82, 0.90, 1.0))
    add_sun("RimSoft", 0.8, (math.radians(88), 0, math.radians(-40)), (0.70, 0.80, 1.0))

    # ENGINE BOUNCE. A warm point source behind and below the tail, standing in
    # for light the exhaust throws back onto the hull. This is the layer that
    # stops the underside reading as a flat dark plate: the belly, the inner
    # nacelle faces and the trailing edges pick up an orange that exists nowhere
    # else on the model, so the eye reads them as lit BY something rather than
    # merely less lit. It also ties the rendered hull to the live CSS plume —
    # both are the same light, one baked and one drawn.
    bounce_data = bpy.data.lights.new("EngineBounce", type="AREA")
    bounce_data.energy = 220.0
    bounce_data.size = 2.2
    bounce_data.color = (1.0, 0.44, 0.16)
    bounce = bpy.data.objects.new("EngineBounce", bounce_data)
    # Camera sits on -Y, so the tail faces -Y; drop it below the hull too.
    bounce.location = (0.0, -2.1, -1.0)
    bounce.rotation_euler = (math.radians(-64), 0.0, 0.0)
    bpy.context.scene.collection.objects.link(bounce)

    world = bpy.data.worlds.new("Void")
    world.use_nodes = True
    # Cool, not neutral. The void the deck lives in is blue, so ambient arriving
    # from it has to be blue as well — a grey ambient would make the hull read as
    # sitting in a photographic studio rather than in this scene.
    world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.05, 0.09, 0.18, 1)
    # Lower than before: ambient is what fills recesses, and recesses that are
    # not dark are not recesses. This is the single biggest lever on how
    # "machined" the hull reads.
    world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.16
    bpy.context.scene.world = world


def setup_render(test):
    scene = bpy.context.scene
    engine = "BLENDER_EEVEE_NEXT" if test else ENGINE
    samples = 48 if test else SAMPLES
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

    return fmt
    # Filmic crushes the specular highlights this hull depends on.
    try:
        scene.view_settings.view_transform = "Standard"
    except TypeError:
        pass


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


def main():
    args = argv_after_dashes()
    if not args:
        raise SystemExit("Usage: blender -b -P scripts/render-ship-frames.py -- <model>")

    test = "--test" in args
    model = next(a for a in args if not a.startswith("--"))
    print(f"Rendering {model}{'  [TEST: 2 frames, fast]' if test else ''}")
    print(f"  camera elevation {ELEVATION_DEG:.2f}deg (from SHIP_CAMERA_TILT {SHIP_CAMERA_TILT})")
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
    setup_camera(span)
    setup_lights()
    fmt = setup_render(test)

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
