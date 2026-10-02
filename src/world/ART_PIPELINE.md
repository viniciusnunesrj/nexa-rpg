# Aurora visual pipeline

The procedural scene is scaffolding only. Final world art must be replaceable without rewriting gameplay.

## Target
- 3/4 top-down 2.5D perspective.
- Detailed modular terrain, not a single baked background.
- Separate ground, low props, actors, tall props/roofs and atmosphere.
- Warm practical lights at Aurora; cyan technology; violet Nexus energy.
- Character target: 48x64 to 64x80 per animation frame, tested in-world before choosing a final sheet size.

## Asset slots
Original or properly licensed assets belong under public/assets/aurora:
- terrain: ground tiles, path edges, cliff edges, water edges.
- structures: Aurora walls, roofs, stalls and bridge pieces.
- nature: trees, shrubs, rocks and flowers.
- fx: light masks, particles and rift animation.
- characters/kael: idle, walk and attack sprite sheets.

Gameplay collision and positions remain data-driven in auroraLayout.ts, so art can be replaced independently.

## Rule
Do not expand gameplay systems until a small Aurora slice reaches the approved visual bar.
