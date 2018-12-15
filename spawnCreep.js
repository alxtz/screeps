const ROLES = require('shared.roles')

// source id
const BOTTOM_LEFT_SOURCE = 1;
const BOTTOM_RIGHT_SOURCE = 0;

// live objects
let SPAWN;

const SPAWN_PRIORITY_LIST = [
  ROLES.ATTACKER,
  ROLES.COLLECTOR,
  ROLES.UPGRADER,
  ROLES.REPAIRER,
  ROLES.BIG_UPGRADER,
  ROLES.BUILDER,
  ROLES.BIG_COLLECTOR,
]

const TRY_TO_SPAWN_RESULT = {
  NOT_ENOUGH_ENERGY: 'NOT_ENOUGH_ENERGY',
  SUCCESS: 'SUCCESS'
}

let creepPopulation

module.exports = () => {
  SPAWN = Game.spawns["Alex"];

  creepPopulation = {
    [ROLES.COLLECTOR]: getPopulationOf({ role: ROLES.COLLECTOR }),
    [ROLES.UPGRADER]: getPopulationOf({ role: ROLES.UPGRADER }),
    [ROLES.BUILDER]: getPopulationOf({ role: ROLES.BUILDER }),
    [ROLES.BIG_UPGRADER]: getPopulationOf({ role: ROLES.BIG_UPGRADER }),
    [ROLES.BIG_COLLECTOR]: getPopulationOf({ role: ROLES.BIG_COLLECTOR }),
    [ROLES.ATTACKER]: getPopulationOf({ role: ROLES.ATTACKER }),
    [ROLES.REPAIRER]: getPopulationOf({ role: ROLES.REPAIRER }),
  }

  console.log(
    'C:' + creepPopulation[ROLES.COLLECTOR] +
    '(BC:' + creepPopulation[ROLES.BIG_COLLECTOR] + ')',
    'U:' + creepPopulation[ROLES.UPGRADER] +
    '(BU:' + creepPopulation[ROLES.BIG_UPGRADER] + ')',
    'B:' + creepPopulation[ROLES.BUILDER],
    'A:' + creepPopulation[ROLES.ATTACKER],
    'R:' + creepPopulation[ROLES.REPAIRER],
    'TOTAL_ENERGY:' + SPAWN.room.energyAvailable
  )

  // using a for looop instead of forEach(), since I want to use the break; statement
  for (let index = 0; index < SPAWN_PRIORITY_LIST.length; index++) {
    const role = SPAWN_PRIORITY_LIST[index]
    const notEnoughCreepsOfThisRole = creepPopulation[role] < getSpawnLimitOf({ role })

    if (notEnoughCreepsOfThisRole) {
      const result = tryToSpawn({ role })
      if (result === TRY_TO_SPAWN_RESULT.SUCCESS) {
        continue
      } else if (result === TRY_TO_SPAWN_RESULT.NOT_ENOUGH_ENERGY) {
        break
      }
    } else {
      continue
    }
  }
}

function getPopulationOf({ role }) {
  const creepNameList = Object.keys(Game.creeps);

  const listOfFilteredCreeps = creepNameList.filter(creepName => {
    return Game.creeps[creepName].memory.role === role
  })

  return listOfFilteredCreeps.length
}

function getSpawnLimitOf({ role }) {
  const ROLE_MAX_AMOUNT = {
    [ROLES.COLLECTOR]: 8,
    [ROLES.BIG_COLLECTOR]: 0,
    [ROLES.UPGRADER]: 9,
    [ROLES.BIG_UPGRADER]: 2,
    [ROLES.BUILDER]: 2,
    [ROLES.ATTACKER]: 2,
    [ROLES.REPAIRER]: 1
  }

  // keep the BU + U always 9
  if (role === ROLES.UPGRADER) {
    return ROLE_MAX_AMOUNT[ROLES.UPGRADER] - creepPopulation[ROLES.BIG_UPGRADER]
  } else {
    return ROLE_MAX_AMOUNT[role]
  }
}

function tryToSpawn({ role }) {
  switch (role) {

    case ROLES.ATTACKER: {
      const body = [ATTACK, MOVE]
      const bodyCost = body.reduce((accu, currBodyPart) => {
        return accu + BODYPART_COST[currBodyPart];
      }, 0);

      const currentEnergy = SPAWN.room.energyAvailable

      if (currentEnergy >= bodyCost) {
        SPAWN.spawnCreep(body, Date.now(), { memory: { role } })
        return TRY_TO_SPAWN_RESULT.SUCCESS
      } else {
        // can't spawn, skip the for loop and wait for more energy
        return TRY_TO_SPAWN_RESULT.NOT_ENOUGH_ENERGY
      }
    }

    case ROLES.COLLECTOR: {
      const body = [WORK, WORK, CARRY, MOVE]
      const bodyCost = body.reduce((accu, currBodyPart) => {
        return accu + BODYPART_COST[currBodyPart];
      }, 0);

      const currentEnergy = SPAWN.room.energyAvailable

      if (currentEnergy >= bodyCost) {
        SPAWN.spawnCreep(body, Date.now(), { memory: { role } })
        return TRY_TO_SPAWN_RESULT.SUCCESS
      } else {
        // can't spawn, skip the for loop and wait for more energy
        return TRY_TO_SPAWN_RESULT.NOT_ENOUGH_ENERGY
      }
    }

    case ROLES.UPGRADER: {
      const body = [WORK, WORK, CARRY, MOVE]
      const bodyCost = body.reduce((accu, currBodyPart) => {
        return accu + BODYPART_COST[currBodyPart];
      }, 0);

      const currentEnergy = SPAWN.room.energyAvailable

      if (currentEnergy >= bodyCost) {
        SPAWN.spawnCreep(body, Date.now(), { memory: { role } })
        return TRY_TO_SPAWN_RESULT.SUCCESS
      } else {
        // can't spawn, skip the for loop and wait for more energy
        return TRY_TO_SPAWN_RESULT.NOT_ENOUGH_ENERGY
      }
    }

    case ROLES.BIG_UPGRADER: {
      const body = [ WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE ]
      const bodyCost = body.reduce((accu, currBodyPart) => {
        return accu + BODYPART_COST[currBodyPart];
      }, 0);

      const currentEnergy = SPAWN.room.energyAvailable

      if (currentEnergy >= bodyCost) {
        SPAWN.spawnCreep(body, Date.now(), { memory: { role } })
        return TRY_TO_SPAWN_RESULT.SUCCESS
      } else {
        // can't spawn, skip the for loop and wait for more energy
        return TRY_TO_SPAWN_RESULT.NOT_ENOUGH_ENERGY
      }
    }

    case ROLES.BUILDER: {
      const body = [ WORK, WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE ]
      const bodyCost = body.reduce((accu, currBodyPart) => {
        return accu + BODYPART_COST[currBodyPart];
      }, 0);

      const currentEnergy = SPAWN.room.energyAvailable

      if (currentEnergy >= bodyCost) {
        const sources = SPAWN.room.find(FIND_SOURCES);
        let sourceIdToUse

        const populationUsingBottomLeftSource = Object.keys(Game.creeps)
          .filter(creepName => Game.creeps[creepName].memory.role === ROLES.BUILDER)
          .filter(creepName => Game.creeps[creepName].memory.sourceIdToUse === sources[BOTTOM_LEFT_SOURCE].id)
          .length

        const populationUsingBottomRightSource = Object.keys(Game.creeps)
          .filter(creepName => Game.creeps[creepName].memory.role === ROLES.BUILDER)
          .filter(creepName => Game.creeps[creepName].memory.sourceIdToUse === sources[BOTTOM_RIGHT_SOURCE].id)
          .length

        if (populationUsingBottomLeftSource > populationUsingBottomRightSource) {
          sourceIdToUse = sources[BOTTOM_RIGHT_SOURCE].id
        } else {
          sourceIdToUse = sources[BOTTOM_LEFT_SOURCE].id
        }

        SPAWN.spawnCreep(body, Date.now(), {
          memory: {
            role,
            sourceIdToUse
          }
        })
        return TRY_TO_SPAWN_RESULT.SUCCESS
      } else {
        // can't spawn, skip the for loop and wait for more energy
        return TRY_TO_SPAWN_RESULT.NOT_ENOUGH_ENERGY
      }
    }

    case ROLES.REPAIRER: {
      const body = [WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE]
      const bodyCost = body.reduce((accu, currBodyPart) => {
        return accu + BODYPART_COST[currBodyPart];
      }, 0);

      const currentEnergy = SPAWN.room.energyAvailable

      if (currentEnergy >= bodyCost) {
        SPAWN.spawnCreep(body, Date.now(), { memory: { role } })
        return TRY_TO_SPAWN_RESULT.SUCCESS
      } else {
        // can't spawn, skip the for loop and wait for more energy
        return TRY_TO_SPAWN_RESULT.NOT_ENOUGH_ENERGY
      }
    }
  }
}
