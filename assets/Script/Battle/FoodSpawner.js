const LeanCloud = require("../LeanCloud");
const { getClient } = LeanCloud;
const { randomPos } = require("./BattleHelper");
const Food = require("./Food");
const Constants = require("../Constants");

const { Event } = Play;

/**
 * 食物生成器
 */
cc.Class({
  extends: cc.Component,

  properties: {
    foodTempleteList: {
      type: cc.Prefab,
      default: []
    }
  },

  // LIFE-CYCLE CALLBACKS:

  initPlay() {
    this._idToFoods = {};
    const client = getClient();
    client.on(
      Event.ROOM_CUSTOM_PROPERTIES_CHANGED,
      this.onRoomPropertiesChanged,
      this
    );
    client.on(Event.CUSTOM_EVENT, this.onCustomEvent, this);
    if (client.player.isMaster) {
      setInterval(() => {
        const foods = Object.values(this._idToFoods);
        console.log(`current foods count: ${foods.length}`);
        const roomFoods = [];
        foods.forEach(f => {
          const { id, type } = f;
          const { x, y } = f.node.position;
          roomFoods.push({
            id,
            type,
            x,
            y
          });
        });
        client.room.setCustomProperties({
          roomFoods
        });
      }, Constants.SYNC_FOOD_DURATION);
      setInterval(() => {
        // TODO 补充食物
        const foods = Object.values(this._idToFoods);
        const spawnFoodCount = Constants.INIT_FOOD_COUNT - foods.length;
        cc.log(`respawn: ${spawnFoodCount}`);
        this.spawnFoodsData(spawnFoodCount);
      }, Constants.SPAWN_FOOD_DURATION);
    }
  },

  /**
   * 生成食物数据
   * @param {Number} count
   */
  spawnFoodsData(count) {
    const client = getClient();
    const roomFoods = [];
    // 只生成数据
    let { roomFoodId } = client.room.customProperties;
    if (!roomFoodId) {
      roomFoodId = 0;
    }
    // 暂定初始生成 100 个食物
    for (let i = 0; i < count; i++) {
      const id = roomFoodId + i;
      const type =
        parseInt(Math.random() * 1000000) % this.foodTempleteList.length;
      const { x, y } = randomPos();
      roomFoods.push({ id, type, x, y });
    }
    roomFoodId += count;
    // 此时可能导致消息很大
    client.room.setCustomProperties({
      roomFoodId,
      roomFoods
    });
  },

  spawnFoodNodes() {
    const client = getClient();
    const { roomFoods } = client.room.customProperties;
    cc.log(`spawn ${roomFoods.length} foods`);
    if (roomFoods) {
      roomFoods.forEach(roomFood => {
        const { id, type, x, y } = roomFood;
        if (this._idToFoods[id]) {
          return;
        }
        const foodNode = cc.instantiate(this.foodTempleteList[type]);
        foodNode.position = cc.v2(x, y);
        this.node.addChild(foodNode);
        const food = foodNode.getComponent(Food);
        food.id = id;
        food.type = type;
        this._idToFoods[id] = food;
      });
    }
  },

  // Play Event

  onRoomPropertiesChanged({ changedProps }) {
    console.log(`room changed props: ${JSON.stringify(changedProps)}`);
    const { roomFoods } = changedProps;
    if (roomFoods) {
      this.spawnFoodNodes(roomFoods);
    }
  },

  onCustomEvent({ eventId, eventData }) {
    if (eventId === Constants.EAT_EVENT) {
      this.onEatEvent(eventData);
    }
  },

  onEatEvent(eventData) {
    const { bId, fId } = eventData;
    cc.log(`remove food: ${fId}`);
    const food = this._idToFoods[fId];
    this.node.removeChild(food.node);
    delete this._idToFoods[fId];
  }
});