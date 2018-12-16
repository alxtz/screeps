const allocateWork = require('allocateWork')
const spawnCreep = require('spawnCreep')
const towerDefend = require('towerDefend')

module.exports.loop = () => {
  spawnCreep()
  allocateWork()
  towerDefend()
};
