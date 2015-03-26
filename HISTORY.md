# 2.2.0

* _add_ core js dependency
* _add_ extend test suite
* _add_ `wrangler::getFactory`
* _update_ factories must have ids

# 2.1.2 - 25.03.15

* _fix_ `factory::find` should deserialize

# 2.1.1 - 25.03.15

* _add_ `factory::deserialize` to fix `findAll` returning incorrect ids

# 2.1.0 - 25.03.15

* _add_ `model::remove`
* _add_ additional tests

# 2.0.0 - 24.03.15

* _add_ `factory::findAll`
* _add_ `factory::find` by id
* _add_ `model::save`
* _add_ pass leveldb instance

---

# 0.5.0 - 03.02.15

* Update deps to be iojs-friendly

# 0.4.0 - 26.06.14

* Implement findAll to return an array of models
* Allow searching for an item across indices
* Allow search by id
* fix: assign a new id for models

# 0.3.1 - 25.06.14

* Fix creating wrangler with models

# 0.3.0 - 25.06.14

* Implement find
* Enforce unique indices
* Use old ids or generate new ones
* Save models against an id

# 0.2.0 - 23.06.14

* Generate unique ids
* Update package repo
* Model refactor

# 0.1.1 - 22.06.14

* Pass separators to models
* Expose constructors

# 0.1.0 - 20.06.14

* Use models to store
* Models adhere to schemas
* Using sublevel
