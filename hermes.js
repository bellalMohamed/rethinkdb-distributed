const amqp = require('amqplib/callback_api');

const queue = 'hermes';

const handleMessage = (message) => {
    var rawData = message.content.toString();
    var objectData = JSON.parse(rawData);

    // console.log("Hermes recieved", objectData);

    const params = typeof objectData.params !== 'undefined' ? objectData.params : null;

    if (objectData['process'] === 'sum') {
        sum(params);
    }

    if (objectData['process'] === 'status') {
        reportStatus(objectData);
    }
}

let connectedServers = [];

const reportStatus = (status) => {
    updateServerStats(status.slaveId, status.satus, status.performance)
    // console.log(connectedServers.length)
    console.log(connectedServers)
}

const updateServerStats = (slaveId, status, performance) => {

    let currentServer = getServerBySlaveId(slaveId)

    if (currentServer == false) {
        let m = {
            slaveId: slaveId,
            status: status,
            performance: performance,
        };
        connectedServers.push(Object.assign({}, m));
    }

    for (server in connectedServers) {
        if (connectedServers[server].slaveId == slaveId) {
            connectedServers[server].status = status;
            connectedServers[server].performance = performance;
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

const sum = (params) => {

}

amqp.connect('amqp://localhost', function(error0, connection) {
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

