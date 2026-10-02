import Phaser from 'phaser';
import { auroraAssets } from './assetManifest';

export const queueAuroraAssets=(scene:Phaser.Scene)=>{
  for(const asset of auroraAssets){
    if(asset.kind==='spritesheet'&&asset.frameWidth&&asset.frameHeight){
      scene.load.spritesheet(asset.key,asset.path,{frameWidth:asset.frameWidth,frameHeight:asset.frameHeight});
    }else{
      scene.load.image(asset.key,asset.path);
    }
  }
};
