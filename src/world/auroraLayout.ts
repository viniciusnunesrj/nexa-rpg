export type WorldProp={id:string;x:number;y:number;depth:number;collision?:{w:number;h:number};asset?:string};

export const auroraLayout={
  size:{width:2200,height:1400},
  landmarks:[
    {id:'outpost',x:410,y:275,depth:8,collision:{w:420,h:220}},
    {id:'rift',x:1640,y:350,depth:9,collision:{w:330,h:150}},
    {id:'ruins',x:1600,y:955,depth:12,collision:{w:390,h:155}}
  ] satisfies WorldProp[],
  vegetation:[
    {id:'tree-1',x:735,y:500,depth:48},{id:'tree-2',x:880,y:430,depth:48},
    {id:'tree-3',x:1180,y:620,depth:48},{id:'tree-4',x:1320,y:820,depth:48},
    {id:'tree-5',x:720,y:860,depth:48},{id:'tree-6',x:1420,y:690,depth:48}
  ] satisfies WorldProp[]
} as const;
