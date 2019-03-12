const Ball = require("Ball");
/**
 * 战斗 UI
 */
cc.Class({
  extends: cc.Component,

  properties: {
    infoLabel: {
      type: cc.Label,
      default: null
    },
    hero: {
      type: Ball,
      default: null
    }
  },

  // LIFE-CYCLE CALLBACKS:

  // onLoad () {},

  start() {},

  update(dt) {
    this.infoLabel.string = `Weight: ${parseInt(
      this.hero.weight()
    )}, Speed: ${parseInt(this.hero.speed())}`;
  }
});