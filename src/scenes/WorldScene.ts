import Phaser from 'phaser';

export class WorldScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: Record<'W'|'A'|'S'|'D', Phaser.Input.Keyboard.Key>;

  constructor() { super('WorldScene'); }

  create() {
    const worldW = 1920, worldH = 1080;
    this.physics.world.setBounds(0, 0, worldW, worldH);
    this.cameras.main.setBounds(0, 0, worldW, worldH);

    // Temporary procedural art: validates world scale, camera and depth before final assets.
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0b1820, 0x101a2a, 0x071018, 0x101522, 1);
    bg.fillRect(0, 0, worldW, worldH);
    for (let y=0; y<worldH; y+=64) {
      for (let x=0; x<worldW; x+=64) {
        const n=((x/64+y/64)%3);
        bg.fillStyle(n===0 ? 0x17252a : n===1 ? 0x122127 : 0x101d23, .72);
        bg.fillRect(x+2,y+2,60,60);
      }
    }

    const props = this.add.graphics();
    for (let i=0;i<42;i++) {
      const x=80+((i*173)%1760), y=90+((i*239)%900);
      props.fillStyle(i%4===0 ? 0x365d51 : 0x263d3b, .9);
      props.fillCircle(x,y,10+(i%5)*4);
      props.fillStyle(0x091217,.35);
      props.fillEllipse(x+7,y+12,30+(i%4)*6,12);
    }
    props.lineStyle(3,0x36d9d0,.32);
    props.strokeCircle(1030,510,120);
    props.lineStyle(1,0x7df6ed,.2);
    props.strokeCircle(1030,510,154);

    // Temporary Kael texture. Replaced by original sprite sheet in the art pass.
    const g=this.add.graphics();
    g.fillStyle(0x17212e); g.fillRect(6,4,20,28);
    g.fillStyle(0x5ad7e5); g.fillRect(9,7,14,7);
    g.fillStyle(0xa8e8ef); g.fillRect(13,9,6,3);
    g.fillStyle(0x29384a); g.fillRect(4,16,24,12);
    g.fillStyle(0x5ad7e5); g.fillRect(5,18,3,8);
    g.generateTexture('kael',32,36); g.destroy();

    this.player=this.physics.add.sprite(780,560,'kael');
    this.player.setCollideWorldBounds(true).setDepth(20);
    this.player.body?.setSize(20,18).setOffset(6,18);

    this.add.text(780,526,'Kael  •  Rank E',{fontFamily:'monospace',fontSize:'13px',color:'#dffcff',stroke:'#061014',strokeThickness:4}).setOrigin(.5).setDepth(21).setName('playerLabel');

    // World landmarks establish depth and scale.
    this.landmark(420,300,'POSTO AURORA',0x66d9ff);
    this.landmark(1320,760,'RUÍNAS DE VÉRTICE',0xb68cff);
    this.landmark(1030,510,'FISSURA NEXUS',0x53ffe0);

    this.cameras.main.startFollow(this.player,true,.08,.08);
    this.cameras.main.setZoom(1.25);
    this.cameras.main.fadeIn(650,5,10,18);

    this.cursors=this.input.keyboard!.createCursorKeys();
    this.keys=this.input.keyboard!.addKeys('W,A,S,D') as typeof this.keys;

    this.add.text(18,18,'NEXA RPG  •  SETOR AURORA',{fontFamily:'monospace',fontSize:'14px',color:'#c9fbff',backgroundColor:'#071018cc',padding:{x:10,y:7}})
      .setScrollFactor(0).setDepth(100);
    this.add.text(18,56,'WASD / setas  •  exploração técnica',{fontFamily:'monospace',fontSize:'11px',color:'#7da0aa',backgroundColor:'#071018aa',padding:{x:8,y:5}})
      .setScrollFactor(0).setDepth(100);
  }

  private landmark(x:number,y:number,label:string,color:number) {
    const s=this.add.graphics().setDepth(4);
    s.fillStyle(0x071016,.8); s.fillRoundedRect(x-72,y-42,144,84,8);
    s.lineStyle(2,color,.7); s.strokeRoundedRect(x-72,y-42,144,84,8);
    s.fillStyle(color,.18); s.fillCircle(x,y,26);
    this.add.text(x,y+55,label,{fontFamily:'monospace',fontSize:'11px',color:'#a9c7ce',stroke:'#061014',strokeThickness:3}).setOrigin(.5).setDepth(5);
  }

  update() {
    const speed=190;
    let x=0,y=0;
    if(this.cursors.left.isDown||this.keys.A.isDown)x--;
    if(this.cursors.right.isDown||this.keys.D.isDown)x++;
    if(this.cursors.up.isDown||this.keys.W.isDown)y--;
    if(this.cursors.down.isDown||this.keys.S.isDown)y++;
    const v=new Phaser.Math.Vector2(x,y);
    if(v.lengthSq()>0)v.normalize().scale(speed);
    this.player.setVelocity(v.x,v.y);
    const label=this.children.getByName('playerLabel') as Phaser.GameObjects.Text;
    label.setPosition(this.player.x,this.player.y-34);
  }
}
