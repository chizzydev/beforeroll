// Browser- and test-shared timetable geometry. All values are local wall clock minutes;
// no timestamps, dates, timezone conversion, or legal scope is inferred here.
import {clockToMinutes,toTime} from './engine.mjs';
export function timelineGeometry(sceneStart,sceneEnd,documentedCutoff=null){
 const start=clockToMinutes(sceneStart),end=clockToMinutes(sceneEnd),cutoff=clockToMinutes(documentedCutoff);
 const validScene=start!==null&&end!==null&&end>start;
 const sample=[...(validScene?[start,end]:[]),...(cutoff!==null?[cutoff]:[])];
 let axisStart=13*60,axisEnd=19*60;
 if(sample.length&&(Math.min(...sample)<axisStart||Math.max(...sample)>axisEnd)){
  axisStart=Math.max(0,(Math.floor(Math.min(...sample)/60)-1)*60);
  axisEnd=Math.min(24*60,(Math.ceil(Math.max(...sample)/60)+1)*60);
  if(axisEnd-axisStart<6*60){
   axisStart=Math.max(0,Math.min(axisStart,24*60-6*60));axisEnd=axisStart+6*60;
  }
 }
 const span=axisEnd-axisStart;
 const pct=value=>100*(value-axisStart)/span;
 const bar=validScene?{left:pct(start),width:pct(end)-pct(start)}:null;
 const cutoffPercent=cutoff!==null&&cutoff>=axisStart&&cutoff<=axisEnd?pct(cutoff):null;
 const ticks=[];for(let t=axisStart;t<=axisEnd;t+=60)ticks.push(t===24*60?'24:00':toTime(t));
 return {axisStart,axisEnd,ticks,bar,cutoffPercent,pastCutoff:validScene&&cutoff!==null&&end>cutoff};
}
