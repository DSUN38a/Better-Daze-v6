const {test}=require('node:test');const assert=require('node:assert/strict');const vm=require('node:vm');const fs=require('node:fs');const path=require('node:path');
const vendor=fs.readFileSync(path.join(__dirname,'../vendor/suncalc.js'),'utf8');
const ctx={window:{}};vm.createContext(ctx);vm.runInContext(vendor,ctx);
test('local sunrise calculation produces plausible London summer and winter daylight',()=>{for(const [date,min,max] of [['2026-06-21T12:00:00Z',16,17],['2026-12-21T12:00:00Z',7,9]]){const t=ctx.window.SunCalc.getTimes(new Date(date),51.51,-.13);const hours=(t.sunset-t.sunrise)/3600000;assert.ok(hours>min&&hours<max);assert.ok(t.sunrise<t.sunset)}});
test('polar no-crossing times are detectable for system-theme fallback',()=>{const t=ctx.window.SunCalc.getTimes(new Date('2026-06-21T12:00:00Z'),89,0);assert.ok(!t.sunrise||!t.sunset||!Number.isFinite(+t.sunrise)||!Number.isFinite(+t.sunset))});
