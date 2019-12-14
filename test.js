var os = require('os-utils');
const amqp = require('amqplib/callback_api');
const queue = 'hermes';
const slaveId = 'slave-3';

const send = (message) => {
    amqp.connect('amqp://localhost', function(error0, connection) {
        if (error0) {throw error0; }
        connection.createChannel(function(error1, channel) {
            if (error1) { throw error1; }

            channel.assertQueue(slaveId, {
                durable: false
            });
            message = JSON.stringify(message);

            channel.sendToQueue(slaveId, Buffer.from(message));

            // console.log(" [x] Reproting Status %s", message);
        });
    });
}

send({
    'data': 'are you here',
})