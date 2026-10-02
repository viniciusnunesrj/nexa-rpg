import Phaser from 'phaser';

const WORLD={width:3200,height:2400};
const ASSETS={
  ground:'/assets/aurora/nature/vila-terreno-base-01.png',
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

    // V0.1 macro composition: establish the village silhouette before collision tuning.
    this.place('village-plaza',1550,1260,820,-70);
    this.place('village-road',1550,1880,330,-68);
    this.place('village-junction',1550,1610,430,-67);
    this.place('village-gate',1550,430,650,420);

    this.water=this.add.tileSprite(2630,1330,420,1900,'village-water').setDepth(-75);
    this.place('village-bank',2390,1330,1900,-62);
    this.place('village-bank',2870,1330,1900,-62,true);
    this.place('village-bridge',2630,1280,520,90);

    this.place('village-forge',760,830,820,760);
    this.place('village-workshop',760,1650,650,1650);
    this.place('village-market',2220,760,560,760);
    this.place('village-monument',1550,1190,560,1190);

    this.place('village-cliff',1000,220,1900,180);
    this.place('village-cliff',2050,220,1900,180,true);
    this.place('village-cliff',700,2220,1500,2180);
    this.place('village-cliff',2150,2220,1500,2180,true);
    this.place('village-tree',430,1320,430,1320);
    this.place('village-tree',2300,1860,360,1860,true);

    const g=this.add.graphics();
    g.fillStyle(0x111827);g.fillEllipse(18,31,30,13);
    g.fillStyle(0x28364b);g.fillRoundedRect(7,8,22,27,6);
    g.fillStyle(0xd7e4e8);g.fillTriangle(8,12,18,2,29,13);
    g.fillStyle(0x5ce8ed);g.fillRect(11,14,14,4);
    g.fillStyle(0x17202e);g.fillRect(5,21,26,12);
    g.generateTexture('village-kael',36,40);g.destroy();

    this.player=this.physics.add.sprite(1550,1840,'village-kael').setCollideWorldBounds(true);
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
    this.add.text(18,18,'VILA DAS RUÍNAS CRISTALINAS · V0.1',{fontFamily:'monospace',fontSize:'14px',color:'#e9feff',backgroundColor:'#061019dd',padding:{x:10,y:7}}).setScrollFactor(0).setDepth(100001);
  }

  private place(key:string,x:number,y:number,targetWidth:number,depth:number,flipX=false){
    const img=this.add.image(x,y,key).setOrigin(.5).setDepth(depth).setFlipX(flipX);
    if(img.width>0)img.setScale(targetWidth/img.width);
    return img;
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
