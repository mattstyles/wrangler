
var chai = require( 'chai' ),
    promised = require( 'chai-as-promised' ),
    rimraf = require( 'rimraf' ),

    Wrangler = require( '../lib/wrangler' );

// Setup chai
chai.should();
chai.use( promised );

// Destroy the test db when we're done
process.on( 'exit', function( status ) {
    rimraf.sync( dbName );
});

var wrangler,
    dbName = './testdb'

function before() {
    wrangler = null;
    rimraf.sync( dbName );
}

function perform( title, fn ) {
    before();
    test( title, fn );
}


suite( 'creating the wrangler instance', function() {

    perform( 'requiring wrangler should expose an object constructor', function() {
        Wrangler.should.be.a( 'function' );
    });

    perform( 'creating an instance of wrangler should resolve with the instance', function( done ) {
        Wrangler({
            db: dbName
        })
            .then( function( wrangler ) {
                wrangler.should.be.a( 'object' );
                wrangler.db.close( done );
            });
    });

});


suite( 'adding models to wrangler', function() {

    perform( 'models should be added and created if passed on creation', function( done ) {

        Wrangler({
            db: dbName,
            models: [{
                id: 'test',
                model: {}
            }, {
                id: 'test2',
                model: {}
            }]
        })
            .then( function( wrangler ) {
                wrangler.models.should.not.be.empty;
                wrangler.models[ 0 ].model.should.not.be.false;
                wrangler.db.close( done );
            });
    });


});
