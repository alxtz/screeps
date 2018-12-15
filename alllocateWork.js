function allocateWork() {
  for (var name in Game.creeps) {
    var creep = Game.creeps[name];
    var role = creep.memory.role;

    switch (role) {
      case COLLECTOR: {
        if (creep.carry.energy < creep.carryCapacity) {
          moveOrHarvestSource(creep);
        } else {
          transferEnergy(creep);
        }
        break;
      }

      case BIG_COLLECTOR: {
        if (creep.carry.energy < creep.carryCapacity)
          moveOrHarvestSource(creep);
        else transferEnergy(creep);
        break;
      }
      case UPGRADER: {
        doUpgraderWork(creep);
        break;
      }
      case BIG_UPGRADER: {
        doUpgraderWork(creep);
        break;
      }
      case BUILDER: {
        creep.say("builder");
        var buildTargets = creep.room.find(FIND_CONSTRUCTION_SITES);
        var errorCode = creep.build(buildTargets[0]);
        if (errorCode === OK) {
        } else {
          if (
            errorCode == ERR_NOT_IN_RANGE &&
            creep.carry.energy === creep.carryCapacity
          ) {
            creep.moveTo(buildTargets[0], {
              visualizePathStyle: { stroke: "#FF00FF" }
            });
          } else if (creep.carry.energy < creep.carryCapacity) {
            harvestBuildEnergy(creep);
          }
        }
        break;
      }
      case ATTACKER: {
        var enemy = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
        var result = creep.attack(enemy);
        if (result === ERR_NOT_IN_RANGE) {
          creep.moveTo(enemy, { visualizePathStyle: { stroke: "#ffffff" } });
        }
      }
    }
  }
}
