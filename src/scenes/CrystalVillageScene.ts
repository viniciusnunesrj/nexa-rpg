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

    // Opaque river bed: the current water PNG has translucent edge pixels, so the
    // brown world ground was leaking through at every repeated tile boundary.
    // A solid deep-water layer underneath prevents any terrain from appearing in-channel.
    this.add.rectangle(2860,1200,610,2400,0x07566b,1).setDepth(-83);
    this.water=this.add.tileSprite(2860,1200,610,2400,'village-water').setDepth(-82);
    this.water.setTileScale(.58);

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

    // Master 20: carve the lower civic cross with asymmetric garden shoulders.
    // In the reference the south route is a narrow stone avenue framed by dense
    // vegetation, not a full-width paved rectangle.
    placeSized('village-tree',1330,1665,285,1655);
    placeSized('village-tree',1785,1660,300,1650,true);
    placeSized('village-tree',1110,1735,250,1725,true);
    placeSized('village-tree',2015,1735,255,1725);

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
    placeSized('village-tree',760,1120,235,1110);
    placeSized('village-tree',2350,1135,245,1125,true);
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
    this.add.text(18,18,'VILA DAS RUÍNAS CRISTALINAS · COMPOSIÇÃO 19 · MASTER 20 · EIXO SUL ORGÂNICO',{fontFamily:'monospace',fontSize:'14px',color:'#e9feff',backgroundColor:'#061019dd',padding:{x:10,y:7}}).setScrollFactor(0).setDepth(100001);
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
