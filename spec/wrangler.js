
var chai = require( 'chai' ),
    promised = require( 'chai-as-promised' ),
    rimraf = require( 'rimraf' ),

    Wrangler = require( '../' ),
    Model = require( '../lib/model' ),
    Schema = require( '../lib/schema' );

// Setup chai
chai.should();
chai.use( promised );

// Destroy the test db when we're done
process.on( 'exit', function( status ) {
    rimraf.sync( dbName );
});

var wrangler, model, schema,
    dbName = './testdb'

function before() {
    wrangler = null;
    model = null;
    schema = null;
    rimraf.sync( dbName );
}

function perform( title, fn ) {
    before();
    test( title, fn );
}

function xperform( title, fn ) {
    return;
}


suite( 'creating the wrangler instance - ', function() {

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


suite( 'adding models to wrangler - ', function() {

    perform( 'models should be added and created if passed on creation', function( done ) {

        Wrangler({
            db: dbName,
            models: [
                new Wrangler.Model({
                    id: 'Users',
                    schema: new Wrangler.Schema( {} )
                }), new Wrangler.Model({
                    id: 'Sites',
                    schema: new Wrangler.Schema( {} )
                })
            ]
        })
            .then( function( wrangler ) {
                wrangler.models.should.not.be.empty;
                wrangler.models[ 0 ].should.not.be.false;
                wrangler.db.close( done );
            });
    });
});


suite( 'expose models and schema via wrangler - ', function() {

    perform( 'model and schema constructor should be available from the wrangler object', function() {

        Wrangler.Model.should.be.a( 'Function' );
        Wrangler.Schema.should.be.a( 'Function' );
    });

    perform( 'schema constructor should create a schema', function() {

        schema = new Wrangler.Schema({
            foo: {
                default: 'foo'
            }
        });

        schema.should.be.an.instanceof( Schema );
    });

    perform( 'model constructor should create a model', function() {

        model = new Wrangler.Model({
            id: 'Users',
            schema: new Wrangler.Schema({
                foo: true
            })
        });

        model.should.be.an.instanceof( Model );
    })
});
