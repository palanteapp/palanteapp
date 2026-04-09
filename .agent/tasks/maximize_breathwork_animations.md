# Task: Maximize Breathwork Animations

## Objective
Resize all three breathwork animations (Box, 4-7-8, Coherent) to maximize their usage of the screen space (340x340 container) without clipping.

## Analysis & Adjustments

### 1. Box Breathing (`SacredBoxDynamics`)
- **Current State**: 
    - Container: 340x340 (Radius 170)
    - Max Square Width: ~250px
    - Max Diagonal: ~353px (Radius ~176.5px)
    - Status: **Likely Clipping** at corners during full expansion + rotation.
- **Adjustment**:
    - Reduce max expansion slightly to ensure diagonal fits within 340px circle (max diagonal ~330px to be safe).
    - `maxSquareWidth` should be around `330 / 1.414 ≈ 233px`.
    - Adjust `baseSize` or `expansionGap`.

### 2. 4-7-8 Breathing (`MandalaBloom`)
- **Current State**:
    - Max Extent: ~115.5px (Radius)
    - Available Radius: ~170px
    - Status: **Too Small** (Using ~68% of space).
- **Adjustment**:
    - Increase `maxRadius` significantly.
    - Target extent: ~160px.
    - `maxRadius` controls the petal placement.

### 3. Coherent Breathing (`FlowerOfLife`)
- **Current State**:
    - Max Extent: ~80px (Radius)
    - Available Radius: ~170px
    - Status: **Too Small** (Using ~47% of space).
- **Adjustment**:
    - Increase `baseRadius`.
    - Target extent: ~160px.
    - If structure is 2 rings: `2 * baseRadius * expansion ≈ 160`.
    - `baseRadius` should be ~70px.

## Plan
1.  **Edit `Breathing.tsx`**:
    -   **Box**: Tune down slightly to prevent corner clip (`expansionGap` 35 -> 32?).
    -   **4-7-8**: Scale up `maxRadius` (105 -> ~150).
    -   **Coherent**: Scale up `baseRadius` (35 -> ~70).
2.  **Verify**:
    -   Open in browser (subagent) and take screenshots of "Inhale/Hold" phases to verify sizing.
