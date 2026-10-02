import Phaser from 'phaser';
import { AURORA_DESERT } from '../world/auroraDesert';

const TEST_ASSET_KEY='aurora-rock-test';
const TEST_ASSET_PATH='/assets/aurora/nature/rock-test.png';
const DESERT_ASSETS={
  ground:'/assets/aurora/nature/solo-aurora-base.png',
  path:'/assets/aurora/nature/caminho-aurora.png',
  water:'/assets/aurora/nature/agua-aurora-base.png',
  bank:'/assets/aurora/nature/margem-rio-aurora-01.png',
  bridge:'/assets/aurora/nature/ponte-aurora-01.png'
} as const;

export class WorldScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: Record<'W'|'A'|'S'|'D', Phaser.Input.Keyboard.Key>;
  private playerLabel!: Phaser.GameObjects.Text;
  private touchTarget?: Phaser.Math.Vector2;
  private occluders!: Phaser.Physics.Arcade.StaticGroup;
  private cameraZoom=1.18;
  private riverWater?: Phaser.GameObjects.TileSprite;
  private collisionDebug?: Phaser.GameObjects.Graphics;
  private collisionDebugVisible=false;
  private collisionRects: Phaser.Geom.Rectangle[]=[];

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
    this.drawWaterAndBridge();
    this.buildWorldDepth();

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
    this.createCollisionDebug();
    this.playerLabel=this.add.text(this.player.x,this.player.y-38,'Kael · Rank E',{
      fontFamily:'monospace',fontSize:'13px',color:'#eefeff',stroke:'#071018',strokeThickness:5
    }).setOrigin(.5).setDepth(41);

    this.cursors=this.input.keyboard!.createCursorKeys();
    this.keys=this.input.keyboard!.addKeys('W,A,S,D') as typeof this.keys;
    this.input.keyboard!.on('keydown-F2',()=>this.toggleCollisionDebug());
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
    this.add.rectangle(W/2,H/2,W,H,p.void).setDepth(-30);
    this.add.tileSprite(W/2,H/2,W,H,'desert-ground').setTileScale(.36).setDepth(-28);

    // One approved path segment only: this pass validates material/scale before
    // building a complete modular road network.
    const path=this.add.image(930,1120,'desert-path').setOrigin(.5).setDepth(-20);
    if(path.width>280)path.setScale(280/path.width);
  }

  private drawWaterAndBridge(){
    // Straight test corridor first. Banks overlap the ground while animated water
    // lives below them. The right bank reuses the same art mirrored horizontally.
    const riverX=2100,riverY=1100,riverW=210,riverH=2500;
    this.riverWater=this.add.tileSprite(riverX,riverY,riverW,riverH,'desert-water')
      .setTileScale(.22).setDepth(-24);

    // Preserve the bank PNG aspect ratio. Repeating modules avoids the canyon-like
    // vertical stretching from the first test and extends beyond camera bounds.
    const bankScale=.24;
    const source=this.textures.get('desert-bank').getSourceImage() as HTMLImageElement;
    const bankH=source.height*bankScale;
    const bankOffset=riverW/2+source.width*bankScale*.18;
    const firstY=-bankH/2;
    for(let y=firstY;y<2400+bankH;y+=bankH*.94){
      this.add.image(riverX-bankOffset,y,'desert-bank')
        .setOrigin(.5).setScale(bankScale).setDepth(-18);
      this.add.image(riverX+bankOffset,y,'desert-bank')
        .setOrigin(.5).setScale(bankScale).setFlipX(true).setDepth(-18);
    }

    // Modular horizontal crossing: the replacement asset was generated for a
    // vertical river, so its visual deck and gameplay opening share one axis.
    const bridge=this.add.image(riverX,1100,'desert-bridge').setOrigin(.5).setDepth(-10);
    const bridgeTargetW=360;
    if(bridge.width>bridgeTargetW)bridge.setScale(bridgeTargetW/bridge.width);
  }



  private addSolidRect(x:number,y:number,w:number,h:number){
    const zone=this.add.zone(x,y,w,h).setOrigin(.5);
    this.physics.add.existing(zone,true);
    const body=zone.body as Phaser.Physics.Arcade.StaticBody;
    body.setSize(w,h);
    body.updateFromGameObject();
    this.occluders.add(zone);
    this.collisionRects.push(new Phaser.Geom.Rectangle(x-w/2,y-h/2,w,h));
  }

  private buildWorldDepth(){
    this.occluders=this.physics.add.staticGroup();
    this.collisionRects=[];

    // Navigation layer, independent from the artwork.
    // WATER is solid. The bridge deck is a deliberate walkable cut through it.
    const riverX=2100, riverW=250;
    const bridgeY=1100, deckH=72;
    this.addSolidRect(riverX,(bridgeY-deckH/2)/2,riverW,bridgeY-deckH/2);
    const lowerTop=bridgeY+deckH/2;
    this.addSolidRect(riverX,lowerTop+(AURORA_DESERT.height-lowerTop)/2,riverW,AURORA_DESERT.height-lowerTop);

    // Bridge pillars/abutments are explicit solid footprints. They can be tuned
    // visually without changing the river or bridge-deck navigation rule.
    const pillarW=30,pillarH=34,pillarDX=128,pillarDY=42;
    this.addSolidRect(riverX-pillarDX,bridgeY-pillarDY,pillarW,pillarH);
    this.addSolidRect(riverX+pillarDX,bridgeY-pillarDY,pillarW,pillarH);
    this.addSolidRect(riverX-pillarDX,bridgeY+pillarDY,pillarW,pillarH);
    this.addSolidRect(riverX+pillarDX,bridgeY+pillarDY,pillarW,pillarH);
  }

  private createCollisionDebug(){
    this.collisionDebug=this.add.graphics().setDepth(99990).setVisible(false);
    this.redrawCollisionDebug();
  }

  private redrawCollisionDebug(){
    if(!this.collisionDebug)return;
    this.collisionDebug.clear();
    this.collisionDebug.fillStyle(0xff3344,.30);
    this.collisionDebug.lineStyle(2,0xff6677,.95);
    this.collisionRects.forEach(rect=>{
      this.collisionDebug!.fillRect(rect.x,rect.y,rect.width,rect.height);
      this.collisionDebug!.strokeRect(rect.x,rect.y,rect.width,rect.height);
    });
    // Green shows the intended walkable bridge deck.
    this.collisionDebug.fillStyle(0x35ff88,.28);
    this.collisionDebug.lineStyle(2,0x75ffaa,.95);
    this.collisionDebug.fillRect(1970,1064,260,72);
    this.collisionDebug.strokeRect(1970,1064,260,72);
  }

  private toggleCollisionDebug(){
    this.collisionDebugVisible=!this.collisionDebugVisible;
    this.collisionDebug?.setVisible(this.collisionDebugVisible);
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
    if(this.riverWater)this.riverWater.tilePositionY-=0.22;
    // Y-sorting is the base rule for future 2.5D props/actors.
    this.player.setDepth(this.player.y);
    // World-space identity remains readable even while scenery fades over the actor.
    this.playerLabel.setDepth(100000);
    this.cameras.main.setZoom(Phaser.Math.Linear(this.cameras.main.zoom,this.cameraZoom,.12));
    this.playerLabel.setPosition(this.player.x,this.player.y-38);
  }
}
