export type Point={x:number;y:number};
export type DepthLine={left:Point;right:Point};

export const interpolateDepthY=(line:DepthLine,x:number)=>{
  const span=line.right.x-line.left.x;
  if(Math.abs(span)<.001)return line.left.y;
  const t=Phaser.Math.Clamp((x-line.left.x)/span,0,1);
  return Phaser.Math.Linear(line.left.y,line.right.y,t);
};

export const pointInPolygon=(point:Point,poly:Point[])=>{
  let inside=false;
  for(let i=0,j=poly.length-1;i<poly.length;j=i++){
    const a=poly[i],b=poly[j];
    const hit=((a.y>point.y)!==(b.y>point.y)) &&
      point.x<(b.x-a.x)*(point.y-a.y)/(b.y-a.y)+a.x;
    if(hit)inside=!inside;
  }
  return inside;
};
