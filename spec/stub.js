
var should = require( 'chai' ).should();


suite.skip( 'testing mocha and chai', function() {

    var foo = 'a string';

    test( 'expects foo to be a string', function() {
        foo.should.be.a( 'string' );
    });

    test( 'expects that async code holds execution until it is done', function( done ) {
        foo.should.have.length( 8 );

        setTimeout( function() {
            done();
        }, 500 );
    });

    test( 'expects that this test will only run after the last one has called done', function() {
        foo.should.equal( 'a string' );
    });

    test.skip( 'expects that this test will fail the suite', function() {
        foo.should.be.a( 'null' );
    });

});
