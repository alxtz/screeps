// source id
var BOTTOM_LEFT_SOURCE = 0
var BOTTOM_RIGHT_SOURCE = 1

// roles
var COLLECTOR = 'COLLECTOR'
var UPGRADER = 'UPGRADER'
var BUILDER_UPGRADER = 'BUILDER_UPGRADER'

// config
var ENERGY_LIMIT = 300
var ROAD_ENERGY_COST = 300
var MAX_CREEPS = 18

// liveObjects
var SPAWN

module.exports.loop = function () {
    SPAWN = Game.spawns['Alex']
    var numberOfCreeps = Object.keys(Game.creeps).length

    var creepNameList = Object.keys(Game.creeps)
    var collectorPopulation = creepNameList.filter(function(creepName) {
        return Game.creeps[creepName].memory.role === COLLECTOR
    }).length
    var upgraderPopulation = creepNameList.filter(function(creepName) {
        return Game.creeps[creepName].memory.role === UPGRADER
    }).length
    console.log('C:', collectorPopulation, 'U:', upgraderPopulation)

    var hasMaxEnergy = SPAWN.energy >= 300
    var notEnoughCreeps = numberOfCreeps < MAX_CREEPS
    if(hasMaxEnergy && notEnoughCreeps) {
        var collectorNotEnough = collectorPopulation < MAX_CREEPS / 2
        if(collectorNotEnough) {
            var body = [WORK, WORK, CARRY, MOVE]
            var memory = { memory: { role: COLLECTOR } }
            SPAWN.spawnCreep(body, Date.now(), memory)  
        } else {
            var body = [WORK, WORK, CARRY, MOVE]
            var memory = { memory: { role: UPGRADER } }
            SPAWN.spawnCreep(body, Date.now(), memory)
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
    if( creep.transfer(SPAWN, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE && SPAWN.energy < ENERGY_LIMIT) {
        creep.moveTo(SPAWN, {visualizePathStyle: {stroke: '#ffffff'}});

    } else {
        var extension = creep.pos.findClosestByRange(FIND_STRUCTURES, { filter: function (s) {
            return s.structureType == STRUCTURE_EXTENSION
        }});
        if( creep.transfer(extension, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
            creep.moveTo(extension, {visualizePathStyle: {stroke: '#ffffff'}});
        }
    }
}