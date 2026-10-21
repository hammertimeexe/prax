"""Praxis Intersection mark as a 3D object, from packages/ui/src/mark.tsx (64-unit grid).

  frame: outline square, outer 0..40, inner 6..34 (rect 3..37, stroke 6)  -> "theory"
  solid: square 24..64                                                    -> "practice"
  core:  orange square 17..38                                             -> where they meet

Run: blender -b -P blender/mark.py -- <out.glb>
Built in Blender's front view (X right, Z up, depth along +Y away from the viewer),
so after glTF export (Y up) the mark faces +Z, towards a default three.js camera.
"""
import sys
import bpy
import bmesh

out = sys.argv[sys.argv.index("--") + 1]
S = 1 / 16  # 64 grid -> 4 units


def clear():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def box(name, x0, y0, x1, y1, depth, front=0.0):
    """Axis box from SVG coords (y down), spanning depth from `front` backwards (+Y)."""
    bx0, bx1 = (x0 - 32) * S, (x1 - 32) * S
    bz0, bz1 = -(y1 - 32) * S, -(y0 - 32) * S
    mesh = bpy.data.meshes.new(name)
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co.x = bx0 if v.co.x < 0 else bx1
        v.co.z = bz0 if v.co.z < 0 else bz1
        v.co.y = front if v.co.y < 0 else front + depth
    bm.to_mesh(mesh)
    bm.free()
    return obj


def material(name, color, emission=None, strength=0.0, rough=0.35, metal=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    p = m.node_tree.nodes.get("Principled BSDF")
    p.inputs["Base Color"].default_value = (*color, 1)
    p.inputs["Roughness"].default_value = rough
    p.inputs["Metallic"].default_value = metal
    if emission:
        p.inputs["Emission Color"].default_value = (*emission, 1)
        p.inputs["Emission Strength"].default_value = strength
    return m


def bevel(obj, width, segments=5):
    mod = obj.modifiers.new("Bevel", "BEVEL")
    mod.width = width
    mod.segments = segments
    mod.limit_method = "ANGLE"
    mod.harden_normals = False
    return mod


def boolean_cut(target, cutter):
    mod = target.modifiers.new("Cut", "BOOLEAN")
    mod.operation = "DIFFERENCE"
    mod.object = cutter
    bpy.context.view_layer.objects.active = target
    bpy.ops.object.modifier_apply(modifier=mod.name)
    bpy.data.objects.remove(cutter, do_unlink=True)


clear()

# Theory: the outline frame, thin and in front.
frame = box("frame", 0, 0, 40, 40, depth=6 * S, front=-4 * S)
hole = box("hole", 6, 6, 34, 34, depth=20 * S, front=-10 * S)
boolean_cut(frame, hole)
frame.data.materials.append(material("Frame", (0.92, 0.91, 0.88), rough=0.22))
bevel(frame, 0.035)

# Practice: the solid square, deep, behind.
solid = box("solid", 24, 24, 64, 64, depth=14 * S, front=0)
solid.data.materials.append(material("Solid", (0.02, 0.02, 0.022), rough=0.18, metal=0.2))
bevel(solid, 0.05)

# Where they meet: the orange core, standing proud of both.
core = box("core", 17, 17, 38, 38, depth=16 * S, front=-6 * S)
core.data.materials.append(material("Core", (1.0, 0.05, 0.0), emission=(1.0, 0.19, 0.004), strength=3.0, rough=0.3))
bevel(core, 0.03)

for o in (frame, solid, core):
    o.select_set(True)
    bpy.context.view_layer.objects.active = o
    bpy.ops.object.shade_smooth_by_angle()
    o.select_set(False)

bpy.ops.export_scene.gltf(filepath=out, export_format="GLB", export_apply=True, export_yup=True)
print("EXPORTED", out)
