const ROLES = require('shared.roles')

// source id
const BOTTOM_LEFT_SOURCE = 0;
const BOTTOM_RIGHT_SOURCE = 1;

// config
const ENERGY_LIMIT = 300;
const MAX_CREEPS = 18;

// liveObjects
let SPAWN;
let TOTAL_ENERGY;

module.exports = () => {
  SPAWN = Game.spawns["Alex"];
  TOTAL_ENERGY = SPAWN.room.energyAvailable;

  for (var name in Game.creeps) {
    var creep = Game.creeps[name];
    var role = creep.memory.role;

    switch (role) {
      case ROLES.COLLECTOR: {
        if (creep.carry.energy < creep.carryCapacity)
          moveOrHarvestSource(creep);
        else transferEnergy(creep);
        break;
      }
      case ROLES.BIG_COLLECTOR: {
        if (creep.carry.energy < creep.carryCapacity)
          moveOrHarvestSource(creep);
        else transferEnergy(creep);
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
      case ROLES.ATTACKER: {
        var enemy = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
        var result = creep.attack(enemy);
        if (result === ERR_NOT_IN_RANGE) {
          creep.moveTo(enemy, { visualizePathStyle: { stroke: "#ffffff" } });
        }
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
  var sources = creep.room.find(FIND_SOURCES);
  // const result = creep.harvest(sources[BOTTOM_LEFT_SOURCE])
  const result = creep.harvest(sources[BOTTOM_RIGHT_SOURCE]);
  if (creep.carry.energy === creep.carryCapacity) {
    creep.say("full");
  }
  if (result == ERR_NOT_IN_RANGE) {
    // creep.moveTo(sources[BOTTOM_LEFT_SOURCE], {visualizePathStyle: {stroke: '#005566'}});
    creep.moveTo(sources[BOTTOM_RIGHT_SOURCE], {
      visualizePathStyle: { stroke: "#005566" }
    });
  } else if (result == OK) {
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
    // var availableExtension = extensions.find(function(ext) {
    //   return ext.energy < 50;
    // });
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
