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
  water:'/assets/aurora/nature/agua-aurora-base.png',
  bank:'/assets/aurora/nature/vila-margem-canal-reta-01.png',
  bridge:'/assets/aurora/nature/ponte-vila-01.png',
  tree:'/assets/aurora/nature/vila-arvore-01.png',
  decor:'/assets/aurora/nature/vila-kit-decoracao-01.png',
  stairs:'/assets/aurora/nature/vila-escadaria-pedra-01.png',
  ledge:'/assets/aurora/nature/vila-desnivel-rochoso-01.png',
  pier:'/assets/aurora/nature/vila-pier-sudoeste-01.png',
  ambientKit:'/assets/aurora/nature/vila-kit-ambiental-01.png',
  nexaKit:'/assets/aurora/nature/vila-kit-nexa-iluminacao-01.png',
  marketForgeKit:'/assets/aurora/nature/vila-kit-mercado-forja-01.png',
  cliff:'/assets/aurora/nature/vila-paredao-rochoso-01.png'
} as const;

export class CrystalVillageScene extends Phaser.Scene{
  private player!:Phaser.Physics.Arcade.Sprite;
  private cursors!:Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!:Record<'W'|'A'|'S'|'D',Phaser.Input.Keyboard.Key>;
  private label!:Phaser.GameObjects.Text;
  private water?:Phaser.GameObjects.TileSprite;
  private southwestWater?:Phaser.GameObjects.TileSprite;
  private southwestWaterBed?:Phaser.GameObjects.Graphics;
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
    const paved=this.add.tileSprite(1550,1170,1720,1430,'village-stone')
      .setTileScale(.34)
      .setDepth(-90);

    // Irregular urban footprint: one continuous stone material instead of several
    // pre-rendered floor plates. Later props/vegetation will soften this boundary.
    const pavementMask=this.make.graphics({x:0,y:0});
    pavementMask.fillStyle(0xffffff);
    pavementMask.beginPath();
    pavementMask.moveTo(850,610);
    pavementMask.lineTo(1250,500);
    pavementMask.lineTo(1750,500);
    pavementMask.lineTo(2200,640);
    pavementMask.lineTo(2300,930);
    pavementMask.lineTo(2180,1360);
    pavementMask.lineTo(1980,1690);
    pavementMask.lineTo(1660,1810);
    pavementMask.lineTo(1200,1780);
    pavementMask.lineTo(850,1570);
    pavementMask.lineTo(740,1240);
    pavementMask.lineTo(740,850);
    pavementMask.closePath();
    pavementMask.fillPath();
    paved.setMask(pavementMask.createGeometryMask());

    // First real composition pass: major landmarks only.
    // Floor-piece PNGs remain disabled; all architecture sits on the continuous stone material.
    this.add.image(1550,620,'village-gate').setDisplaySize(740,Math.round(740*this.textures.get('village-gate').getSourceImage().height/this.textures.get('village-gate').getSourceImage().width)).setOrigin(.5,1).setDepth(620);
    this.add.image(1550,1210,'village-monument').setDisplaySize(560,Math.round(560*this.textures.get('village-monument').getSourceImage().height/this.textures.get('village-monument').getSourceImage().width)).setOrigin(.5,1).setDepth(1210);
    this.add.image(980,1015,'village-forge').setDisplaySize(585,Math.round(585*this.textures.get('village-forge').getSourceImage().height/this.textures.get('village-forge').getSourceImage().width)).setOrigin(.5,1).setDepth(1020);
    this.add.image(2050,1010,'village-market').setDisplaySize(430,Math.round(430*this.textures.get('village-market').getSourceImage().height/this.textures.get('village-market').getSourceImage().width)).setOrigin(.5,1).setDepth(1010);

    // Composition 03: rebuild the right side to match the master layout.
    // The river is a natural vertical channel at the far right; the bridge crosses it horizontally.
    const placeSized=(key:string,x:number,y:number,width:number,depth:number,flipX=false)=>{
      const src=this.textures.get(key).getSourceImage();
      const img=this.add.image(x,y,key).setDisplaySize(width,Math.round(width*src.height/src.width)).setOrigin(.5,1).setDepth(depth);
      img.setFlipX(flipX);
      return img;
    };

    // Treat each approved 4x3 asset sheet as twelve addressable Phaser frames.
    const registerKitFrames=(key:string)=>{
      const tex=this.textures.get(key);
      const src=tex.getSourceImage();
      const cellW=Math.floor(src.width/4), cellH=Math.floor(src.height/3);
      for(let row=0;row<3;row++) for(let col=0;col<4;col++){
        const index=row*4+col+1, x=col*cellW, y=row*cellH;
        if(!tex.has(String(index))) tex.add(String(index),0,x,y,col===3?src.width-x:cellW,row===2?src.height-y:cellH);
      }
    };
    registerKitFrames('village-ambientKit');
    registerKitFrames('village-nexaKit');
    registerKitFrames('village-marketForgeKit');

    const placeKit=(key:string,frame:number,x:number,y:number,width:number,depth:number,flipX=false)=>{
      const img=this.add.image(x,y,key,String(frame)).setOrigin(.5,1).setDepth(depth);
      img.setDisplaySize(width,Math.round(width*img.frame.height/img.frame.width));
      img.setFlipX(flipX);
      return img;
    };

    // Master 33: organic east river. Keep the validated Aurora water texture, but
    // stop drawing it as a perfect rectangle. The mask widens around the bridge,
    // narrows through the rocky shoulders and opens again toward the south basin.
    const eastRiverPoints=[
      new Phaser.Geom.Point(2675,0),new Phaser.Geom.Point(3200,0),
      new Phaser.Geom.Point(3200,2400),new Phaser.Geom.Point(2585,2400),
      new Phaser.Geom.Point(2605,2200),new Phaser.Geom.Point(2550,2010),
      new Phaser.Geom.Point(2595,1810),new Phaser.Geom.Point(2545,1600),
      new Phaser.Geom.Point(2590,1390),new Phaser.Geom.Point(2525,1200),
      new Phaser.Geom.Point(2570,1010),new Phaser.Geom.Point(2540,820),
      new Phaser.Geom.Point(2610,620),new Phaser.Geom.Point(2580,420),
      new Phaser.Geom.Point(2640,220)
    ];
    const drawEastRiver=(g:Phaser.GameObjects.Graphics)=>{
      g.beginPath();g.moveTo(eastRiverPoints[0].x,eastRiverPoints[0].y);
      eastRiverPoints.slice(1).forEach(p=>g.lineTo(p.x,p.y));
      g.closePath();g.fillPath();
    };
    const eastRiverBed=this.add.graphics().setDepth(-83);
    eastRiverBed.fillStyle(0x07566b,1);drawEastRiver(eastRiverBed);
    this.water=this.add.tileSprite(2860,1200,680,2400,'village-water').setDepth(-82);
    this.water.setTileScale(.58);
    const eastRiverMask=this.make.graphics({x:0,y:0});
    eastRiverMask.fillStyle(0xffffff);drawEastRiver(eastRiverMask);
    this.water.setMask(eastRiverMask.createGeometryMask());

    // The Master has a second body of water in the southwest, directly below the
    // stone descent and around the dock. Without it the new pier reads as if it
    // were sitting on dry dirt. Build this as an independent irregular inlet so
    // it does not alter the validated east river.
    // Extend the inlet farther east so it reads as the lower-left coastal basin
    // seen in the Master, rather than a narrow blue wedge beside the dock.
    this.southwestWaterBed=this.add.graphics().setDepth(-83);
    this.southwestWaterBed.fillStyle(0x07566b,1);
    this.southwestWaterBed.beginPath();
    this.southwestWaterBed.moveTo(0,1710);
    this.southwestWaterBed.lineTo(330,1710);
    this.southwestWaterBed.lineTo(590,1810);
    this.southwestWaterBed.lineTo(770,1990);
    this.southwestWaterBed.lineTo(1030,2180);
    this.southwestWaterBed.lineTo(1220,2400);
    this.southwestWaterBed.lineTo(0,2400);
    this.southwestWaterBed.closePath();
    this.southwestWaterBed.fillPath();

    this.southwestWater=this.add.tileSprite(560,2055,1120,690,'village-water').setDepth(-82);
    this.southwestWater.setTileScale(.58);
    const southwestWaterMask=this.make.graphics({x:0,y:0});
    southwestWaterMask.fillStyle(0xffffff);
    southwestWaterMask.beginPath();
    southwestWaterMask.moveTo(0,1710);
    southwestWaterMask.lineTo(330,1710);
    southwestWaterMask.lineTo(590,1810);
    southwestWaterMask.lineTo(770,1990);
    southwestWaterMask.lineTo(1030,2180);
    southwestWaterMask.lineTo(1220,2400);
    southwestWaterMask.lineTo(0,2400);
    southwestWaterMask.closePath();
    southwestWaterMask.fillPath();
    this.southwestWater.setMask(southwestWaterMask.createGeometryMask());

    // Relief follows the outside perimeter instead of cutting through the plaza.
    placeSized('village-cliff',720,500,1200,470);
    placeSized('village-cliff',2230,500,1180,470,true);
    placeSized('village-cliff',360,1320,1200,1290);
    // Keep the lower-right cliff on the west bank only; the previous 1300px piece
    // extended across the river and its opaque dirt top looked like a dry strip.
    placeSized('village-cliff',2180,2180,900,2150,true);
    placeSized('village-cliff',1040,2300,1300,2270);
    placeSized('village-cliff',1960,2300,1300,2270,true);

    // Keep the east river visually continuous. The old bank PNG contains opaque
    // ground inside the sprite, so placing it across the channel created false
    // "dry" horizontal bands. River-edge relief will be rebuilt with dedicated
    // edge assets that never cover the water surface.
    // Production bridge: keep the proven east-west anchor/orientation from the Aurora test,
    // but use the wider village asset that matches the master composition.
    placeSized('village-bridge',2860,1120,760,1120);

    // Large vegetation masses soften the perimeter and hide joins between relief pieces.
    placeSized('village-tree',430,1120,360,1110);
    placeSized('village-tree',2410,720,330,710,true);
    placeSized('village-tree',2370,1940,360,1930);

    // Master-reference infill pass: occupy the large empty southern half with the
    // same functional zones visible in the reference, without changing the validated river/bridge.
    // Southwest = second civic/workshop building; southeast = market cluster.
    placeSized('village-workshop',1050,1435,430,1425);
    placeSized('village-market',1950,1430,340,1420,true);

    // South entrance mirrors the reference's lower access. Keep it well inside the
    // paved footprint so the later path/dock layer can connect to it cleanly.
    placeSized('village-gate',1550,1900,680,1900);

    // Southwest production pass: reproduce the master's lower-left transition as
    // a real change of level instead of another flat decoration. The rocky ledge
    // defines the terrace, the stair is the deliberate descent and the pier anchors
    // the village to the water-side edge. Major Composition 19 landmarks stay fixed.
    // Match the Master's southwest sequence: civic building -> terrace edge -> broad
    // stair -> lower landing -> dock. Keep the stair close to the workshop instead
    // of isolated in the middle of the southern dirt field.
    placeSized('village-ledge',650,1745,760,1725);
    placeSized('village-stairs',760,1835,350,1825);

    // Master 32: the reference has a second climbing leg after the dock stair.
    // Reuse the same architectural stair language as a smaller upper flight so
    // the southwest route reads as a continuous ascent instead of a dead end.
    const upperSouthwestStair=placeSized('village-stairs',585,1650,285,1640);
    upperSouthwestStair.setAngle(-7);
    placeKit('village-nexaKit',10,690,1600,72,1595);
    placeKit('village-ambientKit',7,500,1605,135,1595,true);

    placeSized('village-pier',500,2040,650,2030);

    // Southwest Master density: clusters frame the stair/dock and southern
    // approach while the actual walking route stays visually open.
    placeKit('village-ambientKit',1,470,1705,190,1695);
    placeKit('village-ambientKit',3,930,1760,170,1750);
    placeKit('village-ambientKit',6,315,1875,170,1865);
    placeKit('village-ambientKit',8,1010,1970,220,1960);
    placeKit('village-ambientKit',4,1180,1900,180,1890);
    placeKit('village-ambientKit',5,1260,2020,145,2010);
    placeKit('village-nexaKit',5,675,1880,105,1875);
    placeKit('village-nexaKit',1,1110,2050,105,2045);

    // Master 06: connect the dock terrace to the southern gate with smaller,
    // irregular edge clusters. The central corridor remains deliberately open.
    placeKit('village-ambientKit',2,560,1585,175,1575,true);
    placeKit('village-ambientKit',7,1035,1660,155,1650);
    placeKit('village-ambientKit',3,1285,1735,145,1725,true);
    placeKit('village-ambientKit',6,1375,1865,130,1855);
    placeKit('village-ambientKit',1,1490,2045,150,2035,true);
    placeKit('village-ambientKit',5,910,2075,125,2065);
    placeKit('village-nexaKit',9,1280,2100,95,2095);
    placeKit('village-marketForgeKit',1,575,1980,82,1975);
    placeKit('village-marketForgeKit',3,735,2005,70,2000);

    // Master 07: build the garden-like lower transition seen in the reference.
    // The mass stays on both shoulders of the south axis, leaving the center
    // readable and preparing the later dirt-path treatment toward the gate.
    placeKit('village-ambientKit',2,820,1885,205,1875);
    placeKit('village-ambientKit',4,1015,1840,185,1830,true);
    placeKit('village-ambientKit',7,1165,1810,145,1800);
    placeKit('village-ambientKit',1,1300,1785,165,1775,true);
    // Keep the south-gate arch and its approach completely readable.
    placeKit('village-ambientKit',8,1875,1845,175,1835);
    placeKit('village-ambientKit',3,1740,1940,155,1930,true);
    placeKit('village-ambientKit',6,1840,2020,155,2010);
    placeKit('village-ambientKit',5,1590,2115,130,2105,true);
    placeKit('village-nexaKit',4,1760,2080,100,2075);
    placeKit('village-nexaKit',9,1465,2140,85,2135,true);

    // Low shoulder detail around the gate, never inside the arch.
    placeKit('village-ambientKit',3,1215,1945,120,1935);
    placeKit('village-ambientKit',5,1870,1975,115,1965,true);
    placeKit('village-ambientKit',7,1085,2040,105,2030,true);

    // Master 09: the reference uses dense shoulders but a clean central route.
    // Add low/medium masses outside the gate axis and break the empty dirt field
    // into layered natural pockets instead of isolated shrubs.
    placeKit('village-ambientKit',4,930,1905,150,1895);
    placeKit('village-ambientKit',8,1080,1870,165,1860,true);
    placeKit('village-ambientKit',2,1980,1875,165,1865);
    placeKit('village-ambientKit',7,2110,1950,145,1940,true);
    placeKit('village-ambientKit',6,930,2145,135,2135,true);
    placeKit('village-ambientKit',3,2050,2150,135,2140);
    placeKit('village-nexaKit',12,1965,2050,90,2045);
    placeKit('village-nexaKit',5,1030,2110,82,2105,true);

    // Master 10: define the southern route itself, not only its vegetation.
    // A narrow dirt corridor runs from the plaza toward the lower gate, while
    // asymmetrical low clusters create the same enclosed garden feeling as the Master.
    // Keep every placement outside the arch opening and player corridor.
    placeKit('village-ambientKit',1,1180,2145,155,2135,true);
    placeKit('village-ambientKit',8,1340,2180,145,2170);
    placeKit('village-ambientKit',4,1765,2190,150,2180,true);
    placeKit('village-ambientKit',2,1940,2210,170,2200);
    placeKit('village-ambientKit',7,2145,2075,155,2065,true);
    placeKit('village-ambientKit',3,2210,2190,135,2180);
    placeKit('village-nexaKit',12,1170,2195,72,2190);
    placeKit('village-nexaKit',5,2060,2170,74,2165,true);

    // Master 11: soften the lower edge of the stone plaza. The reference does
    // not end in one clean geometric slab: small natural pockets nibble into the
    // paving while the north-south circulation line remains completely open.
    placeKit('village-ambientKit',3,1010,1545,125,1535);
    placeKit('village-ambientKit',5,1135,1615,105,1605,true);
    placeKit('village-ambientKit',7,1280,1665,95,1655);
    placeKit('village-ambientKit',6,1825,1640,100,1630,true);
    placeKit('village-ambientKit',3,1980,1570,120,1560,true);
    placeKit('village-ambientKit',5,2070,1660,105,1650);
    placeKit('village-nexaKit',9,1060,1665,66,1660);
    placeKit('village-nexaKit',12,2020,1695,68,1690,true);

    // Master 12: pull natural detail inward around the four plaza quadrants.
    // The reference has broken, garden-like shoulders around buildings rather than
    // a single uninterrupted rectangle of paving. Keep the monument ring and all
    // cardinal walking axes untouched.
    placeKit('village-ambientKit',5,760,1125,105,1115);
    placeKit('village-ambientKit',3,830,1245,115,1235,true);
    placeKit('village-ambientKit',7,1015,1285,95,1275);
    placeKit('village-ambientKit',6,2110,1185,100,1175,true);
    placeKit('village-ambientKit',3,2210,1280,115,1270);
    placeKit('village-ambientKit',5,2025,1370,95,1360,true);
    placeKit('village-ambientKit',2,1120,740,120,730,true);
    placeKit('village-ambientKit',7,1980,760,115,750);
    placeKit('village-nexaKit',9,870,1325,62,1320);
    placeKit('village-nexaKit',12,2180,1370,64,1365,true);

    // Master 13: give the plaza functional life. The reference is not only greener:
    // forge/market props and small NEXA fixtures create dense inhabited shoulders.
    // Keep these tucked against façades so the four main plaza routes stay open.
    placeKit('village-marketForgeKit',11,660,1040,145,1035);
    placeKit('village-marketForgeKit',7,1115,1040,125,1035,true);
    placeKit('village-marketForgeKit',5,1940,1045,120,1040);
    placeKit('village-marketForgeKit',4,2210,1035,120,1030,true);
    placeKit('village-marketForgeKit',2,990,1465,105,1460);
    placeKit('village-marketForgeKit',6,1900,1445,110,1440,true);

    // Cyan vertical accents around the plaza echo the Master's four pylons without
    // competing with the central monument. Warm fixtures remain near commerce.
    placeKit('village-nexaKit',6,1195,1100,78,1095);
    placeKit('village-nexaKit',6,1905,1100,78,1095,true);
    placeKit('village-nexaKit',10,1195,1345,72,1340,true);
    placeKit('village-nexaKit',10,1905,1345,72,1340);
    placeKit('village-nexaKit',5,735,1005,68,1000);
    placeKit('village-nexaKit',5,2165,1000,68,995,true);

    // Master 14: tighten the civic core around the monument. In the Master the
    // circular shrine is framed by vegetation and cyan civic furniture, so the
    // plaza reads as a designed hub instead of a large empty stone sheet.
    // Everything stays outside the monument ring and the cardinal walking cross.
    placeKit('village-ambientKit',3,1080,1060,115,1050,true);
    placeKit('village-ambientKit',5,1160,1010,92,1000);
    placeKit('village-ambientKit',7,1940,1015,92,1005,true);
    placeKit('village-ambientKit',3,2020,1070,112,1060);
    placeKit('village-ambientKit',5,1110,1390,92,1380,true);
    placeKit('village-ambientKit',7,1990,1390,92,1380);

    // Small NEXA fixtures form the four diagonal shoulders visible around the
    // Master monument. They deliberately avoid x=1550/y=1210 circulation lines.
    placeKit('village-nexaKit',9,1265,1015,62,1010);
    placeKit('village-nexaKit',12,1835,1015,62,1010,true);
    placeKit('village-nexaKit',9,1265,1415,62,1410,true);
    placeKit('village-nexaKit',12,1835,1415,62,1410);

    // Commerce-side clutter is pushed against façades, matching the dense,
    // lived-in perimeter of the reference without scattering props in walkways.
    placeKit('village-marketForgeKit',1,720,1140,78,1135);
    placeKit('village-marketForgeKit',3,805,1165,72,1160,true);
    placeKit('village-marketForgeKit',4,2180,1135,78,1130,true);
    placeKit('village-marketForgeKit',2,2260,1160,72,1155);

    // Master 15: break the oversized clean paving around the civic core.
    // The reference has irregular green/rock pockets between the buildings and the
    // monument; these medium clusters pull nature inward without closing any route.
    placeKit('village-ambientKit',2,970,1110,155,1100);
    placeKit('village-ambientKit',4,1060,950,145,940,true);
    placeKit('village-ambientKit',8,2090,1115,150,1105,true);
    placeKit('village-ambientKit',2,2020,950,145,940);
    placeKit('village-ambientKit',4,1045,1460,150,1450);
    placeKit('village-ambientKit',8,2050,1460,150,1450,true);

    // Additional low pockets near façades make the architecture feel embedded in
    // the terrain, like the Master, instead of placed on top of a rectangular floor.
    placeKit('village-ambientKit',5,790,900,95,890,true);
    placeKit('village-ambientKit',7,1010,860,105,850);
    placeKit('village-ambientKit',5,2110,865,100,855);
    placeKit('village-ambientKit',7,2260,930,100,920,true);
    placeKit('village-ambientKit',3,890,1510,105,1500,true);
    placeKit('village-ambientKit',3,2190,1510,105,1500);

    // A few cyan mineral/ruin accents tie the natural pockets back into the NEXA
    // language. Keep them subtle: the monument remains the strongest cyan source.
    placeKit('village-nexaKit',12,985,1005,66,1000);
    placeKit('village-nexaKit',9,2115,1005,66,1000,true);
    placeKit('village-nexaKit',12,1015,1515,62,1510,true);
    placeKit('village-nexaKit',9,2085,1515,62,1510);

    // Master 17: functional zoning from the actual reference.
    // NW = forge/tools; NE = open market; SW = workshop; SE = cloth/general stall.
    // Use larger readable props, grouped by function instead of scattering tiny objects.
    placeKit('village-marketForgeKit',7,735,1035,155,1030);
    placeKit('village-marketForgeKit',9,825,1080,105,1075);
    placeKit('village-marketForgeKit',11,900,1090,125,1085);

    placeKit('village-marketForgeKit',5,2160,1015,180,1010);
    placeKit('village-marketForgeKit',6,2250,1060,175,1055);
    placeKit('village-marketForgeKit',4,2325,1090,115,1085);

    placeKit('village-marketForgeKit',10,865,1455,145,1450);
    placeKit('village-marketForgeKit',3,930,1490,95,1485);

    placeKit('village-marketForgeKit',6,2110,1440,175,1435);
    placeKit('village-marketForgeKit',5,2200,1480,155,1475);
    placeKit('village-marketForgeKit',8,2270,1490,105,1485);

    // Cyan civic posts in the Master sit outside the monument ring at diagonal shoulders.
    // Make these readable at gameplay scale instead of numerous tiny cyan specks.
    placeKit('village-nexaKit',6,1215,1015,96,1010);
    placeKit('village-nexaKit',6,1885,1015,96,1010,true);
    placeKit('village-nexaKit',10,1215,1415,90,1410,true);
    placeKit('village-nexaKit',10,1885,1415,90,1410);

    // Master 24: east waterfront transition.
    // Keep the bridge itself untouched; strengthen the approach so the market,
    // civic plaza and river read as one connected district like the Master.
    placeKit('village-marketForgeKit',6,2260,1055,92,1050);
    placeKit('village-marketForgeKit',10,2360,1135,78,1130,true);
    placeKit('village-nexaKit',8,2450,1200,72,1195);
    placeKit('village-nexaKit',4,2320,1375,66,1370,true);

    // Sparse civic anchors around the monument. Keep the cross-shaped
    // circulation lanes open instead of filling the plaza with clutter.
    placeKit('village-marketForgeKit',11,1080,1190,74,1185);
    placeKit('village-marketForgeKit',9,2020,1200,76,1195,true);

    // Master 25: northern civic corridor.
    // The Master keeps the axis from the monument to the north gate readable,
    // but frames it with small lived-in details instead of another vegetation wall.
    placeKit('village-marketForgeKit',6,1220,735,82,730);
    placeKit('village-marketForgeKit',10,1880,760,78,755,true);
    placeKit('village-nexaKit',8,1335,845,64,840);
    placeKit('village-nexaKit',4,1770,850,62,845,true);

    // A few low props pull the forge/market fronts into the civic space while
    // preserving the broad cross-shaped circulation visible in the reference.
    placeKit('village-marketForgeKit',11,1060,900,68,895);
    placeKit('village-marketForgeKit',9,2050,910,70,905,true);

    // Master 26: central NEXA axis.
    // The reference has a subtle cyan line running through the civic paving.
    // Use small NEXA details to suggest that route without adding another
    // building or closing the north/south walkable corridor.
    placeKit('village-nexaKit',8,1550,770,54,765);
    placeKit('village-nexaKit',4,1550,965,50,960,true);
    placeKit('village-nexaKit',8,1550,1535,52,1530);
    placeKit('village-nexaKit',4,1550,1700,48,1695,true);

    // Lower plaza transition: two low civic details frame the southern route,
    // echoing the Master's lamps/ruin markers while leaving the center open.
    placeKit('village-marketForgeKit',6,1325,1605,70,1600);
    placeKit('village-marketForgeKit',10,1775,1605,70,1600,true);

    // Master 27: accelerated visual convergence pass.
    // Work by complete reference zones instead of one tiny adjustment per deploy:
    // northwest forge court, northeast market court, southwest civic terrace,
    // southeast market garden and the waterfront approach.

    // NW forge court: broad working apron + warm readable clutter.
    placeKit('village-marketForgeKit',7,700,930,175,925);
    placeKit('village-marketForgeKit',11,825,955,150,950);
    placeKit('village-marketForgeKit',9,930,930,112,925,true);
    placeKit('village-nexaKit',5,1060,900,78,895);

    // NE market court: denser stall frontage like the Master, but stop before bridge lane.
    placeKit('village-marketForgeKit',5,2130,900,205,895);
    placeKit('village-marketForgeKit',6,2250,930,190,925);
    placeKit('village-marketForgeKit',4,2370,980,125,975,true);
    placeKit('village-nexaKit',5,2025,905,76,900,true);

    // SW terrace: expose the workshop as a civic building and frame its route to stairs/dock.
    placeKit('village-ambientKit',7,790,1510,150,1500);
    placeKit('village-marketForgeKit',10,900,1515,120,1510);
    placeKit('village-nexaKit',10,1040,1530,76,1525,true);

    // SE market garden: recognizable commerce on the inner edge, vegetation behind it.
    placeKit('village-marketForgeKit',6,2050,1510,190,1505,true);
    placeKit('village-marketForgeKit',5,2180,1540,175,1535);
    placeKit('village-nexaKit',10,1950,1530,76,1525);

    // Master-like civic punctuation around the lower ring. These are intentionally
    // larger than previous scatter so they read at the default gameplay zoom.
    placeKit('village-nexaKit',6,1260,1450,105,1445);
    placeKit('village-nexaKit',6,1840,1450,105,1445,true);
    placeKit('village-marketForgeKit',3,1160,1510,105,1505);
    placeKit('village-marketForgeKit',8,1940,1510,108,1505,true);

    // Waterfront approach: visually carry the east arm all the way toward the bridge.
    placeKit('village-marketForgeKit',6,2390,1080,115,1075);
    placeKit('village-nexaKit',8,2500,1125,88,1120);
    placeKit('village-marketForgeKit',10,2470,1285,105,1280,true);
    placeKit('village-nexaKit',4,2380,1390,82,1385,true);

    // Master 28: accelerated silhouette pass — close the largest remaining
    // visual gap with the Master in one deploy: architecture reads clearly,
    // vegetation frames it, and the civic cross stays open.

    // Upper-left: forge court enclosed by rocky/green shoulders, not empty paving.
    placeSized('village-tree',620,760,230,750);
    placeKit('village-ambientKit',8,720,790,250,780);
    placeKit('village-ambientKit',4,930,760,180,750,true);
    placeKit('village-marketForgeKit',7,780,925,175,920);
    placeKit('village-marketForgeKit',11,930,965,135,960);

    // Upper-right: create the Master's busy market edge and transition to river.
    placeSized('village-tree',2440,770,230,760,true);
    placeKit('village-ambientKit',2,2350,820,235,810);
    placeKit('village-marketForgeKit',5,2190,900,210,895);
    placeKit('village-marketForgeKit',6,2350,940,190,935);
    placeKit('village-marketForgeKit',4,2460,1010,125,1005,true);

    // Lower-left civic building: clear façade, then a dense garden/rock frame
    // leading naturally toward the stair and southwest dock.
    placeSized('village-tree',760,1470,230,1460,true);
    placeKit('village-ambientKit',2,850,1540,240,1530);
    placeKit('village-ambientKit',4,1060,1630,215,1620,true);
    placeKit('village-marketForgeKit',10,940,1450,135,1445);
    placeKit('village-nexaKit',6,1110,1510,92,1505);

    // Lower-right market garden: readable stall frontage with the heavier
    // vegetation pushed behind it, matching the Master's layered silhouette.
    placeSized('village-tree',2320,1490,245,1480);
    placeKit('village-ambientKit',8,2230,1570,250,1560,true);
    placeKit('village-ambientKit',2,2040,1640,215,1630);
    placeKit('village-marketForgeKit',6,2110,1450,205,1445,true);
    placeKit('village-marketForgeKit',5,2250,1490,175,1485);

    // Four strong civic shoulders around the monument. This gives the centre
    // the same designed circular enclosure as the Master without touching its ring.
    placeKit('village-nexaKit',6,1165,1080,108,1075);
    placeKit('village-nexaKit',6,1935,1080,108,1075,true);
    placeKit('village-nexaKit',10,1190,1435,102,1430,true);
    placeKit('village-nexaKit',10,1910,1435,102,1430);

    // Narrow the oversized southern stone field with two large asymmetric garden
    // shoulders. Keep x≈1550 completely open from monument to south gate.
    placeSized('village-tree',1210,1730,250,1720);
    placeSized('village-tree',1910,1735,260,1725,true);
    placeKit('village-ambientKit',8,1110,1810,270,1800);
    placeKit('village-ambientKit',4,2010,1815,270,1805,true);
    placeKit('village-ambientKit',2,1260,1900,225,1890,true);
    placeKit('village-ambientKit',8,1850,1900,225,1890);

    // East arm to bridge: continuous visual rhythm from plaza -> market -> bridge.
    placeKit('village-marketForgeKit',10,2380,1120,110,1115,true);
    placeKit('village-nexaKit',8,2490,1160,90,1155);
    placeKit('village-ambientKit',7,2440,1320,145,1310,true);
    placeKit('village-nexaKit',4,2360,1400,86,1395,true);

    // Master 29: large-form reference pass.
    // Push the scene toward the Master's strongest missing silhouettes:
    // framed north entrance, populated civic ring, stepped south approach,
    // waterfront density and cyan landmarks. Preserve the validated anchors.

    // North entrance should read as a destination, not a gate floating in dirt.
    placeSized('village-tree',1120,560,260,550);
    placeSized('village-tree',1990,560,260,550,true);
    placeKit('village-ambientKit',2,980,600,260,590);
    placeKit('village-ambientKit',8,2120,600,260,590,true);
    placeKit('village-nexaKit',6,1280,650,100,645);
    placeKit('village-nexaKit',6,1820,650,100,645,true);

    // Upper civic avenue: introduce the Master's lamps / people-scale rhythm.
    placeKit('village-marketForgeKit',3,1290,820,100,815);
    placeKit('village-marketForgeKit',3,1810,820,100,815,true);
    placeKit('village-nexaKit',10,1370,900,82,895);
    placeKit('village-nexaKit',10,1730,900,82,895,true);

    // Make the monument plaza feel inhabited and designed without crowding Kael.
    placeKit('village-marketForgeKit',8,1110,1160,105,1155);
    placeKit('village-marketForgeKit',8,1990,1160,105,1155,true);
    placeKit('village-nexaKit',5,1070,1280,82,1275);
    placeKit('village-nexaKit',5,2030,1280,82,1275,true);

    // Southwest transition toward the dock: terraces, technology and vegetation.
    placeKit('village-ambientKit',4,650,1710,260,1700);
    placeSized('village-tree',820,1810,250,1800,true);
    placeKit('village-nexaKit',4,930,1860,90,1855);
    placeKit('village-marketForgeKit',10,1030,1760,120,1755);

    // Southeast transition toward the lower rocky path.
    placeKit('village-ambientKit',2,2450,1700,260,1690,true);
    placeSized('village-tree',2260,1810,250,1800);
    placeKit('village-nexaKit',4,2160,1860,90,1855,true);
    placeKit('village-marketForgeKit',10,2060,1760,120,1755,true);

    // South approach: frame the route with large shoulders while preserving
    // the central walkable spine to the lower gate.
    placeKit('village-ambientKit',8,1050,2050,300,2040);
    placeKit('village-ambientKit',8,2050,2050,300,2040,true);
    placeSized('village-tree',1190,2100,255,2090);
    placeSized('village-tree',1910,2100,255,2090,true);
    placeKit('village-nexaKit',6,1300,2110,95,2105);
    placeKit('village-nexaKit',6,1800,2110,95,2105,true);

    // Waterfront: strengthen the Master's cliff/technology cadence around the
    // bridge entrance, but never place opaque art across the water itself.
    placeKit('village-ambientKit',4,2440,900,190,890,true);
    placeKit('village-nexaKit',6,2470,1010,88,1005);
    placeKit('village-marketForgeKit',3,2470,1320,92,1315,true);
    placeKit('village-ambientKit',7,2510,1510,185,1500);
    placeKit('village-nexaKit',6,2480,1580,95,1575,true);

    // Cyan landmark clusters echo the Master and visually connect ruins to NEXA.
    placeKit('village-nexaKit',8,720,1220,105,1215);
    placeKit('village-nexaKit',8,2380,1230,105,1225,true);
    placeKit('village-nexaKit',4,930,2050,100,2045);
    placeKit('village-nexaKit',4,2170,2050,100,2045,true);

    // Master 30: destination pass — make the village read as a real place.
    // Add recognizable districts and strong foreground silhouettes while keeping
    // the validated plaza, gates, bridge and central travel spine untouched.

    // Forge district: dense work-yard punctuation and warm civic activity.
    placeKit('village-marketForgeKit',6,760,930,180,925);
    placeKit('village-marketForgeKit',5,900,920,145,915,true);
    placeKit('village-marketForgeKit',9,1040,960,92,955);
    placeKit('village-ambientKit',7,670,1050,165,1040,true);
    placeKit('village-nexaKit',10,820,1110,78,1105);

    // Market district: layered stalls / goods cadence instead of one isolated shop.
    placeKit('village-marketForgeKit',6,2200,900,180,895,true);
    placeKit('village-marketForgeKit',5,2350,950,145,945);
    placeKit('village-marketForgeKit',9,2070,970,92,965,true);
    placeKit('village-ambientKit',7,2430,1050,165,1040);
    placeKit('village-nexaKit',10,2280,1110,78,1105,true);

    // Civic plaza perimeter: four compact light/tech stations create the
    // Master's deliberate circular rhythm without filling the playable ring.
    placeKit('village-marketForgeKit',3,1030,1220,86,1215);
    placeKit('village-marketForgeKit',3,2070,1220,86,1215,true);
    placeKit('village-nexaKit',4,1160,1510,88,1505);
    placeKit('village-nexaKit',4,1940,1510,88,1505,true);

    // Lower-left quarter: visually connect workshop -> stairs -> dock.
    placeKit('village-marketForgeKit',5,700,1570,150,1565);
    placeKit('village-ambientKit',7,590,1660,175,1650);
    placeKit('village-nexaKit',6,760,1810,92,1805);
    placeSized('village-tree',600,1880,220,1870);

    // Lower-right quarter: make the secondary market feel seated in terrain.
    placeKit('village-marketForgeKit',6,2360,1540,150,1535,true);
    placeKit('village-ambientKit',7,2490,1640,175,1630,true);
    placeKit('village-nexaKit',6,2330,1810,92,1805,true);
    placeSized('village-tree',2380,1880,200,1870,true);

    // South gate forecourt: strong paired ruins and cyan markers create the
    // Master's lower-frame destination while leaving the centre line open.
    placeKit('village-ambientKit',4,1220,2220,235,2210);
    placeKit('village-ambientKit',4,1880,2220,235,2210,true);
    placeKit('village-nexaKit',8,1330,2240,100,2235);
    placeKit('village-nexaKit',8,1770,2240,100,2235,true);
    placeKit('village-marketForgeKit',3,1390,2160,84,2155);
    placeKit('village-marketForgeKit',3,1710,2160,84,2155,true);

    // Bridge approach: a compact fortified threshold before the water.
    placeKit('village-nexaKit',10,2470,1130,82,1125);
    placeKit('village-nexaKit',10,2470,1390,82,1385,true);
    placeKit('village-marketForgeKit',9,2500,1200,82,1195);
    placeKit('village-marketForgeKit',9,2500,1320,82,1315,true);

    // Master 31: silhouette and circulation pass.
    // The Master gets much of its richness from irregular edge masses framing
    // a clean cross-shaped civic circulation. Strengthen that contrast.

    // North avenue: compress detail toward the sides so the gate-to-monument
    // axis reads as an intentional ceremonial street.
    placeKit('village-ambientKit',7,1030,710,190,700);
    placeKit('village-ambientKit',7,2070,710,190,700,true);
    placeSized('village-tree',900,760,220,750);
    placeSized('village-tree',2200,760,220,750,true);
    placeKit('village-marketForgeKit',9,1170,760,82,755);
    placeKit('village-marketForgeKit',9,1930,760,82,755,true);

    // West/east plaza shoulders: create the Master's broken garden pockets,
    // leaving the horizontal route between forge, monument and bridge readable.
    placeKit('village-ambientKit',2,930,1250,185,1240,true);
    placeKit('village-ambientKit',4,2170,1250,185,1240);
    placeSized('village-tree',850,1330,205,1320,true);
    placeSized('village-tree',2250,1330,205,1320);
    placeKit('village-nexaKit',8,960,1390,90,1385);
    placeKit('village-nexaKit',8,2140,1390,90,1385,true);

    // Add small inhabited punctuation around the open civic floor.
    placeKit('village-marketForgeKit',3,1260,1040,76,1035);
    placeKit('village-marketForgeKit',3,1840,1040,76,1035,true);
    placeKit('village-marketForgeKit',9,1280,1570,76,1565);
    placeKit('village-marketForgeKit',9,1820,1570,76,1565,true);

    // South corridor: two asymmetric landscape terraces visually narrow the
    // oversized paving while preserving a generous playable lane at x≈1550.
    placeKit('village-ambientKit',2,1040,1980,250,1970);
    placeKit('village-ambientKit',4,2070,1990,250,1980,true);
    placeSized('village-tree',1110,2070,225,2060,true);
    placeSized('village-tree',2000,2080,225,2070);
    placeKit('village-marketForgeKit',10,1240,2020,100,2015);
    placeKit('village-marketForgeKit',10,1870,2030,100,2025,true);

    // Waterfront shoulder: build a denser rocky/tech frame beside the bridge,
    // never over the water surface.
    placeKit('village-ambientKit',2,2440,820,180,810,true);
    placeKit('village-nexaKit',4,2470,950,82,945);
    placeKit('village-ambientKit',8,2440,1530,190,1520);
    placeKit('village-nexaKit',4,2470,1660,82,1655,true);

    // Outer west shoulder mirrors the Master's cliff garden and helps remove
    // the remaining large empty dirt patches.
    placeKit('village-ambientKit',8,470,900,250,890);
    placeSized('village-tree',520,1040,235,1030,true);
    placeKit('village-ambientKit',4,500,1440,250,1430,true);
    placeSized('village-tree',570,1570,225,1560);

    // Master 32: river cleanup. Keep all trunks/props on dry ground and form a
    // clearer rocky west-bank cadence. Nothing below crosses x=2520, so the
    // water channel remains visually clean.
    placeKit('village-ambientKit',4,2460,700,170,690);
    placeKit('village-ambientKit',2,2450,1760,185,1750,true);
    placeKit('village-nexaKit',8,2480,1850,78,1845);
    placeKit('village-ambientKit',7,2420,1990,165,1980);

    // Master 33: rebuild the west bank as a readable rock/vegetation cadence.
    // These sit entirely on dry ground and deliberately leave the bridge mouth open.
    placeKit('village-ambientKit',8,2490,470,230,460,true);
    placeKit('village-ambientKit',4,2475,620,195,610);
    placeKit('village-ambientKit',2,2500,790,205,780,true);
    placeKit('village-ambientKit',7,2470,1450,190,1440);
    placeKit('village-ambientKit',8,2490,1730,215,1720,true);
    placeKit('village-ambientKit',4,2470,2100,230,2090);
    placeKit('village-nexaKit',4,2495,560,70,555);
    placeKit('village-nexaKit',8,2490,1900,76,1895,true);

    // Reveal the southwest level change instead of burying it under foliage:
    // small edge accents lead the eye from workshop -> upper stair -> lower stair -> pier.
    placeKit('village-marketForgeKit',9,690,1690,72,1685);
    placeKit('village-nexaKit',10,820,1775,66,1770,true);
    placeKit('village-ambientKit',5,455,1800,105,1790);
    placeKit('village-marketForgeKit',1,545,1905,72,1900);

    // Master 34: major terrain-form pass.
    // The reference's remaining advantage is not more tiny props; it is strong
    // large-scale silhouettes: a rocky northeast water source, a framed southern
    // canyon approach and layered southwest ascent. Build those forms with the
    // existing production kit while keeping the validated civic anchors untouched.

    // Northeast headwater/cascade frame. All pieces stay on the west shoulder of
    // the masked river so no trunk or opaque art is placed inside the channel.
    placeKit('village-ambientKit',8,2460,260,300,250,true);
    placeKit('village-ambientKit',2,2510,365,250,355);
    placeSized('village-tree',2380,410,245,400,true);
    placeKit('village-nexaKit',12,2470,430,92,425);
    placeKit('village-nexaKit',4,2390,500,74,495,true);

    // Upper gate shoulders: close the bare dirt wedges with asymmetrical rocky
    // gardens, matching the Master's gate embedded in terrain rather than on a field.
    placeKit('village-ambientKit',8,850,500,285,490);
    placeKit('village-ambientKit',2,2250,505,285,495,true);
    placeSized('village-tree',1010,510,220,500,true);
    placeSized('village-tree',2090,515,220,505);
    placeKit('village-nexaKit',12,1110,590,78,585);
    placeKit('village-nexaKit',9,1990,590,78,585,true);

    // Southwest second-level trail: make the climb leg visible from the plaza.
    // A staggered line of stone/ruin accents traces the slope without blocking it.
    placeKit('village-ambientKit',4,420,1510,225,1500);
    placeKit('village-ambientKit',7,500,1595,180,1585,true);
    placeKit('village-marketForgeKit',9,555,1700,78,1695);
    placeKit('village-nexaKit',10,625,1760,72,1755,true);
    placeKit('village-ambientKit',5,690,1830,105,1820);

    // Southern canyon frame: the Master funnels the path between vegetation and
    // rock before the lower gate. Reinforce both shoulders, leave x=1450..1650 open.
    placeKit('village-ambientKit',8,1110,2260,285,2250);
    placeKit('village-ambientKit',2,1990,2260,285,2250,true);
    placeSized('village-tree',1030,2330,230,2320,true);
    placeSized('village-tree',2070,2330,230,2320);
    placeKit('village-nexaKit',12,1250,2310,82,2305);
    placeKit('village-nexaKit',9,1850,2310,82,2305,true);

    // East lower ravine: a heavier dry-bank silhouette makes the masked river feel
    // carved into rock rather than pasted beside the terrain.
    placeKit('village-ambientKit',8,2460,1980,245,1970,true);
    placeKit('village-ambientKit',2,2500,2190,270,2180);
    placeKit('village-nexaKit',4,2460,2280,84,2275,true);

    // Master 22: restore the Master's middle-scale breathing room.
    // The reference is dense at the perimeter, but the civic ring itself stays
    // readable. Pull the strongest foliage away from the lower shop facades and
    // use smaller landscape accents to form the transition instead.
    placeKit('village-ambientKit',4,980,1580,145,1570,true);
    placeKit('village-ambientKit',8,2120,1585,145,1575);
    placeKit('village-ambientKit',2,1180,1740,155,1730);
    placeKit('village-ambientKit',4,1930,1745,155,1735,true);

    // Warm light/market punctuation around the plaza shoulders mirrors the
    // reference's inhabited feel while preserving clear movement lanes.
    placeKit('village-marketForgeKit',9,1125,1115,88,1110);
    placeKit('village-marketForgeKit',3,1980,1120,86,1115,true);

    // Master 21: preserve the Master's readable architecture.
    // The previous south pass established the right silhouette, but its largest
    // canopies hid too much of the lower buildings. Keep the organic shoulders
    // while exposing roofs, shop fronts and the civic route again.
    placeKit('village-ambientKit',4,1010,1515,170,1505,true);
    placeKit('village-ambientKit',8,2085,1520,170,1510);
    placeKit('village-nexaKit',6,1435,1595,72,1590);
    placeKit('village-nexaKit',6,1665,1595,72,1590,true);

    // A few readable commercial objects bridge the plaza and the two lower
    // buildings, as in the reference, without turning the centre into clutter.
    placeKit('village-marketForgeKit',3,1040,1385,92,1380);
    placeKit('village-marketForgeKit',8,2055,1390,98,1385,true);

    // Master 20: carve the lower civic cross with asymmetric garden shoulders.
    // In the reference the south route is a narrow stone avenue framed by dense
    // vegetation, not a full-width paved rectangle.
    placeSized('village-tree',1330,1665,225,1655);
    placeSized('village-tree',1785,1660,235,1650,true);
    placeSized('village-tree',1110,1735,195,1725,true);
    placeSized('village-tree',2015,1735,200,1725);

    placeKit('village-ambientKit',8,1260,1710,260,1700);
    placeKit('village-ambientKit',4,1850,1715,260,1705,true);
    placeKit('village-ambientKit',2,1090,1800,230,1790,true);
    placeKit('village-ambientKit',8,2030,1800,230,1790);

    // Build the irregular garden wedges seen below the plaza. The centre stays
    // intentionally empty so the north-south circulation remains obvious.
    placeKit('village-ambientKit',4,1370,1810,220,1800);
    placeKit('village-ambientKit',2,1740,1815,220,1805,true);
    placeKit('village-ambientKit',8,1220,1880,205,1870,true);
    placeKit('village-ambientKit',4,1900,1885,205,1875);

    // The reference has stronger vegetation seams beside the east/west arms too.
    placeSized('village-tree',760,1120,195,1110);
    placeSized('village-tree',2350,1135,200,1125,true);
    placeKit('village-ambientKit',2,865,1190,205,1180);
    placeKit('village-ambientKit',8,2240,1200,205,1190,true);

    // Master 19: structural landscape pass.
    // The reference does not surround the plaza with isolated trees: it uses
    // connected garden/rock shoulders that visually narrow the paved cross.
    placeSized('village-tree',1030,1215,255,1205);
    placeSized('village-tree',2070,1225,265,1215,true);
    placeSized('village-tree',1260,1510,225,1500);
    placeSized('village-tree',1900,1515,235,1505,true);

    // Dense organic seams around the lower civic axis, while keeping the
    // monument-to-south-gate corridor completely readable.
    placeKit('village-ambientKit',8,1080,1435,245,1425);
    placeKit('village-ambientKit',2,2020,1440,245,1430,true);
    placeKit('village-ambientKit',4,1210,1615,215,1605);
    placeKit('village-ambientKit',8,1900,1620,215,1610,true);

    // Stronger rocky shoulders beside the upper commercial zones. These make
    // the buildings feel embedded in the terrain instead of floating on tiles.
    placeKit('village-ambientKit',4,690,845,225,835,true);
    placeKit('village-ambientKit',2,2390,865,225,855);
    placeKit('village-ambientKit',8,820,1160,205,1150);
    placeKit('village-ambientKit',4,2280,1170,205,1160,true);

    // Master 18: reference-scale vegetation masses.
    // The Master uses a few substantial trees/garden masses to frame the plaza;
    // this is more important than adding more tiny scatter props.
    placeSized('village-tree',790,1265,285,1255);
    placeSized('village-tree',2250,1285,300,1275,true);
    placeSized('village-tree',1180,1605,245,1595,true);
    placeSized('village-tree',2050,1600,270,1590);

    // Keep the north approach readable but visually enclosed, as in the Master.
    placeSized('village-tree',790,700,250,690,true);
    placeSized('village-tree',2290,720,260,710);

    // Larger organic shoulders replace the remaining 'objects sprinkled on stone'
    // feeling. They sit behind/alongside commerce and never cover the civic cross.
    placeKit('village-ambientKit',2,720,930,220,920);
    placeKit('village-ambientKit',8,2320,940,220,930,true);
    placeKit('village-ambientKit',4,900,1370,190,1360,true);
    placeKit('village-ambientKit',2,2200,1375,195,1365);
    placeKit('village-ambientKit',8,1110,1575,180,1565);
    placeKit('village-ambientKit',4,1990,1575,180,1565,true);

    // Warm commercial anchors: fewer but larger readable objects, matching the
    // forge/market density visible in the Master.
    placeKit('village-marketForgeKit',9,760,1015,120,1010);
    placeKit('village-marketForgeKit',11,860,1055,130,1050);
    placeKit('village-marketForgeKit',5,2205,1015,165,1010);
    placeKit('village-marketForgeKit',6,2290,1055,155,1050);

    // Master 16: the reference transitions from plaza stone into dense organic
    // borders much earlier. Build broad asymmetrical garden pockets around the
    // lower half of the civic core while preserving the north/south/east/west lanes.
    placeKit('village-ambientKit',2,875,1325,220,1315);
    placeKit('village-ambientKit',4,1005,1365,190,1355,true);
    placeKit('village-ambientKit',8,2185,1320,220,1310,true);
    placeKit('village-ambientKit',2,2055,1370,190,1360);
    placeKit('village-ambientKit',4,1180,1545,185,1535);
    placeKit('village-ambientKit',8,1920,1545,185,1535,true);

    // Upper shoulders beside the monument/buildings: in the Master these are not
    // bare paving all the way to the façades; small planted/rocky islands frame them.
    placeKit('village-ambientKit',7,1115,865,145,855);
    placeKit('village-ambientKit',5,1985,865,145,855,true);
    placeKit('village-ambientKit',3,825,1040,135,1030,true);
    placeKit('village-ambientKit',3,2275,1040,135,1030);

    // Sparse NEXA accents inside those organic shoulders.
    placeKit('village-nexaKit',12,1090,1360,70,1355);
    placeKit('village-nexaKit',9,2010,1360,70,1355,true);

    // Vegetation is intentionally concentrated against relief/building edges,
    // leaving the central circulation axes open as in the master composition.
    placeSized('village-tree',900,1410,245,1400,true);
    placeSized('village-tree',1990,1350,230,1340);
    placeSized('village-tree',1750,1570,215,1560,true);

    const g=this.add.graphics();
    g.fillStyle(0x111827);g.fillEllipse(18,31,30,13);
    g.fillStyle(0x28364b);g.fillRoundedRect(7,8,22,27,6);
    g.fillStyle(0xd7e4e8);g.fillTriangle(8,12,18,2,29,13);
    g.fillStyle(0x5ce8ed);g.fillRect(11,14,14,4);
    g.fillStyle(0x17202e);g.fillRect(5,21,26,12);
    g.generateTexture('village-kael',36,40);g.destroy();

    this.player=this.physics.add.sprite(1550,1530,'village-kael').setCollideWorldBounds(true);
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
    this.add.text(18,18,'VILA DAS RUÍNAS CRISTALINAS · COMPOSIÇÃO 19 · MASTER 34 · GRANDES FORMAS',{fontFamily:'monospace',fontSize:'14px',color:'#e9feff',backgroundColor:'#061019dd',padding:{x:10,y:7}}).setScrollFactor(0).setDepth(100001);
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
    this.southwestWater && (this.southwestWater.tilePositionY-=.14);
    this.cameras.main.setZoom(Phaser.Math.Linear(this.cameras.main.zoom,this.zoom,.12));
  }
}
