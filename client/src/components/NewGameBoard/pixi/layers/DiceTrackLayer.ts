import * as PIXI from "pixi.js";
import { TRACK_COORDINATES, INNER_EDGE_SPEC } from "../../config/dice-track-config";
import { pixiTargetLocator } from "@/animation/target-locator";
import { BACKGROUND_COLOR } from "../engine";
import { TokenLayer } from "./TokenLayer";
import { type TileConfig, type TileType, DICE_TRACK } from "@color-wars/shared/src/config/diceTrack";
import { useStore } from "@/stores/sessionStore";

type TileTextureConfig = {
  baseHex?: {
    fill?: number;
    stroke?: number;
  };

  icon?: {
    path: string;
    scale: number;
    offset: { x: number; y: number };
    anchor?: { x: number; y: number };
  };

  text?: {
    prefix?: string;
    style?: Partial<PIXI.TextStyle>;
    anchor?: { x: number; y: number };
    pos: { x: number; y: number };
  };
};

export const TILE_TEXTURE_CONFIG: Record<TileType, TileTextureConfig> = {
  START: {
    baseHex: {},
    icon: {
      path: "/tile-icons/flag.png",
      scale: 0.4,
      offset: { x: 0, y: 0 },
    },
  },
  NEUTRAL: {},
  SAFE: {
    baseHex: {
      stroke: 0xffffff,
    },
    icon: {
      path: "/tile-icons/angel_wings.png",
      scale: 0.18,
      offset: { x: 0, y: 0 },
    },
  },
  SURPRISE: {
    baseHex: {
      stroke: 0xffea00,
    },
    icon: {
      path: "/tile-icons/gift.png",
      scale: 0.25,
      offset: { x: 0, y: 0 },
    },
  },
  PENALTY: {
    baseHex: {
      fill: 0x000000,
      stroke: 0x262626,
    },
    icon: {
      path: "/tile-icons/skull.png",
      scale: 0.25,
      offset: { x: 0, y: 0 },
    },
  },
  REWARD: {
    baseHex: {
      stroke: 0x9900ff,
    },
    icon: {
      path: "/tile-icons/money_bag.png",
      scale: 0.25,
      offset: { x: 0, y: 0 },
    },
  },
  INCOME: {
    baseHex: {
      stroke: 0x00b536,
    },
    icon: {
      path: "/tile-icons/money.png",
      scale: 0.25,
      anchor: { x: 0.5, y: 0.8 },
      offset: { x: 0, y: 0 },
    },
    text: {
      prefix: "+",
      style: {
        fill: {
          color: 0x00b536,
        },
      },
      pos: { x: 0, y: 28 },
    },
  },
  TAX: {
    baseHex: {
      stroke: 0xff4d4d,
    },
    icon: {
      path: "/tile-icons/warning.png",
      scale: 0.25,
      anchor: { x: 0.5, y: 0.8 },
      offset: { x: 0, y: 0 },
    },
    text: {
      prefix:'-',
      style: {
        fill: {
          color: 0xff4d4d,
        },
      },
      pos: { x: 0, y: 30 },
    },
  },
};

export class DiceTrackLayer extends PIXI.Container {
  private background: PIXI.Graphics;
  private trackContainer: PIXI.Container;
  private sprites: PIXI.Sprite[] = [];
  public tokenLayer: TokenLayer | null = null;
  private hexTextures: Partial<Record<string, PIXI.Texture>> = {};

  // Configuration
  private readonly PADDING = 0; // Padding from screen edge

  private getTileTextureCacheKey = (tileConfig: TileConfig) => `${tileConfig.type}${tileConfig.amount ? "_" + tileConfig.amount : ""}`;

  constructor() {
    super();

    pixiTargetLocator.register("diceTrackLayer", this);

    // 1. Background (The opaque wall with the hole)
    this.background = new PIXI.Graphics();
    this.background.eventMode = "static"; // Block clicks
    this.addChild(this.background);

    // 2. Track (The visible tiles)
    this.trackContainer = new PIXI.Container();
    this.addChild(this.trackContainer);
  }
  /**
   * Called once by engine to setup the sprites
   */
  public init(app: PIXI.Application) {
    // Generate a high-res texture for the hexes
    this.hexTextures = this.generateRoundedHexTextures(app);

    // Create Sprites
    const diceTrack = useStore.getState().state.game.diceTrack;
    if (diceTrack && diceTrack.length > 0) {
      diceTrack.forEach((t, i) => {
        let cacheKey = this.getTileTextureCacheKey(t as TileConfig);
        if (!this.hexTextures[cacheKey]) {
          this.hexTextures[cacheKey] = this.getHexTexture(t as TileConfig, app);
        }
        const sprite = new PIXI.Sprite(this.hexTextures[cacheKey]);
        sprite.anchor.set(0.5);
        const targetID = `track-tile-${i}`;
        pixiTargetLocator.register(targetID, sprite);
        sprite.label = targetID;
        this.sprites.push(sprite);
        this.trackContainer.addChild(sprite);
      });
    } else {
      TRACK_COORDINATES.forEach((_, i) => {
        const sprite = new PIXI.Sprite(this.hexTextures[this.getTileTextureCacheKey(DICE_TRACK[i])]);
        sprite.anchor.set(0.5);
        const targetID = `track-tile-${i}`;
        if (!sprite.destroyed) pixiTargetLocator.register(targetID, sprite); // register for animation
        sprite.label = targetID; // Debug label
        this.sprites.push(sprite);
        this.trackContainer.addChild(sprite);
      });
    }

    this.tokenLayer = new TokenLayer();
    this.tokenLayer.zIndex = 100;
    this.trackContainer.sortableChildren = true;
    pixiTargetLocator.register("tokenLayer", this.tokenLayer);
    this.trackContainer.addChild(this.tokenLayer);
  }

  public getTrackLayer() {
    return this.trackContainer;
  }

  public getTrackSprites(): PIXI.Sprite[] {
    return this.sprites;
  }

  public getTokenLayer() {
    return this.tokenLayer;
  }

  public prepareNewTileSprite(newTile: TileConfig, app: PIXI.Application): PIXI.Sprite {
    let cacheKey = this.getTileTextureCacheKey(newTile);
    if (!this.hexTextures[cacheKey]) {
      this.hexTextures[cacheKey] = this.getHexTexture(newTile, app);
    }
    
    const newSprite = new PIXI.Sprite(this.hexTextures[cacheKey]);
    newSprite.anchor.set(0.5);
    newSprite.scale.copyFrom(this.sprites[0].scale);
    newSprite.position.set(this.sprites[0].x, this.sprites[0].y);
    newSprite.alpha = 0;
    newSprite.zIndex = 0;
    this.trackContainer.addChildAt(newSprite, 0);
    return newSprite;
  }

  public commitTrackShift(count: number, direction: 'forward' | 'backward', newSprites: PIXI.Sprite[]) {
    if (direction === 'forward') {
      const vanishing = this.sprites.splice(1, count);
      vanishing.forEach(v => v.destroy());
      this.sprites.push(...newSprites);
    } else {
      const vanishing = this.sprites.splice(this.sprites.length - count, count);
      vanishing.forEach(v => v.destroy());
      this.sprites.splice(1, 0, ...newSprites);
    }
    
    this.sprites.forEach((s, idx) => {
      const targetID = `track-tile-${idx}`;
      s.label = targetID;
      pixiTargetLocator.register(targetID, s);
    });
  }

  /**
   * Called on Resize: Fits the track to the screen and cuts the hole
   */
  public resize(screenWidth: number, screenHeight: number) {
    if (this.sprites.length === 0) return;

    // --- 1. Calculate Cartesian Bounds of the Track ---
    // We assume an arbitrary hex size of 1.0 to find the aspect ratio
    let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity;

    TRACK_COORDINATES.forEach((c) => {
      const { x, y } = this.axialToFlat(c.q, c.r, 1);
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    });

    // Dimensions of the track in "unit" hexes
    // Add roughly 2.0 (1 hex width on each side) to account for the sprite size itself
    // Width of flat top = 2 * size.
    const trackWidth = maxX - minX + 2.0;
    const trackHeight = maxY - minY + 1.8; // height is sqrt(3) ~ 1.732

    // --- 2. Determine Scale ---
    const availW = screenWidth - this.PADDING * 2;
    const availH = screenHeight - this.PADDING * 2;

    const scaleX = availW / trackWidth;
    const scaleY = availH / trackHeight;

    // Choose smaller scale to fit entirely
    const hexSize = Math.floor(Math.min(scaleX, scaleY));

    // --- 3. Position Track ---
    // Center the container
    this.trackContainer.position.set(screenWidth / 2, screenHeight / 2);

    // Calculate offset to center the grid within the container
    const offsetX = (-(minX + maxX) / 2) * hexSize;
    const offsetY = (-(minY + maxY) / 2) * hexSize;
    const scale = hexSize / 64;

    // Update Sprites
    TRACK_COORDINATES.forEach((c, i) => {
      const { x, y } = this.axialToFlat(c.q, c.r, hexSize);
      this.sprites[i].position.set(x + offsetX, y + offsetY);
      // Scale texture to match the calculated size
      // Texture radius is 64. Real radius is hexSize.
      this.sprites[i].scale.set(scale);
    });

    // --- 4. Draw Overlay with Hole ---
    this.drawOverlay(screenWidth, screenHeight, hexSize, offsetX, offsetY);
    this.tokenLayer!.resize(scale);
  }

  private drawOverlay(w: number, h: number, size: number, offX: number, offY: number) {
    const g = this.background;
    g.clear();

    // 1. Draw Opaque Screen
    g.rect(0, 0, w, h).fill({ color: BACKGROUND_COLOR, alpha: 1.0 });

    // 2. Cut out the Hole
    // We walk through the INNER_EDGE_SPEC
    const points: { x: number; y: number }[] = [];

    for (const key in INNER_EDGE_SPEC) {
      const edges = INNER_EDGE_SPEC[key];
      const [q, r] = key.split(",").map(Number);

      // Center of this hex relative to screen center
      const { x: cx, y: cy } = this.axialToFlat(q, r, size);
      // Absolute screen position
      const absX = w / 2 + offX + cx;
      const absY = h / 2 + offY + cy;

      // Add corners for these edges
      // Edge i connects Corner i to Corner (i+1)%6
      edges.forEach((edgeIdx) => {
        const p = this.getFlatHexCorner(absX, absY, size, edgeIdx);

        const last = points[points.length - 1];
        if (!last || Math.hypot(p.x - last.x, p.y - last.y) > 2) {
          points.push(p);
        }
      });
    }

    this.drawRoundedLoop(g, points, 12);
    g.cut();
    // this.drawRoundedLoop(g, points, 4);
    // g.stroke({ width: 4, color: 0x111111, join: "round", cap: "round" }); // Debug: visualize the cut line
  }

  private drawRoundedLoop(g: PIXI.Graphics, points: { x: number; y: number }[], radius: number) {
    if (points.length < 3) return;

    // To round corners, we start between the last and first point
    const len = points.length;
    const p0 = points[len - 1];
    const p1 = points[0];

    // Start mid-segment to allow arcTo to work on the first corner
    const startX = (p0.x + p1.x) / 2;
    const startY = (p0.y + p1.y) / 2;

    g.moveTo(startX, startY);

    for (let i = 0; i < len; i++) {
      const p = points[i];
      const next = points[(i + 1) % len];
      // Draw line to current point, then curve toward next
      g.arcTo(p.x, p.y, next.x, next.y, radius);
    }
    g.closePath();
  }

  private axialToFlat(q: number, r: number, size: number) {
    // Flat Top Conversion
    // x = size * 3/2 * q
    // y = size * sqrt(3) * (r + q/2)
    const x = size * 1.5 * q;
    const y = size * Math.sqrt(3) * (r + q / 2);
    return { x, y };
  }

  private getFlatHexCorner(cx: number, cy: number, size: number, i: number) {
    const angle_deg = 60 * i;
    const angle_rad = (Math.PI / 180) * angle_deg;
    return {
      x: cx + size * Math.cos(angle_rad),
      y: cy + size * Math.sin(angle_rad),
    };
  }

  
  private getHexTexture(tileConfig: TileConfig, app: PIXI.Application) {
      const RADIUS = 64;
      const GAP = 0.05;
      const STROKEWIDTH = 4;
      const FINAL_RADIUS = RADIUS * (1 - GAP);
      const textureCfg = TILE_TEXTURE_CONFIG[tileConfig.type]

      const container = new PIXI.Container();

      // HEX Shape
      const g = new PIXI.Graphics();
      // INNER STROKE PATH
      g.roundPoly(0, 0, FINAL_RADIUS, 6, 10, Math.PI / 6);
      g.fill(textureCfg.baseHex?.fill ?? 0x262626);
      if(textureCfg.baseHex?.stroke){
        g.stroke({ width: STROKEWIDTH, color: textureCfg.baseHex?.stroke, alignment: 1 });
      }
      // FILL PATH
      //g.roundPoly(0, 0, FINAL_RADIUS - STROKEWIDTH, 6, 10, Math.PI / 6);
      container.addChild(g);
      // Icon
      if(textureCfg.icon){
        const iconCfg = textureCfg.icon
        const icon = new PIXI.Sprite(PIXI.Texture.from(iconCfg.path));
        if(iconCfg.anchor){
          const {x, y} = iconCfg.anchor
          icon.anchor.set(x, y);
        }else{
          icon.anchor.set(0.5);
        }
        if(iconCfg.scale) icon.scale.set(iconCfg.scale);
        container.addChild(icon);
      }

      if(textureCfg.text){
        const textCfg = textureCfg.text
        const text = new PIXI.Text({
          text: `${textCfg.prefix??""}${tileConfig.amount??""}`,
          style: {
            fontSize:24 - (tileConfig.amount!>999? 2: 0),
            ...textCfg.style
          },
        })
        text.anchor.set(0.5)
        const {x, y} = textCfg.pos
        text.position.set(x, y)
        
        container.addChild(text)
      }
      

      return app.renderer.textureGenerator.generateTexture({
        target: container,
        resolution: window.devicePixelRatio || 1,
        antialias: true,
      });
    };

  private generateRoundedHexTextures(app: PIXI.Application) {
    const hexTextures: Partial<Record<string, PIXI.Texture>> = {};
    DICE_TRACK.forEach((t)=>{
      const key = this.getTileTextureCacheKey(t)
      hexTextures[key] = this.getHexTexture(t, app)
    })
    return hexTextures;
  }
}
