// Source-pixel camera plans. No native editor or render is invoked here.
export const GAME_VIEWPORT = {
  width: 1080, height: 1200, mainCenter: [540, 1100],
  safePlayerBounds: {x: [110, 970], y: [260, 1110], headroomSourcePx: 85, footroomSourcePx: 16},
  coverageMarginPx: 3
};
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const mix = (a, b, u) => a + (b - a) * u;
const smooth = u => {u = clamp(u, 0, 1); return u * u * (3 - 2 * u);};
const rotate = (p, radians) => [p[0] * Math.cos(radians) - p[1] * Math.sin(radians), p[0] * Math.sin(radians) + p[1] * Math.cos(radians)];
const pulse = (t, at, duration = .23) => {
  const dt = t - at;
  if (dt < 0 || dt > duration) return 0;
  return dt <= 1 / 30 ? dt * 30 : 1 - smooth((dt - 1 / 30) / (duration - 1 / 30));
};
function samplePlayer(shot, time) {
  const rows = shot.focus;
  if (!rows?.length) throw Error('Game shot has no recorded player focus');
  time = clamp(time, rows[0].t, rows.at(-1).t);
  let i = 0;
  while (i + 1 < rows.length && rows[i + 1].t < time) i++;
  const a = rows[i], b = rows[Math.min(i + 1, rows.length - 1)], u = b.t === a.t ? 0 : (time - a.t) / (b.t - a.t);
  return [mix(a.x, b.x, u) - 110, mix(a.y, b.y, u) + 35];
}
const profiles = {
  0: {name: 'core-socket-path', scale: 1.68},
  1: {name: 'fit-reveal-run', scale: 1.38},
  5: {name: 'carry-core-to-socket', scale: 1.47},
  6: {name: 'socket-rise-landing', scale: 1.49},
  7: {name: 'ascent-player-to-landing', scale: 1.42},
  8: {name: 'hearth-release', scale: 1.47},
  9: {name: 'rta-route-first-jump', scale: 1.34},
  10: {name: 'rta-route-next-jump', scale: 1.56},
  11: {name: 'rta-fit-decide', scale: 1.63},
  12: {name: 'rta-final-ascent', scale: 1.39}
};
function target(shot, time, role, sampleTime = time) {
  const d = shot.b - shot.a, player = samplePlayer(shot, time), q = samplePlayer(shot, clamp(sampleTime, 0, d));
  if (role === 'core') return {kind: 'point', role: 'carried-core-vicinity', point: [q[0] + 55, q[1] + 8], sampleTime};
  if (role === 'socket') return {kind: 'point', role: 'first-socket-vicinity', point: [q[0] - 18, q[1] - 8], sampleTime};
  if (role === 'platform') return {kind: 'point', role: 'first-raised-platform', point: [q[0] + 290, q[1] - 88], sampleTime};
  if (role === 'hearth') return {kind: 'point', role: 'hearth-vicinity', point: [q[0] - 10, q[1] - 78], sampleTime};
  if (role === 'landing') return {kind: 'point', role: 'upcoming-player-footfall', point: [q[0], q[1] + 35], sampleTime};
  return {kind: 'player', role: 'recorded-player', point: player, sampleTime: time};
}
function intent(shot, index, time) {
  const d = shot.b - shot.a, fit = 199 / 30 - shot.offset;
  let cues;
  if (index === 0) cues = [[0, 'core'], [.3, 'core'], [.5, 'socket'], [.72, 'socket'], [1.03, 'platform']];
  else if (index === 1) cues = [[0, 'platform'], [.2, 'platform'], [.43, 'player'], [1, 'landing', 1.1], [1.3, 'player']];
  else if ([5, 6, 11].includes(index)) cues = [[0, 'core'], [Math.max(.2, fit - .33), 'core'], [Math.max(.4, fit - .1), 'socket', fit], [Math.min(d, fit + .18), 'platform', fit], [Math.min(d, fit + .5), 'player']];
  else if (index === 8) cues = [[0, 'player'], [Math.min(d - .4, 2.8), 'player'], [Math.min(d, 3.2), 'hearth', 14 - shot.offset]];
  else if (index === 10) cues = [[0, 'player'], [.35, 'landing', .8], [.63, 'player'], [1.1, 'landing', 1.5], [1.37, 'player']];
  else cues = [[0, 'player'], [.23, 'landing', .65], [.47, 'player'], [Math.min(d - .4, 1.2), 'landing', Math.min(d, 1.65)], [Math.min(d, 1.53), 'player']];
  cues = cues.map(c => [clamp(c[0], 0, d), c[1], c[2]]).sort((a, b) => a[0] - b[0]);
  let a = cues[0], b = cues[0];
  for (const cue of cues) { if (cue[0] <= time) a = cue; else {b = cue; break;} b = a; }
  const ta = target(shot, time, a[1], a[2] ?? time), tb = target(shot, time, b[1], b[2] ?? time);
  const u = a === b || a[0] === b[0] ? 0 : smooth((time - a[0]) / (b[0] - a[0]));
  const desired = entry => entry.kind === 'player' ? [entry.point[0] + 95, entry.point[1] - 45] : entry.point;
  const fa = desired(ta), fb = desired(tb), focus = [mix(fa[0], fb[0], u), mix(fa[1], fb[1], u)];
  return {focus, focusTarget: u > 0 && u < 1 ? {kind: 'point', role: `${ta.role} -> ${tb.role}`, point: focus, sampleTime: time, blend: u} : (u === 1 ? tb : ta)};
}
export function solveCamera(source, viewport, focus, scale, rotation, player, recoil = [0, 0]) {
  const angle = rotation * Math.PI / 180, cs = Math.abs(Math.cos(angle)), sn = Math.abs(Math.sin(angle));
  const center = [viewport.width / 2, viewport.height / 2], margin = viewport.coverageMarginPx;
  const half = [(cs * viewport.width + sn * viewport.height + margin * 2) / (2 * scale),
    (sn * viewport.width + cs * viewport.height + margin * 2) / (2 * scale)];
  if (half[0] * 2 > source.width || half[1] * 2 > source.height) throw Error('Camera scale cannot cover the viewport');
  const kick = rotate(recoil, -angle), requested = [focus[0] - kick[0] / scale, focus[1] - kick[1] / scale];
  const bounded = p => [clamp(p[0], half[0], source.width - half[0]), clamp(p[1], half[1], source.height - half[1])];
  let actual = bounded(requested);
  const screen = p => {const v = rotate([p[0] - actual[0], p[1] - actual[1]], angle); return [center[0] + v[0] * scale, center[1] + v[1] * scale];};
  for (let i = 0; i < 2; i++) {
    const current = screen(player), safe = viewport.safePlayerBounds;
    const error = [current[0] - clamp(current[0], ...safe.x), current[1] - clamp(current[1], ...safe.y)];
    const delta = rotate(error, -angle);
    actual = bounded([actual[0] + delta[0] / scale, actual[1] + delta[1] / scale]);
  }
  const sourceCenter = [source.width / 2, source.height / 2], offset = rotate([sourceCenter[0] - actual[0], sourceCenter[1] - actual[1]], angle);
  return {clampedFocus: actual, position: [center[0] + offset[0] * scale, center[1] + offset[1] * scale, 0],
    playerScreen: screen(player), clamp: {x: Math.abs(actual[0] - requested[0]) > .001, y: Math.abs(actual[1] - requested[1]) > .001}};
}
export function buildGameMotion(shot, source, index) {
  const d = shot.b - shot.a, profile = profiles[index] || {name: 'player-led-follow', scale: 1.45}, keys = [];
  const exactHits = [1.3, 16.9333333333, 19.5333333333, 20.8333333333, 22.1333333333, 27.1333333333, 29.8333333333, 32.5333333333];
  for (let frame = 0; frame <= Math.round(d * 30); frame++) {
    const time = frame / 30, player = samplePlayer(shot, time), aim = intent(shot, index, time);
    const entry = (1 - smooth(time / .1666666667)) * (index % 2 ? .12 : .08);
    let impact = 0, sign = index % 2 ? 1 : -1;
    for (const at of exactHits) if (at >= shot.a && at < shot.b) impact = Math.max(impact, pulse(shot.a + time, at));
    const scale = clamp(profile.scale + entry + impact * .16, 1.25, 1.8);
    const rotation = impact * sign * .75;
    const recoil = [impact * sign * 15, impact * 10];
    const solved = solveCamera(source, GAME_VIEWPORT, aim.focus, scale, rotation, player, recoil);
    keys.push({time, sourceTime: shot.offset + time, scale, rotation, focus: aim.focus, focusTarget: aim.focusTarget, player,
      anchor: [source.width / 2, source.height / 2, 0], ...solved});
  }
  return {profile: profile.name, viewport: GAME_VIEWPORT, scaleRange: [Math.min(...keys.map(k => k.scale)), Math.max(...keys.map(k => k.scale))], keys};
}
