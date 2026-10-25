import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {timelineGeometry} from '../src/timeline.mjs';
test('Scene 15 geometry is positioned in 13:00–19:00 axis',()=>{
 const g=timelineGeometry('16:05','17:20','17:00');
 assert.deepEqual([g.axisStart,g.axisEnd],[780,1140]);
 assert.ok(Math.abs(g.bar.left-51.3888888889)<1e-5);
 assert.ok(Math.abs(g.bar.width-20.833333333)<1e-5);
 assert.ok(Math.abs(g.cutoffPercent-66.66666666)<1e-5);
 assert.equal(g.pastCutoff,true);
});
test('later variation scenes are not silently clipped at 19:00',()=>{
 const g=timelineGeometry('20:10','20:45','18:00');
 assert.ok(g.axisStart<=18*60);assert.ok(g.axisEnd>=21*60);
 assert.ok(g.bar.left>0&&g.bar.left+g.bar.width<100);
 assert.ok(g.cutoffPercent>0&&g.cutoffPercent<100);
});
test('unknown/invalid clocks do not generate authoritative geometry',()=>{
 const u=timelineGeometry('25:00','01:30',null);
 assert.equal(u.bar,null);assert.equal(u.cutoffPercent,null);
 const n=timelineGeometry('23:50','00:20','23:30');
 assert.equal(n.bar,null,'overnight not treated as same-day window');
});
test('strict-CSP templates contain no inline HTML style attributes',()=>{
 const js=readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
 assert.ok(!/\bstyle\s*=/.test(js),'style attr blocked by CSP');
 assert.ok(js.includes('applyCspSafeGeometry();'),'imperative validated positioning applied after render');
 assert.ok(js.includes('data-left-percent'),'timeline geometry descriptor remains');
});
