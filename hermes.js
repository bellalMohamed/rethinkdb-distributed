const amqp = require('amqplib/callback_api');
const r = require('rethinkdb');

const queue = 'hermes';
let tempParams = null;

const handleMessage = (message) => {
    var rawData = message.content.toString();
    var objectData = JSON.parse(rawData);

    const params = typeof objectData.params !== 'undefined' ? objectData.params : null;
    tempParams = params;
    if (objectData['process'] === 'sum') {
        sum(params);
    }

    if (objectData['process'] === 'finished-sum') {
        finishedSum(objectData);
    }

    if (objectData['process'] === 'status') {
        reportStatus(objectData);
    }
}

let connectedServers = [];
let workingServersCount = 0;

const reportStatus = (status) => {
    updateServerStats(status.slaveId, status.satus, status.performance)
}

const updateServerStats = (slaveId, status, performance) => {
    let currentServer = getServerBySlaveId(slaveId)

    if (currentServer == false) {
        let m = {
            slaveId: slaveId,
            status: status,
            performance: performance,
            reported: Date.now(),
        };
        connectedServers.push(Object.assign({}, m));
    }

    for (server in connectedServers) {
        if (connectedServers[server].slaveId == slaveId) {
            connectedServers[server].status = status;
            connectedServers[server].performance = performance;
            connectedServers[server].reported = Date.now();
        }
    }

    // kickDownServers()
}

const kickDownServers = () => {
    for (var i = 0; i < connectedServers.length; i++) {
        if (Date.now() - connectedServers[i].reported > 2000) {
            connectedServers.splice(i, 1);
        }
    }
}

const getServerBySlaveId = (slaveId) => {
    for (server in connectedServers) {
        if (connectedServers[server].slaveId == slaveId) {
            return true;
        }
    }

    return false;
}

let sumResult = [];

const sum = (params) => {
    // startCheckingSignal();
    getTotalRecordsCount((count) => {
        const servers = connectedServers;
        workingServersCount = servers.length;
        const distributedLoad = loadDistributer(count, activeServersPerformance(servers));
        sumResult = normalizeSumResult(servers);

        distributedQueryOnSlaves(distributedLoad, servers, sumResult)
    })
}

const distributedQueryOnSlaves = (distributedLoad, servers, sumResult) => {
    for (var i = 0; i < servers.length; i++) {
        let serverLoad = distributedLoad[i];
        let slaveQueue = servers[i].slaveId;

        send(slaveQueue, {
            'process': 'query',
            'from':  serverLoad[0],
            'to':  serverLoad[1],
        });
    }
}

const normalizeSumResult = (servers) => {
    for (var i = 0; i < servers.length; i++) {
        sumResult[i] = {
            'result': 0,
            'slaveId': servers[i].slaveId,
            'finished': false,
        }
    }

    return sumResult;
}

const finishedSum = (result) => {
    for (var i = 0; i < sumResult.length; i++) {
        if (sumResult[i].slaveId == result.slaveId) {
            sumResult[i].result = result.result;
            sumResult[i].finished = true;
        }
    }

    checkSumResultCompletedAndPush();
}

const checkSumResultCompletedAndPush = () => {
    finalResult = 0;

    for (var i = 0; i < sumResult.length; i++) {
        if (sumResult[i].finished === false) {
            return false;
        }
        finalResult += sumResult[i].result;
    }

    send('api-queue', {
        'result': finalResult,
    })
}

// const startCheckingSignal = (isOn) => {
//     let checkInt = setInterval(() => {
//         if (workingServersCount.length !== connectedServers.length) {
//             sum(tempParams);
//         } else {
//             clearInterval(checkInt);
//         }
//     }, 1000);
// }

const getTotalRecordsCount = (callback) => {
    r.connect({host: 'localhost', port: 28015}, function(err, conn) {
        if (err) throw err;
        connection = conn;

        r.db('test').table('purchase').count().run(conn, (error, count) => {
            callback(count);
        });
    })
}

const activeServersPerformance = (servers) => {
    return servers.map(server => {
        return server.performance;
    });
}


const loadDistributer = (numberOfElements, cpuMemoryPerSlave) => {
   var mx = Math.max(...cpuMemoryPerSlave);
   var arrayLength = cpuMemoryPerSlave.length;
   var sum = 0;

    for (var i = 0; i < arrayLength; i++)
    {
        cpuMemoryPerSlave[i] /= mx;
        sum += cpuMemoryPerSlave[i];
    }

    sum = Math.ceil(sum);

    var patch  = Math.floor(numberOfElements / sum);

    var lastIndex = 1;
    indexArr = [];
    for (var i = 0; i < arrayLength - 1; i++)
    {
        var holder  = Math.round (patch * cpuMemoryPerSlave[i]);
        indexArr.push([lastIndex , lastIndex + holder]);
        lastIndex = lastIndex + holder + 1 ;
    }

    indexArr.push([lastIndex ,  numberOfElements]);
    return indexArr ;
}

const send = (queue, message) => {
    amqp.connect('amqp://192.168.43.246', function(error0, connection) {
        if (error0) {throw error0; }
        connection.createChannel(function(error1, channel) {
            if (error1) { throw error1; }

            channel.assertQueue(queue, {
                durable: false
            });
            message = JSON.stringify(message);

            channel.sendToQueue(queue, Buffer.from(message));
        });
    });
}

amqp.connect('amqp://192.168.43.246', function(error0, connection) {
    if (error0) { throw error0; }

    connection.createChannel(function(error1, channel) {
        if (error1) { throw error1; }

        channel.assertQueue(queue, {
            durable: false
        });

        console.log("[*] Hermes is waiting for your commands");

        channel.consume(queue, handleMessage, { noAck: true });
    });
});

