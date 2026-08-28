function catmullRomPath(points, closed = true) {
  const n = points.length;
  const get = (i) => points[((i % n) + n) % n];
  let d = `M${points[0][0].toFixed(2)},${points[0][1].toFixed(2)}`;
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const p0 = get(i - 1), p1 = get(i), p2 = get(i + 1), p3 = get(i + 2);
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C${c1x.toFixed(2)},${c1y.toFixed(2)} ${c2x.toFixed(2)},${c2y.toFixed(2)} ${p2[0].toFixed(2)},${p2[1].toFixed(2)}`;
  }
  if (closed) d += ' Z';
  return d;
}

// Scale points about their own centroid (not the body origin), then apply a
// small centroid shift — this grows each shape in place / toward the tail
// without shooting the head patch past the nose the way a global scale would.
function scaleAndShift(points, scale, shiftX, shiftY) {
  const cx = points.reduce((s, p) => s + p[0], 0) / points.length;
  const cy = points.reduce((s, p) => s + p[1], 0) / points.length;
  return points.map(([x, y]) => [
    cx + (x - cx) * scale + shiftX,
    cy + (y - cy) * scale + shiftY,
  ]);
}

const shapes = {
  navyMain: scaleAndShift([[2,-20],[6,-15],[7,-6],[4,2],[-2,6],[-5,1],[-3,-8],[-1,-16]], 1.4, 0, 0),
  orangeHead: scaleAndShift([[-2,-27],[3,-28],[7,-23],[7,-16],[3,-12],[-1,-15],[-3,-21]], 1.3, 0, 1),
  orangeLower: scaleAndShift([[6,-4],[8,3],[6,9],[2,10],[0,5],[2,-2],[5,-5]], 1.45, 0.5, 2),
  navyLower: scaleAndShift([[1,6],[3,10],[2,16],[-1,17],[-3,12],[-2,7]], 1.5, 0, 2),
  paleAccent: scaleAndShift([[-5,-10],[-2,-13],[1,-10],[0,-5],[-3,-3],[-6,-6]], 1.4, -0.5, 0),
};

for (const [name, pts] of Object.entries(shapes)) {
  console.log(`\n${name}:`);
  console.log(catmullRomPath(pts, true));
}

// Spine lines: a longer primary line and a shorter parallel one, gently curved
console.log('\nspineLine1 (path, stroke only):');
console.log('M1,-24 Q2,-14 0,-2 Q-1,6 1,14');
console.log('\nspineLine2 (path, stroke only):');
console.log('M2.5,-17 Q3,-10 1.5,-4');
