// source id
var BOTTOM_LEFT_SOURCE = 0
var BOTTOM_RIGHT_SOURCE = 1

// roles
var COLLECTOR = 'COLLECTOR'
var UPGRADER = 'UPGRADER'
var BIG_UPGRADER = 'BIG_UPGRADER'
var BUILDER = 'BUILDER'

// config
var ENERGY_LIMIT = 300
var ROAD_ENERGY_COST = 300
var MAX_CREEPS = 18
var MODES = {
    NORMAL: 'NORMAL',
    BUILD: 'BUILD'
}

// liveObjects
var SPAWN
var CURRENT_MODE = MODES.NORMAL

module.exports.loop = function () {
    SPAWN = Game.spawns['Alex']
    var numberOfCreeps = Object.keys(Game.creeps).length

    var creepNameList = Object.keys(Game.creeps)
    var collectorPopulation = creepNameList.filter(function(creepName) {
        return Game.creeps[creepName].memory.role === COLLECTOR
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
    console.log('MODE:', CURRENT_MODE)
    console.log('C:' + collectorPopulation, 'U:' + upgraderPopulation + '(BU:' + bigUpgraderPopulation + ')', 'B:', builderPopulation)

    var hasMaxEnergy = SPAWN.energy >= 300
    var notEnoughCreeps = (numberOfCreeps - builderPopulation) < MAX_CREEPS
    if(hasMaxEnergy && notEnoughCreeps) {
        var maxCollectors
        if (CURRENT_MODE === MODES.NORMAL) {
            maxCollectors = 9
        } else if (CURRENT_MODE === MODES.BUILD) {
            maxCollectors = 6
        }
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
        if (upgraderNameList.length > 0) {
            var body = [WORK, WORK, CARRY, CARRY, CARRY, MOVE, MOVE]
            var memory = { memory: { role: BIG_UPGRADER } }
            var result = SPAWN.spawnCreep(body, Date.now(), memory)

            if (result === OK) {
                var nonBigUpgraderNameList = creepNameList.filter(function(creepName) {
                    return Game.creeps[creepName].memory.role === UPGRADER
                })
                Game.creeps[nonBigUpgraderNameList[0]].suicide()
            }
        } else {
            var MAX_BUILDERS = 2
            if (builderPopulation < MAX_BUILDERS) {
               var body = [WORK, WORK, CARRY, CARRY, CARRY, MOVE, MOVE]
                var memory = { memory: { role: BUILDER } }
                var result = SPAWN.spawnCreep(body, Date.now(), memory)
                console.log('spawn builder')
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
            case UPGRADER: {
                doUpgraderWork(creep)
                break;
            }
            case BIG_UPGRADER: {
                creep.say('BIG')
                doUpgraderWork(creep)
                break;
            }
            case BUILDER: {
                if(creep.carry.energy < creep.carryCapacity) {
                    creep.say('NOT ENOUGH')
                    harvestBuildEnergy(creep)
                } else {
                    creep.say('GO BUILD')
                    var buildTargets = creep.room.find(FIND_CONSTRUCTION_SITES);
                    var errorCode = creep.build(buildTargets[0])
    			    if(errorCode == ERR_NOT_IN_RANGE) {
                        creep.moveTo(buildTargets[0], {visualizePathStyle: {stroke: '#005566' }});
                    }
                }
                break;
            }
        }
        // } else if (creep.memory.role === BUILDER_UPGRADER) {
        //     var buildTargets = creep.room.find(FIND_CONSTRUCTION_SITES);
        //     if(buildTargets.length > 0) {
        //         const errorCode = creep.build(buildTargets[0])
                
    	// 		if(errorCode == ERR_NOT_IN_RANGE) {
        //             if(creep.carry.energy == creep.carryCapacity) {
    	// 			    creep.moveTo(buildTargets[0], {visualizePathStyle: {stroke: '#ff00ff' }});
        //             } else {
        //                 moveOrHarvestSource(creep)
        //             }
    	// 		} else if (errorCode == ERR_NOT_ENOUGH_RESOURCES) {
    	// 		    moveOrHarvestSource(creep)
    	// 		}
    	// 	} else {
    	// 	    doUpgraderWork(creep)
    	// 	}
        // }
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
    // if (creep.memory.role === BUILDER_UPGRADER){
    //     if(creep.harvest(sources[BOTTOM_LEFT_SOURCE]) == ERR_NOT_IN_RANGE) {
    //         creep.moveTo(sources[BOTTOM_LEFT_SOURCE], {visualizePathStyle: {stroke: '#ffffff'}});
    //     }
    // } else {
        if(creep.harvest(sources[BOTTOM_RIGHT_SOURCE]) == ERR_NOT_IN_RANGE) {
            creep.moveTo(sources[BOTTOM_RIGHT_SOURCE], {visualizePathStyle: {stroke: '#ffffff'}});
        }
    // } 
}

function harvestBuildEnergy(creep) {
    var sources = creep.room.find(FIND_SOURCES);
    if(creep.harvest(sources[BOTTOM_LEFT_SOURCE]) == ERR_NOT_IN_RANGE) {
        creep.moveTo(sources[BOTTOM_LEFT_SOURCE], {visualizePathStyle: {stroke: '#005566'}});
  005566}
}

function transferEnergy(creep) {
    if( creep.transfer(SPAWN, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE && SPAWN.energy < ENERGY_LIMIT) {
        creep.moveTo(SPAWN, {visualizePathStyle: {stroke: '#ffffff'}});

    } else {
        var extension = creep.pos.findClosestByRange(FIND_STRUCTURES, { filter: function (s) {
            return s.structureType == STRUCTURE_EXTENSION
        }});

        var extensions = SPAWN.room.find(FIND_MY_STRUCTURES, {
           filter: { structureType: STRUCTURE_EXTENSION }
        });
        var availableExtension = extensions.find(function(ext) {
            return ext.energy < 50
        })
        console.log('available ext', availableExtension)
        if( creep.transfer(availableExtension, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
            creep.moveTo(availableExtension, {visualizePathStyle: {stroke: '#ffffff'}});
        } else {
            creep.say('ext full')
        }
    }
}