const indexDelta = [
    [14, [[-1, -1], [-1, 1], [1, -1], [1, 1]]],
    [10, [[-1, 0], [0, -1], [0, 1], [1, 0]]],
]


function generateConnection(mapData, costRatios, indexDelta) {
    const connection = {}
    for (let [indRow, row] of mapData.entries()) {
        for (let [indCol, indTerrain] of row.entries()){
            const ratio = costRatios[indTerrain]
            const shape = [mapData.length, row.length]
            let conn = baseGetIndicesCost(indRow, indCol, ratio, shape, indexDelta)
            connection[[indRow, indCol]] = conn
        }
    }
    return connection
}


function baseGetIndicesCost(indRow, indCol, ratio, shape, indexDelta){
    const indicesToCost = {}
    
    // can not connect
    if (ratio <= 0) {
        return indicesToCost
    }

    for (let [cost, indices] of indexDelta) {
        cost = cost * ratio
        
        // can not connect
        if (cost <= 0) {
            continue
        }

        for (let [x, y] of indices.map((x) => [x[0] + indRow, x[1] + indCol])) {
            // index out of range
            if (!(x >= 0 && y >= 0 && x < shape[0] && y < shape[1])) {
                continue
            }
            indicesToCost[[x, y]] = cost
        }
    }
    return indicesToCost
}


function convertStringToNumber(x) {
    if (typeof x === 'string') {
        return x.split(',').map((el) => Number(el))
    }
    return x
}


class PathFinding {
    constructor(mapData, costRatios, indexDelta, balance=null) {
        if (balance === null) {
            balance = [1, 1]
        }
        [this.movementRatio, this.estimatedRatio] = balance
        this.mapData = mapData
        this.connection = generateConnection(this.mapData, costRatios, indexDelta)
        this.initResult()
    }

    initResult() {
        this.closed = []
        this.opened = []
        this.dataPoints = {}
    }

    find(start, target) {
        this.initResult()
        start = start.toString()
        target = target.toString()
        this.opened.push(start)
        this.dataPoints[start] = [0, 0, null]

        let end = false
        while (!end){
            end = this.findNext(target)
        }

        let path = this.getPath(target)
        return path
    }

    findNext(target) {
        /*
        find next halfway point, return true when reach the target
        */
        if (this.opened.length === 0) {
            return true
        }

        // init data
        let end = false
        let currentPoint = this.getCurrentPoint()
        this.opened = this.opened.filter((el) => el != currentPoint)
        if (!this.closed.includes(currentPoint)){
            this.closed.push(currentPoint)
        }
        let currentMCost = this.dataPoints[currentPoint][1]
        let points = this.connection[currentPoint]

        // target reached
        let inPoints = points[target]
        if (inPoints !== undefined) {
            points = {}
            points[target] = 0
            end = true
        }

        // record data
        for (let point of Object.keys(points)) {
            if (this.closed.includes(point)) {
                continue
            }
            let [cCost, mCost] = this.getCosts(currentPoint, point, target)
            if (mCost === null) {
                continue
            }
            cCost += currentMCost
            mCost += currentMCost

            if (!this.opened.includes(point) || mCost < this.dataPoints[point][1]){
                this.dataPoints[point] = [cCost, mCost, currentPoint]
                if (this.opened.includes(point)) {
                    this.opened = this.opened.filter((el) => el != point)
                }
                this.opened.push(point)
            }
        }
        return end
    }

    getCurrentPoint() {
        let currentPoint
        let currentValue = [Infinity, Infinity]
        for (let p of this.opened.reverse()) {
            let v = this.dataPoints[p].slice(0, 2)
            if (v < currentValue) {
                currentValue = v
                currentPoint = p
            }
        }
        return currentPoint
    }

    getCosts(start, stop, target){
        let mCost = this.getMovementCost(start, stop)
        if (mCost === null) {
            return [null, null]
        }
        let eCost = this.getEstimatedCost(stop, target)
        let cCost = (this.movementRatio * mCost + this.estimatedRatio * eCost)
        return [cCost, mCost]
    }

    getMovementCost(start, target) {
        return this.connection[start][target]
    }

    getEstimatedCost(start, target) {
        start = convertStringToNumber(start)
        target = convertStringToNumber(target)
        return Math.abs(start[0] - target[0]) * 20 + Math.abs(start[1] - target[1]) * 20
    }

    getPath(target) {
        let inData = this.dataPoints[target]
        if (inData == undefined) {
            return []
        }

        let path = [target]
        parent = this.dataPoints[target][2]
        while (parent !== null){
            path.push(parent)
            parent = this.dataPoints[parent][2]
        }
        path = path.map((el) => convertStringToNumber(el))
        return path.reverse()
    }
}