const allocateWork = require('allocateWork')
const spawnCreep = require('spawnCreep')

module.exports.loop = () => {
  spawnCreep()
  allocateWork()

  const nextRoom = Game.rooms['E37N41']
  const nextController = nextRoom.controller
  const claimerCreep = Game.creeps['CC']
};
