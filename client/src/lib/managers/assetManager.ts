import { Assets } from "pixi.js";

class AssetManager {
  status: "LOADED" | "LOADING" | "NOT-LOADED" = 'NOT-LOADED'
  init() {
		this.status = 'LOADING';
		Assets.load([
			'/tile-icons/flag.png',
			'/tile-icons/gift.png',
			'/tile-icons/safe.png',
			'/tile-icons/skull.png',
			'/tile-icons/money.png',
			'/tile-icons/warning.png',
			'/tile-icons/money_bag.png',
		]).then(()=>this.status = 'LOADED')
		
	}
}

export const assetManager = new AssetManager();
