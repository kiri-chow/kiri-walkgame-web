const terrainNames = ["grass", "mud", "water", "road"]
const terrainPercentages = [0.7, 0.9, 0.98, 1]
const costRatios = [3, 6, 10, 1]
const terrainColors = ["#5FE849", "#AF6714", "#65C8E1", "#B2AEAA"]


function getTerrainIndex() {
    // get terrain index from a random value
    const randomNumber = Math.random()
    for (let [i, v] of terrainPercentages.entries()) {
        if (randomNumber < v) {
            return i
        }
    }
}


function generateMap(width, height) {
    // generate base map
    const mapData = []
    for (let i = 0; i < height; i++) {
        const row = []
        mapData.push(row)
        for (let j = 0; j < width; j++) {
            row.push(getTerrainIndex())
        }
    }

    // connect terrains
    const pathFinding = new PathFinding(
        mapData, [1, 1, 1, 1],
        [[10, [[-1, 0], [0, -1], [0, 1], [1, 0]]]])
    
    // connect water
    connectTerrain(mapData, 2, pathFinding, 3)

    // connect road
    connectTerrain(mapData, 3, pathFinding, 1)

    return mapData
}


function getIndicesOf(array, x) {
    // get indices of x from an array (2D or lower)
    let indices = []
    for (let [ind, val] of array.entries()) {
        if (typeof val === 'object') {
            indices = indices.concat(getIndicesOf(val, x).map((el) => [ind, el]))
        }
        else if (val === x) {
            indices.push(ind)
        }
    }
    return indices
}


function groupIndices(indices) {
    // group indices by connection
    let groups = []
    let groupToAdd = []
    let groupsToRemove = []
    for (let index of indices) {
        groupToAdd = [index]
        groupsToRemove = []
        for (let group of groups) {
            for (let index2 of group) {
                if (Math.abs(index[0] - index2[0]) + Math.abs(index[1] - index2[1]) <= 1) {
                    groupToAdd = groupToAdd.concat(group)
                    groupsToRemove.push(group)
                    break
                }
            }
        }
        groups = groups.filter((el) => !groupsToRemove.includes(el))
        
        groups.push(groupToAdd)
    }
    return groups
}


function getClosestIndex(x, indices) {
    let index
    let value = Infinity
    for (let y of indices) {
        let distance = estimateDistance(x, y)
        if (distance < value) {
            value = distance
            index = y
        }
    }
    return [index, value]
}


function estimateDistance(x, y) {
    return (x[0] - y[0]) ** 2 + (x[1] - y[1]) ** 2
}


function getClosestIndicesOfGroups(group1, group2) {
    let index1
    let index2
    let value = Infinity
    for (let ind1 of group1) {
        let [ind2, dist] = getClosestIndex(ind1, group2)
        if (dist < value) {
            index1 = ind1
            index2 = ind2
        }
    }
    return [index1, index2]
}


function connectGroups(mapData, terrainIndex, groups, pathFinding) {
    if (groups.length < 2) {
        return
    }
    const group1 = getMinimumGroups(groups)
    const group2 = getMinimumGroups(groups.filter((x) => x !== group1))
    const [index1, index2] = getClosestIndicesOfGroups(group1, group2)
    const path = pathFinding.find(index1, index2)
    let x
    let y
    for ([x, y] of path) {
        mapData[x][y] = terrainIndex
    }
}


function getMinimumGroups(groups) {
    let group
    let value = Infinity
    for (let g of groups) {
        if (g.length < value) {
            value = g.length
            group = g
        }
    }
    return group
}


function connectTerrain(mapData, terrainIndex, pathFinding, groupsCountLimit=1) {
    // connect the terrain in mapData
    let indices
    let groups = []
    let groupsCount = Infinity
    while (groupsCount > groupsCountLimit) {
        // connect groups
        connectGroups(mapData, terrainIndex, groups, pathFinding)

        // update
        indices = getIndicesOf(mapData, terrainIndex)
        groups = groupIndices(indices)
        groupsCount = groups.length
    }
}
