var os = require( 'os' );
var path = require( 'path' );

var test = require( 'tape' );

var dbpath = path.join( os.tmpdir(), 'level-wrangler-' + Math.random() );

var level = require( 'level' )( dbpath );
var wrangler = require( '../dist' )( level );


test( 'Models should be assigned a unique id upon creation', function( t ) {
    t.plan( 1 );

    var users = wrangler.createFactory( 'user', {} );
    var model = users.create({
        name: 'Dave'
    });

    t.ok( model.id.length > 8, 'Id assigned to model' );
});


test( 'Models should not pass by reference their props on instantiation', function( t ) {
    t.plan( 5 );

    var drivers = wrangler.createFactory( 'driver', {} );

    var driver = {
        name: 'Mansell'
    };
    var model = drivers.create( driver );

    t.equal( model.name, 'Mansell', 'model name assigned from prop' );

    driver.name = 'Ayrton';

    t.notEqual( model.name, 'Ayrton', 'prop object should be independent of model instance' );
    t.equal( model.name, 'Mansell', 'model should be unmodified after prop manipulation' );

    t.equal( typeof model.save, 'function', 'prop clone to model should not nuke model prototype props' );

    var driver2 = {
        name: 'Niki',
        save: 'foo'
    };
    t.throws( function() {
        drivers.create( driver2 );
    }, null, 'Model props name conflict with model prototype should throw' );

});
