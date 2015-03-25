# level-wrangler

> Defines and stores json models by indices within a leveldb

```
npm i -S level-wrangler
```

## Example

```js
var level = require( 'level-party' )( '/tmp/.db' );
var sub = require( 'level-sublevel' )( level );
var db = require( 'level-wrangler' )( sub.sublevel( 'users', {
    encoding: 'json'
}));

var users = db.createFactory( 'users', {} );
```

### Finding stuff

```js
users.findAll()
    .then( res => {
        streamify( res.map( user => {
            return user.name
        }) ).pipe( process.stdout );
    })
    .catch( ... );
```

### ~~Hiding~~ Storing stuff

```js
var user = users.create({
    username: 'Jack',
    password: 'wr4angl1ng'
});

user.save();
```

### Getting rid of stuff
```js
user.remove()
    .then( ... )
    .catch( ... )
```

Check out the test suite for more use examples.


## Contributing

```
npm run watch
```

Test it up

```
npm test
```


## V2 Goals

- [x] non-intrusive-`wrangler`, give it a level instance with whatever plugins you want.
- [ ] minimal model-schema that allows indexable props
- [ ] Pluggable—stuff like validation should be an extended module
- [x] ES6 and babel—yuuup
