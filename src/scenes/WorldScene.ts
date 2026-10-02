import Phaser from 'phaser';
import { interpolateDepthY, type DepthLine, type Point } from '../world/depthGeometry';
import { AURORA_DESERT } from '../world/auroraDesert';

const TEST_ASSET_KEY='aurora-rock-test';
const TEST_ASSET_PATH='/assets/aurora/nature/rock-test.png';
const DESERT_ASSETS={
  ground:'/assets/aurora/nature/terreno-rochoso.png',
  rock:'/assets/aurora/nature/rocha-deserto-01.png',
  plant:'/assets/aurora/nature/vegetacao-seca-01.png',
  tree:'/assets/aurora/nature/arvore-seca-01.png',
  ruin:'/assets/aurora/nature/ruina-nexa-01.png',
  crystal:'/assets/aurora/nature/cristal-nexa-01.png'
} as const;

export class WorldScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: Record<'W'|'A'|'S'|'D', Phaser.Input.Keyboard.Key>;
  private playerLabel!: Phaser.GameObjects.Text;
  private touchTarget?: Phaser.Math.Vector2;
  private ambientLights: Phaser.GameObjects.Arc[] = [];
  private occluders!: Phaser.Physics.Arcade.StaticGroup;
  private artTestCollision?: Phaser.GameObjects.Zone;
  private artTestCollisions: Phaser.GameObjects.Zone[]=[];
  private depthProps: { object: Phaser.GameObjects.GameObject; baseY: number }[] = [];
  private artTestRock?: Phaser.GameObjects.Image;
  private artTestSortY=620;
  private artTestDepthLine:DepthLine={left:{x:1018,y:596},right:{x:1168,y:620}};
  private artTestFootprint:Point[]=[
    {x:1028,y:600},{x:1154,y:613},{x:1164,y:632},{x:1088,y:646},{x:1020,y:627}
  ];
  private artDebug?: Phaser.GameObjects.Graphics;
  private cameraZoom=1.18;

  constructor() { super('WorldScene'); }

  preload(){
    // Micro-test only: a missing asset must never break the scene.
    this.load.image(TEST_ASSET_KEY,TEST_ASSET_PATH);
    Object.entries(DESERT_ASSETS).forEach(([key,path])=>this.load.image(`desert-${key}`,path));
    this.load.once(Phaser.Loader.Events.FILE_LOAD_ERROR,(file:Phaser.Loader.File)=>{
      if(file.key===TEST_ASSET_KEY) this.textures.remove(TEST_ASSET_KEY);
    });
  }

  create() {
    const {width:W,height:H}=AURORA_DESERT;
    this.physics.world.setBounds(0,0,W,H);
    this.cameras.main.setBounds(0,0,W,H);
    this.drawTerrain(W,H);
    this.drawAuroraOutpost();
    this.drawNexusRift();
    this.drawVertexRuins();
    this.drawWaterAndBridge();
    this.placeArtTest();
    this.buildWorldDepth();
    this.addAtmosphere();

    const tex=this.add.graphics();
    tex.fillStyle(0x111827); tex.fillEllipse(18,31,30,13);
    tex.fillStyle(0x28364b); tex.fillRoundedRect(7,8,22,27,6);
    tex.fillStyle(0xd7e4e8); tex.fillTriangle(8,12,18,2,29,13);
    tex.fillStyle(0x5ce8ed); tex.fillRect(11,14,14,4);
    tex.fillStyle(0x17202e); tex.fillRect(5,21,26,12);
    tex.fillStyle(0x63e6ed); tex.fillRect(6,23,3,7);
    tex.generateTexture('kael',36,40); tex.destroy();

    this.player=this.physics.add.sprite(AURORA_DESERT.spawn.x,AURORA_DESERT.spawn.y,'kael').setDepth(40);
    this.player.setCollideWorldBounds(true);
    this.player.body?.setSize(20,18).setOffset(8,20);
    this.physics.add.collider(this.player,this.occluders);
    this.artTestCollisions.forEach(zone=>this.physics.add.collider(this.player,zone));
    this.playerLabel=this.add.text(this.player.x,this.player.y-38,'Kael · Rank E',{
      fontFamily:'monospace',fontSize:'13px',color:'#eefeff',stroke:'#071018',strokeThickness:5
    }).setOrigin(.5).setDepth(41);

    this.cursors=this.input.keyboard!.createCursorKeys();
    this.keys=this.input.keyboard!.addKeys('W,A,S,D') as typeof this.keys;
    this.input.on('pointerdown',(p:Phaser.Input.Pointer)=>{
      this.touchTarget=new Phaser.Math.Vector2(p.worldX,p.worldY);
    });

    this.cameras.main.startFollow(this.player,true,.07,.07);
    this.cameras.main.setZoom(this.cameraZoom);
    this.input.on('wheel',(_p:Phaser.Input.Pointer,_go:unknown,_dx:number,dy:number)=>{
      this.cameraZoom=Phaser.Math.Clamp(this.cameraZoom-dy*.001,0.72,1.55);
    });
    this.cameras.main.fadeIn(600,4,9,18);

    this.hud();
  }

  private drawTerrain(W:number,H:number) {
    const p=AURORA_DESERT.palette;
    this.add.rectangle(W/2,H/2,W,H,p.void).setDepth(-20);
    if(this.textures.exists('desert-ground')){
      this.add.tileSprite(W/2,H/2,W-140,H-140,'desert-ground')
        .setTileScale(.42).setDepth(-18);
      // Unifies the photographic material with the colder Aurora palette.
      this.add.rectangle(W/2,H/2,W-140,H-140,0x101820,.22).setDepth(-17);
    }
    const g=this.add.graphics().setDepth(-16);
    g.lineStyle(120,p.sandLight,.10);
    AURORA_DESERT.paths.forEach(path=>{
      g.beginPath();
      path.forEach((pt,i)=>i?g.lineTo(pt.x,pt.y):g.moveTo(pt.x,pt.y));
      g.strokePath();
    });
  }

  private drawAuroraOutpost(){
    this.placeDesertProp('desert-ruin',620,570,210);
    this.placeDesertProp('desert-plant',820,690,82);
    this.placeDesertProp('desert-rock',930,780,120);
  }

  private drawNexusRift(){
    this.placeDesertProp('desert-crystal',2530,720,105);
    this.placeDesertProp('desert-rock',2400,830,110);
    this.placeDesertProp('desert-plant',2670,900,76);
  }

  private drawVertexRuins(){
    this.placeDesertProp('desert-tree',1840,1280,235);
    this.placeDesertProp('desert-rock',2050,1380,135);
    this.placeDesertProp('desert-plant',1720,1430,78);
  }

  private drawWaterAndBridge(){
    this.placeDesertProp('desert-tree',1180,1580,220);
    this.placeDesertProp('desert-rock',1320,1690,105);
    this.placeDesertProp('desert-plant',1040,1720,72);
    this.placeDesertProp('desert-crystal',1480,1760,76);
  }

  private placeDesertProp(key:string,x:number,y:number,maxWidth:number){
    if(!this.textures.exists(key))return;
    const image=this.add.image(x,y,key).setOrigin(.5,1);
    if(image.width>maxWidth)image.setScale(maxWidth/image.width);
    image.setDepth(y);
    this.depthProps.push({object:image,baseY:y});
  }

  private placeArtTest(){
    const x=1095,y=610;
    if(this.textures.exists(TEST_ASSET_KEY)){
      const rock=this.add.image(x,y,TEST_ASSET_KEY).setOrigin(.5,.88).setDepth(this.artTestSortY);
      this.artTestRock=rock;
      const max=185;
      if(rock.width>max) rock.setScale(max/rock.width);
      // Solid ground mass follows the same diagonal perspective as the art.
      // Staggered narrow bodies approximate a sloped rear/front footprint without a flat invisible wall.
      const collisionDefs=[
        {x:x-55,y:586,w:30,h:18},
        {x:x-34,y:592,w:34,h:22},
        {x:x-12,y:599,w:36,h:25},
        {x:x+11,y:606,w:38,h:27},
        {x:x+34,y:613,w:36,h:25},
        {x:x+55,y:620,w:30,h:20},
        {x:x-42,y:612,w:34,h:22},
        {x:x-18,y:620,w:38,h:25},
        {x:x+7,y:628,w:40,h:27},
        {x:x+32,y:636,w:36,h:23}
      ];
      this.artTestCollisions=collisionDefs.map(d=>{
        const zone=this.add.zone(d.x,d.y,d.w,d.h);
        this.physics.add.existing(zone,true);
        return zone;
      });
      this.artTestCollision=this.artTestCollisions[1];
      rock.setData('visual-test','Aurora Art Test 01');
      this.artDebug=this.add.graphics().setDepth(9999).setVisible(false);
      this.input.keyboard?.on('keydown-F2',()=>{
        if(!this.artDebug||!this.artTestCollision)return;
        const visible=!this.artDebug.visible;
        this.artDebug.clear().setVisible(visible);
        if(visible){
          this.artDebug.lineStyle(2,0x43ff7a,.95);
          this.artTestCollisions.forEach(zone=>{
            const body=zone.body as Phaser.Physics.Arcade.StaticBody;
            this.artDebug!.strokeRect(body.x,body.y,body.width,body.height);
          });
          this.artDebug.lineStyle(2,0x43ff7a,.95).strokePoints(this.artTestFootprint,true);
          this.artDebug.lineStyle(2,0xffd84a,.95).lineBetween(
            this.artTestDepthLine.left.x,this.artTestDepthLine.left.y,
            this.artTestDepthLine.right.x,this.artTestDepthLine.right.y
          );
          this.artDebug.fillStyle(0xffd84a,1).fillCircle(x,interpolateDepthY(this.artTestDepthLine,x),4);
        }
      });
    }else{
      // Current procedural placeholder remains until the approved PNG is supplied.
      const g=this.add.graphics().setDepth(34);
      g.fillStyle(0x34433f,.95);g.fillEllipse(x,y,92,48);
      g.fillStyle(0x53635c,.65);g.fillEllipse(x-12,y-10,58,27);
    }
  }

  private buildWorldDepth(){
    this.occluders=this.physics.add.staticGroup();
    // The first desert pass stays deliberately open. Individual footprints are
    // added only after visual scale is validated in-game.
  }

  private addAtmosphere(){
    // Layered light pools and drifting motes create depth without baking lighting into the map.
    const lights=[
      {x:300,y:250,c:0xffb75e,r:105,a:.09},
      {x:1640,y:360,c:0xa958ff,r:190,a:.10},
      {x:1600,y:960,c:0x48e8df,r:120,a:.07},
      {x:780,y:720,c:0x4fd7e4,r:75,a:.035}
    ];
    lights.forEach((l,i)=>{
      const halo=this.add.circle(l.x,l.y,l.r,l.c,l.a).setBlendMode(Phaser.BlendModes.ADD).setDepth(18);
      this.ambientLights.push(halo);
      this.tweens.add({targets:halo,alpha:l.a*.45,scale:1.08+(i*.015),duration:1800+i*370,yoyo:true,repeat:-1,ease:'Sine.InOut'});
    });

    for(let i=0;i<34;i++){
      const x=170+((i*211)%1830), y=130+((i*157)%1080);
      const cyan=i%3!==0;
      const mote=this.add.circle(x,y,1+(i%3),cyan?0x73f5ed:0xd49aff,.18+(i%4)*.07)
        .setBlendMode(Phaser.BlendModes.ADD).setDepth(25);
      this.tweens.add({
        targets:mote,x:x-18+(i%5)*9,y:y-18-(i%4)*7,alpha:.05,
        duration:2400+(i%7)*310,yoyo:true,repeat:-1,ease:'Sine.InOut'
      });
    }

    // Foreground silhouettes reinforce parallax/depth as the camera travels.
    const fg=this.add.graphics().setDepth(52);
    fg.fillStyle(0x02070b,.62);
    for(let i=0;i<16;i++){
      const x=40+i*145, h=34+(i%5)*15;
      fg.fillTriangle(x,1400,x+34,1400-h,x+68,1400);
    }
  }


  private hud(){
    this.add.text(18,18,'SETOR AURORA',{fontFamily:'monospace',fontSize:'15px',color:'#e9feff',backgroundColor:'#061019dd',padding:{x:11,y:8}}).setScrollFactor(0).setDepth(100);
    this.add.text(18,58,'WASD / setas  ·  toque para mover',{fontFamily:'monospace',fontSize:'11px',color:'#8bb0b8',backgroundColor:'#061019bb',padding:{x:8,y:5}}).setScrollFactor(0).setDepth(100);
    const status=this.add.text(18,0,'KAEL   HP 100/100   MP 40/40   RANK E',{fontFamily:'monospace',fontSize:'12px',color:'#d9fbff',backgroundColor:'#061019dd',padding:{x:10,y:7}}).setScrollFactor(0).setDepth(100);
    const place=()=>status.setPosition(18,Math.max(92,this.scale.height-46));
    place(); this.scale.on('resize',place);
  }

  update(){
    const speed=205; let x=0,y=0;
    if(this.cursors.left.isDown||this.keys.A.isDown)x--;
    if(this.cursors.right.isDown||this.keys.D.isDown)x++;
    if(this.cursors.up.isDown||this.keys.W.isDown)y--;
    if(this.cursors.down.isDown||this.keys.S.isDown)y++;
    if(x||y)this.touchTarget=undefined;
    if(!x&&!y&&this.touchTarget){
      const d=new Phaser.Math.Vector2(this.touchTarget.x-this.player.x,this.touchTarget.y-this.player.y);
      if(d.length()<12)this.touchTarget=undefined; else {d.normalize();x=d.x;y=d.y;}
    }
    const v=new Phaser.Math.Vector2(x,y); if(v.lengthSq()>0)v.normalize().scale(speed);
    this.player.setVelocity(v.x,v.y);
    // Y-sorting is the base rule for future 2.5D props/actors.
    this.player.setDepth(this.player.y);
    // World-space identity remains readable even while scenery fades over the actor.
    this.playerLabel.setDepth(100000);
    if(this.artTestRock){
      const switchY=interpolateDepthY(this.artTestDepthLine,this.player.x);
      const behind=this.player.y<switchY;
      this.artTestRock.setDepth(behind?this.player.y+2:this.player.y-2);
      const dx=Math.abs(this.player.x-this.artTestRock.x);
      const dy=Math.abs(this.player.y-switchY);
      const occluded=behind&&dx<this.artTestRock.displayWidth*.39&&dy<this.artTestRock.displayHeight*.48;
      const targetAlpha=occluded?.63:1;
      this.artTestRock.alpha=Phaser.Math.Linear(this.artTestRock.alpha,targetAlpha,.14);
    }
    this.cameras.main.setZoom(Phaser.Math.Linear(this.cameras.main.zoom,this.cameraZoom,.12));
    this.playerLabel.setPosition(this.player.x,this.player.y-38);
  }
}
