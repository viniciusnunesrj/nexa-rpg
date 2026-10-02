import Phaser from 'phaser';

export class WorldScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: Record<'W'|'A'|'S'|'D', Phaser.Input.Keyboard.Key>;
  private playerLabel!: Phaser.GameObjects.Text;
  private touchTarget?: Phaser.Math.Vector2;

  constructor() { super('WorldScene'); }

  create() {
    const W=2200,H=1400;
    this.physics.world.setBounds(0,0,W,H);
    this.cameras.main.setBounds(0,0,W,H);
    this.drawTerrain(W,H);
    this.drawAuroraOutpost();
    this.drawNexusRift();
    this.drawVertexRuins();
    this.drawWaterAndBridge();

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
    this.playerLabel=this.add.text(this.player.x,this.player.y-38,'Kael · Rank E',{
      fontFamily:'monospace',fontSize:'13px',color:'#eefeff',stroke:'#071018',strokeThickness:5
    }).setOrigin(.5).setDepth(41);

    this.cursors=this.input.keyboard!.createCursorKeys();
    this.keys=this.input.keyboard!.addKeys('W,A,S,D') as typeof this.keys;
    this.input.on('pointerdown',(p:Phaser.Input.Pointer)=>{
      this.touchTarget=new Phaser.Math.Vector2(p.worldX,p.worldY);
    });

    this.cameras.main.startFollow(this.player,true,.07,.07);
    this.cameras.main.setZoom(1.18);
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
    this.playerLabel.setPosition(this.player.x,this.player.y-38);
  }
}
