var BOTTOM_LEFT_SOURCE = 0
var BOTTOM_RIGHT_SOURCE = 1

var COLLECTOR = 'COLLECTOR'
var UPGRADER = 'UPGRADER'
var BUILDER_UPGRADER = 'BUILDER_UPGRADER'

var ENERGY_LIMIT = 300
var ROAD_ENERGY_COST = 300
var MAX_CREEPS = 16

module.exports.loop = function () {
    var SPAWN = Game.spawns['Alex']
    var numberOfCreeps = Object.keys(Game.creeps).length
    
    if(SPAWN.energy == ENERGY_LIMIT && numberOfCreeps <= MAX_CREEPS) {
        var random = Date.now() % 6
        if(random <= 2) {
            SPAWN.spawnCreep([WORK, WORK, CARRY, MOVE], Date.now(), {
                memory: { role: COLLECTOR }
            })  
        } else if (random <= 6){
             SPAWN.spawnCreep([WORK, WORK, CARRY, MOVE], Date.now(), {
                memory: { role: UPGRADER }
            })   
        }
    }
    
    for(var name in Game.creeps) {
        var creep = Game.creeps[name];
        if (creep.memory.role === COLLECTOR) {
            if(creep.carry.energy < creep.carryCapacity) {
                moveOrHarvestSource(creep, SPAWN)
            } else {
                transferEnergy(creep, SPAWN)
            }
        } else if (creep.memory.role === UPGRADER) {
            doUpgraderWork(creep)
        } else if (creep.memory.role === BUILDER_UPGRADER) {
            // console.log('im builder upgrader')
            var buildTargets = creep.room.find(FIND_CONSTRUCTION_SITES);
            if(buildTargets.length > 0) {
                const errorCode = creep.build(buildTargets[0])
                
    			if(errorCode == ERR_NOT_IN_RANGE) {
                    if(creep.carry.energy == creep.carryCapacity) {
    				    creep.moveTo(buildTargets[0], {visualizePathStyle: {stroke: '#ff00ff' }});
                    } else {
                        moveOrHarvestSource(creep)
                    }
    			} else if (errorCode == ERR_NOT_ENOUGH_RESOURCES) {
    			    moveOrHarvestSource(creep)
    			}
    		} else {
    		    doUpgraderWork(creep)
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
    if (creep.memory.role === BUILDER_UPGRADER){
        // console.log('upgrader move to source')
        if(creep.harvest(sources[BOTTOM_LEFT_SOURCE]) == ERR_NOT_IN_RANGE) {
            creep.moveTo(sources[BOTTOM_LEFT_SOURCE], {visualizePathStyle: {stroke: '#ffffff'}});
        }
    } else {
        if(creep.harvest(sources[BOTTOM_RIGHT_SOURCE]) == ERR_NOT_IN_RANGE) {
            creep.moveTo(sources[BOTTOM_RIGHT_SOURCE], {visualizePathStyle: {stroke: '#ffffff'}});
        }
    } 
}

function transferEnergy(creep, SPAWN) {
    console.log('transfer error', creep.transfer(SPAWN, RESOURCE_ENERGY))
    if( creep.transfer(SPAWN, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE && SPAWN.energy < ENERGY_LIMIT) {
        creep.moveTo(SPAWN, {visualizePathStyle: {stroke: '#ffffff'}});

    } else {
        console.log('transfer to spawn full')
        var extension = creep.pos.findClosestByRange(FIND_STRUCTURES, { filter: function (s) {
            return s.structureType == STRUCTURE_EXTENSION
        }});
        console.log('spawn full, try', extension)
        if( creep.transfer(extension, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
            creep.moveTo(extension, {visualizePathStyle: {stroke: '#ffffff'}});
        }
    }
}