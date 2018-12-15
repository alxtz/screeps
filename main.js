// source id
var BOTTOM_LEFT_SOURCE = 0
var BOTTOM_RIGHT_SOURCE = 1

// roles
var COLLECTOR = 'COLLECTOR'
var UPGRADER = 'UPGRADER'
var BIG_UPGRADER = 'BIG_UPGRADER'
var BIG_COLLECTOR = 'BIG_COLLECTOR'
var BUILDER = 'BUILDER'
var ATTACKER = 'ATTACKER'

// config
var ENERGY_LIMIT = 300
var MAX_CREEPS = 18
// var MAX_CREEPS = 15

// liveObjects
var SPAWN
var TOTAL_ENERGY

module.exports.loop = function () {
    SPAWN = Game.spawns['Alex']
    TOTAL_ENERGY = SPAWN.room.energyAvailable
    var numberOfCreeps = Object.keys(Game.creeps).length

    console.log('TOTAL_ENERGY', TOTAL_ENERGY)

    var creepNameList = Object.keys(Game.creeps)
    var collectorPopulation = creepNameList.filter(function(creepName) {
        return Game.creeps[creepName].memory.role === COLLECTOR || Game.creeps[creepName].memory.role === BIG_COLLECTOR
    }).length
    var upgraderPopulation = creepNameList.filter(function(creepName) {
        return Game.creeps[creepName].memory.role === UPGRADER || Game.creeps[creepName].memory.role === BIG_UPGRADER
    }).length
    var builderPopulation = creepNameList.filter(function(creepName) {
        return Game.creeps[creepName].memory.role === BUILDER
    }).length

    var bigUpgraderPopulation = creepNameList.filter(function(creepName) {
        return Game.creeps[creepName].memory.role === BIG_UPGRADER
    }).length
    var bigCollectorPopulation = creepNameList.filter(function(creepName) {
        return Game.creeps[creepName].memory.role === BIG_COLLECTOR
    }).length

    var attackerPopulation = creepNameList.filter(function(creepName) {
        return Game.creeps[creepName].memory.role === ATTACKER
    }).length

    console.log(
        'C:' + collectorPopulation + '(BC:' + bigCollectorPopulation + ')',
        'U:' + upgraderPopulation + '(BU:' + bigUpgraderPopulation + ')',
        'B:' + builderPopulation
    )

    var hasMaxEnergy = SPAWN.energy >= 300
    var notEnoughCreeps = (numberOfCreeps - builderPopulation) < MAX_CREEPS

    if (SPAWN.energy > 130 && attackerPopulation < 3) {
        var body = [ATTACK, MOVE]
        var memory = { memory: { role: ATTACKER } }
        SPAWN.spawnCreep(body, Date.now(), memory)
    }

    if(hasMaxEnergy && notEnoughCreeps) {
        var maxCollectors = 9
        // var maxCollectors = 6
        var collectorNotEnough = collectorPopulation < maxCollectors

        if(collectorNotEnough) {
            var body = [WORK, WORK, CARRY, MOVE]
            var memory = { memory: { role: COLLECTOR } }
            SPAWN.spawnCreep(body, Date.now(), memory)
        } else {
            var maxUpgraders = 9
            if (upgraderPopulation <= maxUpgraders) {
                var body = [WORK, WORK, CARRY, MOVE]
                var memory = { memory: { role: UPGRADER } }
                SPAWN.spawnCreep(body, Date.now(), memory)
            }
        }
    }

    var hasEnoughCreeps = numberOfCreeps >= MAX_CREEPS
    var upgradeOneUpgrader = hasEnoughCreeps && hasMaxEnergy
    if (upgradeOneUpgrader) {
        var upgraderNameList = creepNameList.filter(function(creepName) {
            return Game.creeps[creepName].memory.role === UPGRADER
        })
        var collectorNameList = creepNameList.filter(function(creepName) {
            return Game.creeps[creepName].memory.role === COLLECTOR
        })
        // if (collectorNameList.length > 0) {
        //     var body = [WORK, WORK, WORK, CARRY, MOVE, MOVE, MOVE]
        //     var memory = { memory: { role: BIG_COLLECTOR } }
        //     var result = SPAWN.spawnCreep(body, Date.now(), memory)

        //     if (result === OK) {
        //         var nonBigCollectorNameList = creepNameList.filter(function(creepName) {
        //             return Game.creeps[creepName].memory.role === COLLECTOR
        //         })
        //         Game.creeps[nonBigCollectorNameList[0]].suicide()
        //     }
        // } else if (upgraderNameList.length > 0) {
        var maxBigUpgrader = 4
        if (upgraderNameList.length - maxBigUpgrader > 0) {
            var body = [
                WORK,
                WORK,
                WORK,
                CARRY,
                CARRY,
                CARRY,
                CARRY,
                CARRY,
                CARRY,
                MOVE
            ]
            var memory = { memory: { role: BIG_UPGRADER } }
            var result = SPAWN.spawnCreep(body, Date.now(), memory)

            if (result === OK) {
                var nonBigUpgraderNameList = creepNameList.filter(function(creepName) {
                    return Game.creeps[creepName].memory.role === UPGRADER
                })
                Game.creeps[nonBigUpgraderNameList[0]].suicide()
            }
        } else {
            var MAX_BUILDERS = 1
            if (builderPopulation < MAX_BUILDERS) {
               var body = [
                   WORK,
                   WORK,
                   WORK,
                   WORK,
                   WORK,
                   CARRY,
                   CARRY,
                   CARRY,
                   CARRY,
                   CARRY,
                   MOVE
                ]
                var memory = { memory: { role: BUILDER } }
                var result = SPAWN.spawnCreep(body, Date.now(), memory)
            }
        }
    }

    runAllWorkers()
}

function runAllWorkers() {
    for(var name in Game.creeps) {
        var creep = Game.creeps[name];
        var role = creep.memory.role

        switch(role) {
            case COLLECTOR: {
                if (creep.carry.energy < creep.carryCapacity) moveOrHarvestSource(creep)
                else transferEnergy(creep)
                break;
            }
            case BIG_COLLECTOR: {
                if (creep.carry.energy < creep.carryCapacity) moveOrHarvestSource(creep)
                else transferEnergy(creep)
                break;
            }
            case UPGRADER: {
                doUpgraderWork(creep)
                break;
            }
            case BIG_UPGRADER: {
                doUpgraderWork(creep)
                break;
            }
            case BUILDER: {
                creep.say('builder')
                var buildTargets = creep.room.find(FIND_CONSTRUCTION_SITES);
                var errorCode = creep.build(buildTargets[0])
                if (errorCode === OK) {
                } else {
    			    if(errorCode == ERR_NOT_IN_RANGE && creep.carry.energy === creep.carryCapacity) {
                        creep.moveTo(buildTargets[0], {visualizePathStyle: {stroke: '#FF00FF' }});
                    } else if (creep.carry.energy < creep.carryCapacity) {
                        harvestBuildEnergy(creep)
                    }
                }
                break;
            }
            case ATTACKER: {
                var enemy = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS)
                var result = creep.attack(enemy)
                if (result === ERR_NOT_IN_RANGE) {
                    creep.moveTo(enemy, {visualizePathStyle: {stroke: '#ffffff'}})
                }
            }
        }
    }
}

function doUpgraderWork(creep) {
    if (creep.upgradeController(creep.room.controller) == OK) {
        return
    }

    if(creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE && creep.carry.energy === creep.carryCapacity) {
        creep.moveTo(creep.room.controller, {visualizePathStyle: {stroke: '#00ffff'}});
    } else {
        var sources = creep.room.find(FIND_SOURCES);
        if(creep.harvest(sources[BOTTOM_LEFT_SOURCE]) == ERR_NOT_IN_RANGE) {
            creep.moveTo(sources[BOTTOM_LEFT_SOURCE], {visualizePathStyle: {stroke: '#00ffff'}});
        }
    }
}

function moveOrHarvestSource(creep) {
    var sources = creep.room.find(FIND_SOURCES);
    if(creep.harvest(sources[BOTTOM_RIGHT_SOURCE]) == ERR_NOT_IN_RANGE) {
        creep.moveTo(sources[BOTTOM_RIGHT_SOURCE], {visualizePathStyle: {stroke: '#ffffff'}});
    }
}

function harvestBuildEnergy(creep) {
    var sources = creep.room.find(FIND_SOURCES);
    // const result = creep.harvest(sources[BOTTOM_LEFT_SOURCE])
    const result = creep.harvest(sources[BOTTOM_RIGHT_SOURCE])
    if (creep.carry.energy === creep.carryCapacity) {
        creep.say('full')
    }
    if( result == ERR_NOT_IN_RANGE) {
    //     creep.moveTo(sources[BOTTOM_LEFT_SOURCE], {visualizePathStyle: {
    //         stroke: '#FF00FF',
    //         opacity: 1
    //     }});
        creep.moveTo(sources[BOTTOM_RIGHT_SOURCE], {visualizePathStyle: {stroke: '#005566'}});
    } else if (result == OK) {
    }
}

function transferEnergy(creep) {
    if( creep.transfer(SPAWN, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE && SPAWN.energy < ENERGY_LIMIT) {
        creep.moveTo(SPAWN, {visualizePathStyle: {stroke: '#ffffff'}});

    } else {
        var extensions = SPAWN.room.find(FIND_MY_STRUCTURES, {
          filter: { structureType: STRUCTURE_EXTENSION }
        });
        var availableExtension = extensions.find(function(ext) {
            return ext.energy < 50
        })
        if( creep.transfer(availableExtension, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
            creep.moveTo(availableExtension, {visualizePathStyle: {stroke: '#ffffff'}});
        } else {
             var containers = SPAWN.room.find(FIND_MY_STRUCTURES, {
                filter: { structureType: STRUCTURE_STORAGE }
            });
            if(creep.transfer(containers[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                creep.moveTo(containers[0], {visualizePathStyle: {stroke: '#ffffff'}});
            }
        }
    }
}
