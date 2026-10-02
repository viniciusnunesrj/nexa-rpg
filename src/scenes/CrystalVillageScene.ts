import Phaser from 'phaser';

const WORLD={width:3200,height:2400};
const ASSETS={
  ground:'/assets/aurora/nature/vila-terreno-base-01.png',
  stone:'/assets/aurora/nature/vila-piso-pedra-base-01.png',
  plaza:'/assets/aurora/nature/vila-praca-central-01.png',
  road:'/assets/aurora/nature/vila-caminho-reto-01.png',
  curve:'/assets/aurora/nature/vila-caminho-curva-01.png',
  junction:'/assets/aurora/nature/vila-caminho-t-01.png',
  gate:'/assets/aurora/nature/vila-portao-principal-01.png',
  forge:'/assets/aurora/nature/vila-forja-comercio-01.png',
  workshop:'/assets/aurora/nature/vila-oficina-nexa-01.png',
  monument:'/assets/aurora/nature/vila-monumento-nexa-01.png',
  market:'/assets/aurora/nature/vila-barraca-mercado-01.png',
  water:'/assets/aurora/nature/vila-agua-base-01.png',
  bank:'/assets/aurora/nature/vila-margem-canal-reta-01.png',
  bridge:'/assets/aurora/nature/vila-ponte-nexa-01.png',
  tree:'/assets/aurora/nature/vila-arvore-01.png',
  decor:'/assets/aurora/nature/vila-kit-decoracao-01.png',
  cliff:'/assets/aurora/nature/vila-paredao-rochoso-01.png'
} as const;

export class CrystalVillageScene extends Phaser.Scene{
  private player!:Phaser.Physics.Arcade.Sprite;
  private cursors!:Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!:Record<'W'|'A'|'S'|'D',Phaser.Input.Keyboard.Key>;
  private label!:Phaser.GameObjects.Text;
  private water?:Phaser.GameObjects.TileSprite;
  private zoom=0.82;

  constructor(){super('CrystalVillageScene');}

  preload(){
    Object.entries(ASSETS).forEach(([key,path])=>this.load.image(`village-${key}`,path));
  }

  create(){
    const {width:w,height:h}=WORLD;
    this.physics.world.setBounds(0,0,w,h);
    this.cameras.main.setBounds(0,0,w,h);
    this.add.tileSprite(w/2,h/2,w,h,'village-ground').setDepth(-100);

    // Ground-material validation pass.
    // The old plaza/road/junction PNGs deliberately stay loaded but are NOT rendered:
    // they contain their own dirt and were creating visible rectangular patches.
    const paved=this.add.tileSprite(1550,1250,2050,1650,'village-stone')
      .setTileScale(.34)
      .setDepth(-90);

    // Irregular urban footprint: one continuous stone material instead of several
    // pre-rendered floor plates. Later props/vegetation will soften this boundary.
    const pavementMask=this.make.graphics({x:0,y:0});
    pavementMask.fillStyle(0xffffff);
    pavementMask.beginPath();
    pavementMask.moveTo(650,520);
    pavementMask.lineTo(1180,360);
    pavementMask.lineTo(1810,390);
    pavementMask.lineTo(2390,560);
    pavementMask.lineTo(2520,980);
    pavementMask.lineTo(2440,1450);
    pavementMask.lineTo(2210,1960);
    pavementMask.lineTo(1700,2110);
    pavementMask.lineTo(1110,2050);
    pavementMask.lineTo(650,1780);
    pavementMask.lineTo(520,1300);
    pavementMask.lineTo(560,850);
    pavementMask.closePath();
    pavementMask.fillPath();
    paved.setMask(pavementMask.createGeometryMask());

    // First real composition pass: major landmarks only.
    // Floor-piece PNGs remain disabled; all architecture sits on the continuous stone material.
    this.add.image(1550,470,'village-gate').setDisplaySize(650,Math.round(650*this.textures.get('village-gate').getSourceImage().height/this.textures.get('village-gate').getSourceImage().width)).setOrigin(.5,1).setDepth(470);
    this.add.image(1550,1210,'village-monument').setDisplaySize(560,Math.round(560*this.textures.get('village-monument').getSourceImage().height/this.textures.get('village-monument').getSourceImage().width)).setOrigin(.5,1).setDepth(1210);
    this.add.image(720,1020,'village-forge').setDisplaySize(760,Math.round(760*this.textures.get('village-forge').getSourceImage().height/this.textures.get('village-forge').getSourceImage().width)).setOrigin(.5,1).setDepth(1020);
    this.add.image(2260,1010,'village-market').setDisplaySize(520,Math.round(520*this.textures.get('village-market').getSourceImage().height/this.textures.get('village-market').getSourceImage().width)).setOrigin(.5,1).setDepth(1010);

    // Composition 03: rebuild the right side to match the master layout.
    // The river is a natural vertical channel at the far right; the bridge crosses it horizontally.
    const placeSized=(key:string,x:number,y:number,width:number,depth:number,flipX=false)=>{
      const src=this.textures.get(key).getSourceImage();
      const img=this.add.image(x,y,key).setDisplaySize(width,Math.round(width*src.height/src.width)).setOrigin(.5,1).setDepth(depth);
      img.setFlipX(flipX);
      return img;
    };

    this.water=this.add.tileSprite(2860,1280,410,2050,'village-water').setDepth(-82);
    this.water.setTileScale(.58);

    // Relief follows the outside perimeter instead of cutting through the plaza.
    placeSized('village-cliff',720,500,1200,470);
    placeSized('village-cliff',2230,500,1180,470,true);
    placeSized('village-cliff',360,1320,1200,1290);
    placeSized('village-cliff',2390,2180,1300,2150,true);
    placeSized('village-cliff',1040,2300,1300,2270);
    placeSized('village-cliff',1960,2300,1300,2270,true);

    // Keep the east side open around the bridge. In the master this is a river crossing,
    // not a rock wall: plaza/path -> short land approach -> bridge -> east bank.
    placeSized('village-bank',2650,720,760,-70);
    placeSized('village-bank',2650,1780,760,-70);
    placeSized('village-bank',3070,720,760,-70,true);
    placeSized('village-bank',3070,1780,760,-70,true);
    // The bridge PNG is already authored vertically in image space; in the game's
    // top-down composition that vertical axis is the crossing direction here.
    // Keep it unrotated so its deck stays intact and centered over the river.
    placeSized('village-bridge',2860,1120,420,1120);

    // Large vegetation masses soften the perimeter and hide joins between relief pieces.
    placeSized('village-tree',430,1120,360,1110);
    placeSized('village-tree',2410,720,330,710,true);
    placeSized('village-tree',2370,1940,360,1930);

    const g=this.add.graphics();
    g.fillStyle(0x111827);g.fillEllipse(18,31,30,13);
    g.fillStyle(0x28364b);g.fillRoundedRect(7,8,22,27,6);
    g.fillStyle(0xd7e4e8);g.fillTriangle(8,12,18,2,29,13);
    g.fillStyle(0x5ce8ed);g.fillRect(11,14,14,4);
    g.fillStyle(0x17202e);g.fillRect(5,21,26,12);
    g.generateTexture('village-kael',36,40);g.destroy();

    this.player=this.physics.add.sprite(1550,1680,'village-kael').setCollideWorldBounds(true);
    this.player.body?.setSize(20,18).setOffset(8,20);
    this.label=this.add.text(this.player.x,this.player.y-38,'Kael · Rank E',{
      fontFamily:'monospace',fontSize:'13px',color:'#eefeff',stroke:'#071018',strokeThickness:5
    }).setOrigin(.5).setDepth(100000);

    this.cursors=this.input.keyboard!.createCursorKeys();
    this.keys=this.input.keyboard!.addKeys('W,A,S,D') as typeof this.keys;
    this.cameras.main.startFollow(this.player,true,.07,.07);
    this.cameras.main.setZoom(this.zoom);
    this.input.on('wheel',(_p:Phaser.Input.Pointer,_g:unknown,_dx:number,dy:number)=>{
      this.zoom=Phaser.Math.Clamp(this.zoom-dy*.001,0.48,1.35);
    });
    this.add.text(18,18,'VILA DAS RUÍNAS CRISTALINAS · COMPOSIÇÃO 05',{fontFamily:'monospace',fontSize:'14px',color:'#e9feff',backgroundColor:'#061019dd',padding:{x:10,y:7}}).setScrollFactor(0).setDepth(100001);
  }

  update(){
    const speed=205;let x=0,y=0;
    if(this.cursors.left.isDown||this.keys.A.isDown)x--;
    if(this.cursors.right.isDown||this.keys.D.isDown)x++;
    if(this.cursors.up.isDown||this.keys.W.isDown)y--;
    if(this.cursors.down.isDown||this.keys.S.isDown)y++;
    const v=new Phaser.Math.Vector2(x,y);if(v.lengthSq()>0)v.normalize().scale(speed);
    this.player.setVelocity(v.x,v.y);
    this.player.setDepth(this.player.y);
    this.label.setPosition(this.player.x,this.player.y-38);
    this.water && (this.water.tilePositionY-=.18);
    this.cameras.main.setZoom(Phaser.Math.Linear(this.cameras.main.zoom,this.zoom,.12));
  }
}
