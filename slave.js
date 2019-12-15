var os = require('os-utils');
const amqp = require('amqplib/callback_api');
const r = require('rethinkdb');
const queue = 'hermes';
const slaveId = 'slave-2';

const send = (message) => {
    amqp.connect('amqp://192.168.43.246', function(error0, connection) {
        if (error0) {throw error0; }
        connection.createChannel(function(error1, channel) {
            if (error1) { throw error1; }

            channel.assertQueue(queue, {
                durable: false
            });
            message = JSON.stringify(message);
            console.log("sending:", message);

            channel.sendToQueue(queue, Buffer.from(message));
        });
    });
}

const reportState = (performance) => {
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
        reportState(performance);
    });
}

const runQuery = (message) => {
    var rawData = message.content.toString();
    var objectData = JSON.parse(rawData);

    r.connect({host: '192.168.43.229', port: 28015}, function(err, conn) {
        if (err) throw err;
        connection = conn;

        r.db('test').table('purchase').slice(objectData['from'], objectData['to']).sum('receipt').run(conn, (err, receiptSum) => {
            send({
                'process': 'finished-sum',
                'slaveId': slaveId,
                'result': receiptSum,
            })
        });
    })
}

setInterval(() => {
    getPerformance();
}, 2000);

amqp.connect('amqp://192.168.43.246', function(error0, connection) {
    if (error0) { throw error0; }

    connection.createChannel(function(error1, channel) {
        if (error1) { throw error1; }

        channel.assertQueue(slaveId, {
            durable: false
        });

        console.log(`[*] ${slaveId} is waiting for your commands`);

        channel.consume(slaveId, runQuery, { noAck: true });
    });
});