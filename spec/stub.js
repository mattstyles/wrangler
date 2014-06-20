
var should = require( 'chai' ).should();

function before() {
    // Prep for these tests
}

function perform( title, fn ) {
    before();
    test( title, fn );
}

function xperform( title, fn ) {
    return;
}


suite.skip( 'testing mocha and chai', function() {

    var foo = 'a string';

    perform( 'expects foo to be a string', function() {
        foo.should.be.a( 'string' );
    });

    perform( 'expects that async code holds execution until it is done', function( done ) {
        foo.should.have.length( 8 );

        setTimeout( function() {
            done();
        }, 500 );
    });

    perform( 'expects that this test will only run after the last one has called done', function() {
        foo.should.equal( 'a string' );
    });

});
