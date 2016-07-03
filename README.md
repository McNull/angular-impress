# angular-impress
An AngularJS port of the impressive [Impress](https://github.com/impress/impress.js) presentation framework.

Mixing AngularJS and Impress goes beyond *static* presentations and allows for more interactive content like carousels, wizard forms and/or even complete navigation effects in a website.

## Demos
* [3D transform via ImpressStep model](http://plnkr.co/edit/u0F4Iv?p=info)

## Directives
This module contains two main *directives* and an *api service*.  With the two directives you can define an *impress viewport* and the *individual steps* the presentation should follow. Each view within the viewport has 3D coordinates which is used to align the *camera* at a certain step. 

### impress
The `impress` directive is the main directive that will create a new viewport. 

**Element ID**
Specifying an ID on the `impress` directive is optional but needed if you wish to interact with its *API* interface.

```
<impress id="my-impress">
</impress>
```

```
function MyCtrl(impress) {
    var api = impress('my-impress');
}
```

**Fullscreen vs Embedded**
By default the viewport will assume a fullscreen presentation. If you wish to contain the viewport to a certain area of your page you’ll only need to mark the element with the class `impress-container` and optionally specify a fixed height.

```
<impress id="my-impress" class="impress-container">
  <!-- ... -->
</impress>
<style>
    /* optional */
    #my-impress {
        height: 600px;
    }
</style>
```

### impress-step
The `impress-step` directive specifies a step within the presentation. To specify its 3D transformations use the following attributes:

|attribute       |meaning        |
|:-              |:-             |
|`data-x`        |x-axis position|
|`data-y`        |y-axis position|
|`data-z`        |z-axis position|
|`data-rotate-x` |x-axis rotation|
|`data-rotate-y` |y-axis rotation|
|`data-rotate-z` |z-axis rotation|
|`data-rotate`   |z-axis rotation|
|`data-scale`    |scale factor   |


```
<impress-step data-x="-1000" data-y="-1500">
  <q>Aren’t you just <b>bored</b> with all those slides-based presentations?</q>
</impress-step>
```

For performance reasons these attribute properties are static and changes are not reflected to the 3D coordinates of the step.   Refer to the `ImpressStep` model for *two-way-bindings*. 

**ImpressStep Model**
Instead of specifying each property within the markup of the step element, it's also possible to have a two-way binding on a model instance via the `step` attribute. This model will contain all 3D transformation properties along with your own custom data. 
When specifying custom modal instances, it's recommended to use the `ImpressStep` prototype since this will ensure that all required properties are supplied. The construction excepts an argument that will *merge* any supplied properties.

```
<div ng-controller="MyController">
  <impress id="my-impress">
    <impress-view step="myStep">
  </impress>
</div>
```

```
function MyController($scope, ImpressStep) {
  $scope.myStep = new ImpressStep({
    translate: {
      y: -100
    },
    rotate: {
      z: 90
    },
    myProperty: 'myValue'
  });
  
  /* 
  result = {
    translate: {
      x: 0,
      y: -100,
      z: 0
    },
    rotate: {
      x: 0,
      y: 0,
      z: 90
    },
    scale: 1,
    ...
    myProperty: 'myValue'
    ...
  }*/
}
```

3D transform properties are reflected at once to the step.

## API Service
The *api service* can be injected into other *angular* components and provides methods to control the presentation; eg. move to next step.
