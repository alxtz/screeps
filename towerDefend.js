module.exports = () => {
  const towers = Game.rooms['E38N41'].find(FIND_STRUCTURES, {
    filter: (s) => s.structureType == STRUCTURE_TOWER
  })

  for (let tower of towers) {
    const target = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
    console.log('target', target)
    if (target !== null) {
      const result = tower.attack(target)
      console.log('attack result', result)
    } else {
      console.log('no enemy')
    }
  }
}
