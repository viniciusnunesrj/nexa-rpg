import Phaser from 'phaser';
import { interpolateDepthY, type DepthLine, type Point } from '../world/depthGeometry';

const TEST_ASSET_KEY='aurora-rock-test';
const TEST_ASSET_PATH='/assets/aurora/nature/rock-test.png';

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
    this.load.once(Phaser.Loader.Events.FILE_LOAD_ERROR,(file:Phaser.Loader.File)=>{
      if(file.key===TEST_ASSET_KEY) this.textures.remove(TEST_ASSET_KEY);
    });
  }

  create() {
    const W=2200,H=1400;
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

    this.player=this.physics.add.sprite(1040,760,'kael').setDepth(40);
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
    const g=this.add.graphics();
    g.fillGradientStyle(0x07111a,0x0b1721,0x08131b,0x101924,1); g.fillRect(0,0,W,H);
    // broad ground masses
    g.fillStyle(0x17231f); g.fillEllipse(1050,720,1760,980);
    g.fillStyle(0x1c2b25); g.fillEllipse(920,690,1200,690);
    g.fillStyle(0x253229,.65); g.fillEllipse(1050,740,620,330);
    // warm traversable path
    g.lineStyle(118,0x6d5a3c,.30); g.beginPath(); g.moveTo(330,310); g.lineTo(650,470); g.lineTo(970,690); g.lineTo(1210,850); g.lineTo(1540,1040); g.strokePath();
    g.lineStyle(76,0x9a7950,.18); g.strokePath();
    // stones, bushes, cyan flora
    for(let i=0;i<95;i++){
      const x=90+((i*197)%1980), y=80+((i*263)%1240);
      const r=7+(i%6)*3;
      g.fillStyle(i%9===0?0x2c706b:i%4===0?0x365244:0x243a32,.72);
      g.fillCircle(x,y,r);
      if(i%11===0){g.fillStyle(0x52d9cf,.42);g.fillCircle(x+5,y-3,4);}
    }
    // cliff shadows for depth
    g.fillStyle(0x03090e,.7); g.fillRoundedRect(80,930,620,260,45);
    g.fillStyle(0x101d22); g.fillRoundedRect(110,890,570,230,40);
  }

  private drawAuroraOutpost(){
    const g=this.add.graphics().setDepth(8);
    g.fillStyle(0x080e14,.95); g.fillRoundedRect(190,150,440,250,18);
    g.fillStyle(0x17252b); g.fillRoundedRect(215,175,390,195,12);
    g.fillStyle(0xe8a44d,.25); g.fillCircle(300,245,88);
    for(let i=0;i<4;i++){g.fillStyle(0xf3b45c,.88);g.fillRect(245+i*88,205,48,32);}
    g.lineStyle(3,0x49dbe3,.8); g.strokeRoundedRect(430,270,120,70,5);
    this.label(410,125,'POSTO AURORA','Comércio  ·  Missões  ·  Reparo',0x55e8ef);
  }

  private drawNexusRift(){
    const g=this.add.graphics().setDepth(9);
    const x=1640,y=360;
    for(let r=180;r>45;r-=25){g.lineStyle(7,r%50===5?0xa95cff:0x7442df,.18+(180-r)/500);g.strokeEllipse(x,y,r*1.7,r*.75);}
    g.fillStyle(0x6d36ce,.20);g.fillEllipse(x,y,270,105);
    g.fillStyle(0xc273ff,.42);g.fillEllipse(x,y,145,55);
    for(let i=0;i<8;i++){const a=i*Math.PI/4;const px=x+Math.cos(a)*150,py=y+Math.sin(a)*70;g.fillStyle(0x251746);g.fillRect(px-10,py-35,20,70);g.lineStyle(2,0xb765ff,.8);g.strokeRect(px-10,py-35,20,70);}
    this.label(x,y+135,'FISSURA NEXUS','Desafios  ·  Recompensas  ·  Eventos',0xb96cff);
  }

  private drawVertexRuins(){
    const g=this.add.graphics().setDepth(12);
    const x=1600,y=1010;
    for(let i=0;i<7;i++){const px=x-180+i*58, h=70+(i%3)*38;g.fillStyle(0x27343a);g.fillRect(px,y-h,42,h);g.fillStyle(0x4ee9dd,.28);g.fillRect(px+7,y-h+12,4,h-25);}
    g.fillStyle(0xeaa34d,.25);g.fillCircle(x+70,y-30,80);
    this.label(x,y+70,'RUÍNAS DE VÉRTICE','Exploração  ·  Fragmentos  ·  Segredos',0x58e6df);
  }

  private drawWaterAndBridge(){
    const g=this.add.graphics().setDepth(5);
    g.fillStyle(0x063448,.88);g.fillRoundedRect(120,970,620,250,50);
    for(let i=0;i<10;i++){g.lineStyle(2,0x3ac7dd,.15);g.lineBetween(150,995+i*19,690,995+i*19);}
    g.fillStyle(0x493827);g.fillRect(470,1050,520,75);
    for(let i=0;i<13;i++){g.fillStyle(i%2?0x6b5133:0x594129);g.fillRect(480+i*38,1057,30,60);}
  }

  private placeArtTest(){
    const x=1095,y=610;
    if(this.textures.exists(TEST_ASSET_KEY)){
      const rock=this.add.image(x,y,TEST_ASSET_KEY).setOrigin(.5,.88).setDepth(this.artTestSortY);
      this.artTestRock=rock;
      const max=185;
      if(rock.width>max) rock.setScale(max/rock.width);
      // Collision uses only the visual footprint, allowing Kael to pass behind the tall formation.
      const fp=this.artTestFootprint;
      const minX=Math.min(...fp.map(p=>p.x)),maxX=Math.max(...fp.map(p=>p.x));
      const minY=Math.min(...fp.map(p=>p.y)),maxY=Math.max(...fp.map(p=>p.y));
      // Keep physical blocking tight to the actual ground contact. Visual occlusion is handled separately.
      const collisionW=(maxX-minX)*.61, collisionH=(maxY-minY)*.46;
      this.artTestCollision=this.add.zone(x+1,maxY-collisionH*.44,collisionW,collisionH);
      this.physics.add.existing(this.artTestCollision,true);
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

    // Invisible collision footprints keep traversal believable while the visible art remains layered.
    const block=(x:number,y:number,w:number,h:number)=>{
      const zone=this.add.zone(x,y,w,h);
      this.physics.add.existing(zone,true);
      this.occluders.add(zone);
    };
    block(410,275,420,220);       // Aurora building
    block(1640,350,330,150);     // Nexus core
    block(1600,955,390,155);     // Vertex ruins
    block(330,1060,300,170);     // cliff/water edge

    // Midground props: trunks/pillars sit below the player, crowns/tops can occlude it.
    const props=[
      {x:735,y:500,s:1.0},{x:880,y:430,s:.78},{x:1180,y:620,s:.92},
      {x:1320,y:820,s:.82},{x:720,y:860,s:.9},{x:1420,y:690,s:.72}
    ];
    props.forEach((p,i)=>{
      // Each tall prop owns its depth. One shared Graphics object cannot Y-sort individual trees.
      const tree=this.add.graphics().setDepth(p.y);
      tree.fillStyle(0x17241f,.96);tree.fillRect(-7*p.s,0,14*p.s,38*p.s);
      tree.fillStyle(0x3a2d20,.8);tree.fillRect(-3*p.s,6,6*p.s,34*p.s);
      tree.fillStyle(i%3===0?0x294b3d:0x203d35,.98);
      tree.fillEllipse(0,-16*p.s,72*p.s,58*p.s);
      tree.fillStyle(0x3b6953,.7);tree.fillEllipse(-14*p.s,-28*p.s,38*p.s,28*p.s);
      if(i%2===0){tree.fillStyle(0x4dded1,.25);tree.fillCircle(15*p.s,-25*p.s,5*p.s);}
      tree.setPosition(p.x,p.y);
      this.depthProps.push({object:tree,baseY:p.y});
    });

    // Small architectural foreground pieces sell height when Kael walks behind them.
    const walls=this.add.graphics().setDepth(47);
    const segments=[{x:1110,y:555},{x:1160,y:575},{x:1510,y:820},{x:1560,y:840}];
    segments.forEach((p,i)=>{
      walls.fillStyle(0x29383b,.98);walls.fillRect(p.x,p.y-54,42,62);
      walls.fillStyle(0x405257,.8);walls.fillRect(p.x+4,p.y-49,34,9);
      walls.fillStyle(i<2?0x4fe2dc:0xa858ff,.28);walls.fillRect(p.x+8,p.y-37,3,29);
    });
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

  private label(x:number,y:number,title:string,sub:string,color:number){
    const box=this.add.graphics().setDepth(60);
    box.fillStyle(0x061019,.88);box.fillRoundedRect(x-155,y-31,310,62,9);
    box.lineStyle(2,color,.72);box.strokeRoundedRect(x-155,y-31,310,62,9);
    this.add.text(x,y-10,title,{fontFamily:'monospace',fontSize:'14px',color:'#f1fdff',fontStyle:'bold'}).setOrigin(.5).setDepth(61);
    this.add.text(x,y+13,sub,{fontFamily:'monospace',fontSize:'10px',color:'#a9c2c7'}).setOrigin(.5).setDepth(61);
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
