var os = require('os-utils');
const amqp = require('amqplib/callback_api');
const queue = 'hermes';
const slaveId = 'slave-3';

const send = (message) => {
    amqp.connect('amqp://localhost', function(error0, connection) {
        if (error0) {throw error0; }
        connection.createChannel(function(error1, channel) {
            if (error1) { throw error1; }

            channel.assertQueue(queue, {
                durable: false
            });
            message = JSON.stringify(message);

            channel.sendToQueue(queue, Buffer.from(message));

            console.log(" [x] Reproting Status %s", message);
        });
    });
}

const justifyState = (performance) => {
    send({
        process: 'status',
        satus: 'UP',
        performance,
        slaveId,
    });
}


const getPerformance = () => {
    let freeCPUPercentage = 0;
    os.cpuFree(freeCPU => {
        performance = freeCPU * os.freemem();
        justifyState(performance);
    });
}

setInterval(() => {
    getPerformance();
}, 2000);

const runQuery = (params) => {
    console.log(params)
}

// amqp.connect('amqp://localhost', function(error0, connection) {
//     if (error0) { throw error0; }

//     connection.createChannel(function(error1, channel) {
//         if (error1) { throw error1; }

//         channel.assertQueue(slaveId, {
//             durable: false
//         });

//         console.log(`[*] ${slaveId} is waiting for your commands`);

//         channel.consume(slaveId, runQuery, { noAck: true });
//     });
// });