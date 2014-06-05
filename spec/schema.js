
var should = require( 'chai' ).should(),

    Schema = require( '../lib/schema' );


var schema;

function before() {
    schema = null;
}

function perform( title, fn ) {
    before();
    test( title, fn );
}


suite( 'creating the schema', function() {

    perform( 'requiring schema should expose an object constructor', function() {

        Schema.should.be.a( 'function' );

        schema = new Schema({});

        schema.should.be.a( 'object' );
    });


    perform( 'a schema should be defined by an object passed to it', function() {

        schema = new Schema({
            foo: 'foo'
        });

        schema.foo.should.equal( 'foo' );
    });
});


suite( 'working with an existing schema', function() {

    singleSchema = {
        foo: 'foo'
    };

    deepSchema = {
        foo: 'foo',
        bar: 'bar',
        baz: {
            quux: 'quux',
            xyzzy: 'xyzzy'
        }
    };

    /**
     * Adding props
     */

    perform( 'calling add without a property should throw an error', function() {
        schema = new Schema( singleSchema );

        (function() {
            schema.add();
        }).should.throw( Error );
    });

    perform( 'a property can be added to the schema', function() {
        schema = new Schema( singleSchema );

        schema.add({
            waldo: 'waldo'
        });

        schema.foo.should.equal( 'foo' );
        schema.waldo.should.equal( 'waldo' );
    });

    perform( 'a property can be added by specifying the prop as an object', function() {
        schema = new Schema( singleSchema );

        schema.add({
            waldo: {
                value: 'waldo'
            }
        });

        schema.foo.should.equal( 'foo' );
        schema.waldo.should.equal( 'waldo' );
    });

    perform( 'an existing property can not be overwritten', function() {
        schema = new Schema( singleSchema );

        (function() {
            schema.add({
                foo: 'bar'
            });
        }).should.throw( Error );
    });

    perform( 'an existing property can be forced to be overwritten', function() {
        schema = new Schema( singleSchema );

        schema.add({
            foo: {
                force: true,
                value: 'bar'
            }
        });

        schema.foo.should.equal( 'bar' );
    });

    perform( 'adding a property that clashes with a prop on the prototype should throw an error', function() {
        schema = new Schema( singleSchema );

        (function() {
            schema.add({
                add: 'foobarbaz'
            });
        }).should.throw( Error );
    });

    /**
     * Removing props
     */

    perform( 'a property can be removed from a schema', function() {
        schema = new Schema( singleSchema );

        schema.foo.should.equal( 'foo' );

        schema.remove( 'foo' );

        schema.should.not.have.ownProperty( 'foo' );
    });

    perform( 'multiple properties can be removed from a schema', function() {
        schema = new Schema( deepSchema );

        schema.should.have.ownProperty( 'foo' );
        schema.should.have.ownProperty( 'bar' );

        schema.remove([
            'foo',
            'bar'
        ]);

        schema.should.not.have.ownProperty( 'foo' );
        schema.should.not.have.ownProperty( 'bar' );
    });

});
