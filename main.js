const allocateWork = require('allocateWork')
const spawnCreep = require('spawnCreep')

module.exports.loop = () => {
  spawnCreep()
  allocateWork()
};
