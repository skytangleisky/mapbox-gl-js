const todo = [
];

// Tests not supported on WebGL 1
const skip = [
    "render-tests/model-layer/ground-shadow-fog",
    "render-tests/model-layer/landmark-conflation-multiple-model-layers",
    "render-tests/model-layer/landmark-mbx",
    "render-tests/model-layer/landmark-mbx-shadows",
    "render-tests/model-layer/landmark-emission-strength",
    "render-tests/model-layer/landmark-part-styling-munich-museum",
    "render-tests/model-layer/landmark-part-styling-roughness",
    "render-tests/model-layer/landmark-part-styling-update",
    "render-tests/model-layer/landmark-part-styling-indirect-update",
    "render-tests/model-layer/landmark-part-styling-indirect-update-doors",
    "render-tests/model-layer/landmark-part-styling-door-light-munich-museum",
    "render-tests/model-layer/landmark-part-styling-indirect-doors-no-shadows",
    "render-tests/model-layer/landmark-terrain",
    "render-tests/model-layer/landmark-shadows-terrain",
    "render-tests/model-layer/trees-shadow-scaled",
    "render-tests/model-layer/lighting-3d-mode/model-shadow",
    "render-tests/model-layer/lighting-3d-mode/shadow",
    "render-tests/lighting-3d-mode/fill-extrusion/flood-light/zero-radius",
    "render-tests/lighting-3d-mode/fill-extrusion/flood-light/saturation",
    "render-tests/lighting-3d-mode/fill-extrusion/flood-light/transparency",
    "render-tests/lighting-3d-mode/fill-extrusion/flood-light/with-ao",
    "render-tests/lighting-3d-mode/fill-extrusion/flood-light/with-shadows",
    "render-tests/lighting-3d-mode/fill-extrusion/flood-light/edge-radius",
    "render-tests/lighting-3d-mode/fill-extrusion/flood-light/fog",
    "render-tests/lighting-3d-mode/fill-extrusion/flood-light/interior",
    "render-tests/lighting-3d-mode/fill-extrusion/flood-light/zero-height",
    "render-tests/lighting-3d-mode/fill-extrusion/flood-light/fixed-height",
    "render-tests/lighting-3d-mode/fill-extrusion/flood-light/floating-base",
    "render-tests/lighting-3d-mode/fill-extrusion/flood-light/with-shadows-tangent-light",
    "render-tests/lighting-3d-mode/fill-extrusion/flood-light/with-shadows-zero-light-contribution",
    "render-tests/lighting-3d-mode/fill-extrusion/flood-light/with-shadows-zero-polar-angle",
    "render-tests/lighting-3d-mode/shadow/fill-extrusion",
    "render-tests/lighting-3d-mode/shadow/fill-extrusion-flat-roof",
    "render-tests/lighting-3d-mode/shadow/fill-extrusion-terrain",
    "render-tests/lighting-3d-mode/shadow/fill-extrusion-vertical-scale",
    "render-tests/lighting-3d-mode/shadow/high-pitch-terrain",

    // Orthographic camera projection tests with shadows
    "render-tests/model-layer/camera-projection/with-shadows/camera-orthographic-high-pitch",
    "render-tests/model-layer/camera-projection/with-shadows/camera-orthographic-low-pitch",
    "render-tests/model-layer/camera-projection/with-shadows/camera-orthographic-terrain-zero-pitch",
    "render-tests/model-layer/camera-projection/with-shadows/camera-orthographic-text",
    "render-tests/model-layer/camera-projection/with-shadows/camera-orthographic-viewport-padding",
    "render-tests/model-layer/camera-projection/with-shadows/camera-orthographic-zero-pitch",
    "render-tests/model-layer/buildings-trees-shadows-fog",
    "render-tests/model-layer/buildings-trees-shadows-fog-terrain",
    "render-tests/model-layer/buildings-trees-shadows-casting",

    // Debug wireframe for webgl2 only
    "render-tests/wireframe/globe-high-exaggeration",
    "render-tests/wireframe/multiple-layers",
    "render-tests/wireframe/terrain",
    "render-tests/wireframe/terrain-high-exaggeration",
];

export default {todo, skip};
