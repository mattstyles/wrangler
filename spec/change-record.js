
var should = require( 'chai' ).should();

var CR = require( '../lib/model/change-record' ).ChangeRecord,
    CRCtrl = require( '../lib/model/change-record' ).ChangeRecordCtrl;


var cr, crCtrl;

function before() {
    // Prep for these tests
    cr = new CR({
        key: 'Chuck',
        oldValue: 'Yeager',
        newValue: 'Norris'
    });
    crCtrl = new CRCtrl();
}

function perform( title, fn ) {
    before();
    test( title, fn );
}

function xperform( title, fn ) {
    return;
}




suite( 'Change Record creation', function() {

    perform( 'A new instance of a change record should contain a set of keys', function() {

        var cr = new CR();


        should.not.equal( cr.key, undefined );
        should.not.equal( cr.newValue, undefined );
        should.not.equal( cr.oldValue, undefined );
        should.not.equal( cr.index, undefined );
    });

    perform( 'Passing an object to a Change Record constructor should populate the change record', function() {

        cr.key.should.equal( 'Chuck' );
        cr.oldValue.should.equal( 'Yeager' );
        cr.newValue.should.equal( 'Norris' );

        // Make sure that index still exists
        should.not.equal( cr.index, undefined );
    });

});


suite( 'Basic Change Record Controller Functionality', function() {

    perform( 'Pushing should add a change record to the stack', function() {

        crCtrl = new CRCtrl();
        crCtrl.push( cr );

        crCtrl._changes.length.should.equal( 1 );
        crCtrl._changes[ 0 ].key.should.equal( 'Chuck' );
    });


    perform( 'Popping should remove the latest change record from the stack', function() {

        crCtrl = new CRCtrl();

        crCtrl.push({key:'Chuck'});
        crCtrl.push({key:'Bruce'});

        crCtrl._changes.length.should.equal( 2 );

        var rec = crCtrl.pop();

        crCtrl._changes.length.should.equal( 1 );
        rec.key.should.equal( 'Bruce' );
    });


    perform( 'Change Record controller should know how many records it contains', function() {

        crCtrl = new CRCtrl();

        crCtrl.length.should.be.a( 'Function' );
        crCtrl.length().should.equal( 0 );

        crCtrl.push( cr );

        crCtrl.length().should.equal( 1 );
    });

    perform( 'Clearing should remove all items from the stack', function() {

        crCtrl = new CRCtrl();

        crCtrl.push({key:'Chuck'});
        crCtrl.push({key:'Bruce'});

        crCtrl._changes.length.should.equal( 2 );

        crCtrl.clear();

        crCtrl._changes.length.should.equal( 0 );
    });

});


suite( 'Advanced Change Record Controller Functionality', function() {

    perform( 'Pushing change records with the same key should update the stack and not add a duplicate key', function() {

        crCtrl = new CRCtrl();

        crCtrl.push({key:'Chuck', newValue:'Yeager'});
        crCtrl.push({key:'Bruce', newValue:'Lee'});

        crCtrl.length().should.equal( 2 );

        crCtrl.push({key:'Chuck', newValue:'Norris'});

        crCtrl.length().should.equal( 2 );

    });

    perform( 'Pushing change records with the same key should update the stack and not add a duplicate key', function() {

        crCtrl = new CRCtrl();

        crCtrl.push({key:'Chuck', newValue:'Yeager'});
        crCtrl.push({key:'Bruce', newValue:'Lee'});

        crCtrl.length().should.equal( 2 );

        crCtrl.push({key:'Chuck', newValue:'Norris'});

        crCtrl._changes[ 0 ].newValue.should.equal( 'Norris' );
        crCtrl._changes[ 1 ].newValue.should.equal( 'Lee' );
    });


});
