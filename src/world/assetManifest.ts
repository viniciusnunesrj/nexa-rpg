export type AuroraAsset={
  key:string;
  path:string;
  kind:'image'|'spritesheet';
  frameWidth?:number;
  frameHeight?:number;
};

export const auroraAssets:AuroraAsset[]=[
  {key:'aurora-ground-01',path:'/assets/aurora/terrain/ground-01.png',kind:'image'},
  {key:'aurora-path-edge-01',path:'/assets/aurora/terrain/path-edge-01.png',kind:'image'},
  {key:'aurora-rock-01',path:'/assets/aurora/nature/rock-01.png',kind:'image'},
  {key:'aurora-shrub-01',path:'/assets/aurora/nature/shrub-01.png',kind:'image'},
  {key:'aurora-tree-01',path:'/assets/aurora/nature/tree-01.png',kind:'image'},
  {key:'aurora-wall-01',path:'/assets/aurora/structures/wall-01.png',kind:'image'},
  {key:'aurora-lamp-01',path:'/assets/aurora/structures/lamp-01.png',kind:'image'},
  {key:'kael-idle',path:'/assets/aurora/characters/kael/idle.png',kind:'spritesheet',frameWidth:64,frameHeight:80},
  {key:'kael-walk',path:'/assets/aurora/characters/kael/walk.png',kind:'spritesheet',frameWidth:64,frameHeight:80}
];

export const hasTexture=(scene:Phaser.Scene,key:string)=>scene.textures.exists(key);
