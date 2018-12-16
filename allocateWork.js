const ROLES = require('shared.roles')

// source id
const BOTTOM_LEFT_SOURCE = 0;
const BOTTOM_RIGHT_SOURCE = 1;

// config
const ENERGY_LIMIT = 300;

// liveObjects
let SPAWN;
let TOTAL_ENERGY;

module.exports = () => {
  SPAWN = Game.spawns["Alex"];
  TOTAL_ENERGY = SPAWN.room.energyAvailable;

  for (let name in Game.creeps) {
    const creep = Game.creeps[name];
    const role = creep.memory.role;

    switch (role) {

      case ROLES.COLLECTOR: {
        if (creep.carry.energy < creep.carryCapacity) {
          moveOrHarvestSource(creep);
        } else {
          transferEnergy(creep);
        }
        break;
      }

      case ROLES.BIG_COLLECTOR: {
        if (creep.carry.energy < creep.carryCapacity) {
          moveOrHarvestSource(creep);
        } else {
          transferEnergy(creep);
        }
        break;
      }

      case ROLES.UPGRADER: {
        doUpgraderWork(creep);
        break;
      }

      case ROLES.BIG_UPGRADER: {
        doUpgraderWork(creep);
        break;
      }

      case ROLES.BUILDER: {
        creep.say('BUILDER')
        let buildTargets = creep.room.find(FIND_CONSTRUCTION_SITES);
        buildTargets = _.sortBy(buildTargets, target => creep.pos.getRangeTo(target))
        const errorCode = creep.build(buildTargets[0]);
        if (errorCode === OK) {
        } else {
          if (
            errorCode == ERR_NOT_IN_RANGE &&
            creep.carry.energy === creep.carryCapacity
          ) {
            creep.moveTo(buildTargets[0], { visualizePathStyle: { stroke: "#FF00FF" } });
          } else if (creep.carry.energy < creep.carryCapacity) {
            harvestBuildEnergy(creep);
          }
        }
        break;
      }

      case ROLES.ATTACKER: {
        var enemy = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
        var result = creep.attack(enemy);
        if (result === ERR_NOT_IN_RANGE) {
          creep.moveTo(enemy, { visualizePathStyle: { stroke: "#ffffff" } });
        }
        break;
      }

      case ROLES.REPAIRER: {
        // creep.say('REPAIRER')
        const targets = creep.room.find(FIND_STRUCTURES, {
          filter: structure => structure.hits < structure.hitsMax
        })
        targets.sort((a,b) => a.hits - b.hits);

        if (targets.length === 0) return

        console.log('target', targets[0].hits)

        const sources = creep.room.find(FIND_SOURCES);
        const inRepairRange = creep.repair(targets[0]) !== ERR_NOT_IN_RANGE
        const ableToHarvest = creep.harvest(sources[BOTTOM_LEFT_SOURCE]) !== ERR_NOT_IN_RANGE && creep.carry.energy < creep.carryCapacity
        const requireMoving = !inRepairRange && !ableToHarvest

        if (requireMoving) {
          if (creep.carry.energy > 0) {
            creep.moveTo(targets[0]);
          } else {
            creep.moveTo(sources[BOTTOM_LEFT_SOURCE]);
          }
        } else {
          if (inRepairRange) {
            const result = creep.repair(targets[0])
            if (result === ERR_NOT_ENOUGH_RESOURCES) {
              creep.moveTo(sources[BOTTOM_LEFT_SOURCE]);
            }
          } else if (ableToHarvest) {
            creep.harvest(sources[BOTTOM_LEFT_SOURCE])
          }
        }
        break;
      }

      case ROLES.TOWER_FILLER: {
        creep.say('TOWER_FILLER')
        const targets = creep.room.find(FIND_STRUCTURES, {
          filter: structure => structure.structureType === STRUCTURE_TOWER
        })

        const sources = creep.room.find(FIND_SOURCES);
        const ableToFill = creep.transfer(targets[0], RESOURCE_ENERGY) !== ERR_NOT_IN_RANGE
        const ableToHarvest = creep.harvest(sources[BOTTOM_LEFT_SOURCE]) !== ERR_NOT_IN_RANGE && creep.carry.energy < creep.carryCapacity
        const requireMoving = !ableToFill && !ableToHarvest

        if (requireMoving) {
          if (creep.carry.energy > 0) {
            creep.moveTo(targets[0]);
          } else {
            creep.moveTo(sources[BOTTOM_LEFT_SOURCE]);
          }
        } else {
          if (ableToFill) {
            const result = creep.transfer(targets[0], RESOURCE_ENERGY)
            if (result === ERR_NOT_ENOUGH_RESOURCES) {
              creep.moveTo(sources[BOTTOM_LEFT_SOURCE]);
            }
          } else if (ableToHarvest) {
            creep.harvest(sources[BOTTOM_LEFT_SOURCE])
          }
        }

        break;
      }
    }
  }
}

function doUpgraderWork(creep) {
  if (creep.upgradeController(creep.room.controller) == OK) {
    return;
  }

  if (
    creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE &&
    creep.carry.energy === creep.carryCapacity
  ) {
    creep.moveTo(creep.room.controller, {
      visualizePathStyle: { stroke: "#00ffff" }
    });
  } else {
    var sources = creep.room.find(FIND_SOURCES);
    if (creep.harvest(sources[BOTTOM_LEFT_SOURCE]) == ERR_NOT_IN_RANGE) {
      creep.moveTo(sources[BOTTOM_LEFT_SOURCE], {
        visualizePathStyle: { stroke: "#00ffff" }
      });
    }
  }
}

function moveOrHarvestSource(creep) {
  var sources = creep.room.find(FIND_SOURCES);
  if (creep.harvest(sources[BOTTOM_RIGHT_SOURCE]) == ERR_NOT_IN_RANGE) {
    creep.moveTo(sources[BOTTOM_RIGHT_SOURCE], {
      visualizePathStyle: { stroke: "#ffffff" }
    });
  }
}

function harvestBuildEnergy(creep) {
  const sources = creep.room.find(FIND_SOURCES);

  let sourceIdToUse = creep.memory.sourceIdToUse

  if (sourceIdToUse === undefined) {
    sourceIdToUse === sources[BOTTOM_RIGHT_SOURCE].id
  }

  const sourceObject = Game.getObjectById(sourceIdToUse)
  const result = creep.harvest(sourceObject);
  if (result == ERR_NOT_IN_RANGE) {
    creep.moveTo(sourceObject, { visualizePathStyle: { stroke: "#005566" } })
  }
}

function transferEnergy(creep) {
  if (
    creep.transfer(SPAWN, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE &&
    SPAWN.energy < ENERGY_LIMIT
  ) {
    creep.moveTo(SPAWN, { visualizePathStyle: { stroke: "#ffffff" } });
  } else {
    let notFullExtensions = SPAWN.room.find(FIND_MY_STRUCTURES, {
      // filter: { structureType: STRUCTURE_EXTENSION }
      filter: structure => {
        const isExtension = structure.structureType === STRUCTURE_EXTENSION
        const notFull = structure.energy < 50
        return isExtension && notFull
      }
    });
    notFullExtensions = _.sortBy(notFullExtensions, extension => creep.pos.getRangeTo(extension))
    if (
      creep.transfer(notFullExtensions[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE
    ) {
      creep.moveTo(notFullExtensions[0], {
        visualizePathStyle: { stroke: "#ffffff" }
      });
    } else {
      var containers = SPAWN.room.find(FIND_MY_STRUCTURES, {
        filter: { structureType: STRUCTURE_STORAGE }
      });
      if (creep.transfer(containers[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
        creep.moveTo(containers[0], {
          visualizePathStyle: { stroke: "#ffffff" }
        });
      }
    }
  }
}
