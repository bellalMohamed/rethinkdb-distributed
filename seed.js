const r = require('rethinkdb');
var faker = require('faker');

var connection = null;

r.connect( {host: '192.168.43.229', port: 28015}, function(err, conn) {
    if (err) throw err;
    connection = conn;

    // for (var i = 0; i < 500; i++) {
    //     r.table("purchase").insert({
    //         name: faker.name.findName(),
    //         receipt: faker.random.number(),
    //         date: faker.date.future()
    //     }).run(connection, () => {})
    // }

    r.table('purchase').run(conn, function(error, cursor) {
        // console.log(error)
        // cursor.each(console.log);
    })

    console.log('Done')
})


