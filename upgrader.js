function workPerLoop({ creep }) {
    const statusCode = creep.upgradeController(creep.room.controller)
    switch(statusCode) {
        case (OK):
            break;
    }
}

    
    if(creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE && creep.carry.energy === creep.carryCapacity) {
        creep.moveTo(creep.room.controller, {visualizePathStyle: {stroke: '#00ffff'}});
    } else {
        var sources = creep.room.find(FIND_SOURCES);
        if(creep.harvest(sources[BOTTOM_LEFT_SOURCE]) == ERR_NOT_IN_RANGE) {
            creep.moveTo(sources[BOTTOM_LEFT_SOURCE], {visualizePathStyle: {stroke: '#00ffff'}});
        }
    }

module.exports = {
    run: workPerLoop
}