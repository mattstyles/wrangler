# Wrangler

> Defines and stores json models by indices within a leveldb

## Road to v2

__Wut? V2?__

Ok, so there was no proper v1, but the implementation is going to significantly change but as it will fulfill the same job no point in creating a new project. Goals for v2:

* Non-intrusive—`wrangler` should be thrown a level instance rather than a path, allowing you to stick whatever plugins for level you want.

* Minimal—models and schemas allow indexable properties and thats about it out of the box.

* Plugins—want validation? want some other stuff? add it on.

* ES6 and babel—yuuup.

Development is on the `develop` branch and the current `0.5.0` is unsupported, its `<1.0.0`, so, yeah.

Oh, and it’ll get a proper readme. Poor unloved project :finnadie:
