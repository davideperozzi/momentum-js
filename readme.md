<p align="center"><img src="http://i68.tinypic.com/rtg4qv.png"></p>
<p align="center"><img src="https://badge.fury.io/js/momentum.js.svg"></p>

## About momentum.js

momenutm.js is a small (plainly written) JavaScript plugin, giving you the ability to add a "throw momentum effect" to anything displayed on your webpage. It can be a handy alternative to the Draggable extension of the greensock animation framework. Besides desktop devices it also works for mobile and touch devices.

## Installation

To use momentum.js you have to include the momentum.js file from the dist folder. If your server supports serving compressed files you can also put the compressed **gz** file in the same directory as the js file. This improves the loading time by **more than 50%**.
It also comes as a **npm** module:
```bash
npm install momentum.js
```

## How to use the Draggable

The Draggable component allows your elements to be dragged around.

```javascript
new momentum.Draggable(element, config);
```

This example shows how to create a basic draggable element:

```javascript
new momentum.Draggable(dragElement, {
  container: containerElement,
  containerBounds: true,
  resizeUpdate: true,
  autoAnchor: true
});
```

### Some Draggable Demos
http://davide-perozzi.de/momentum-js/

### The Draggable configuration

| Option  | Type | Default | Description |
| ------------- | ------------- | ------------- | ------------- |
| container  | Element  | null | Container of the draggable element. Also the target for the "drag events" |
| containerBounds | boolean | false | Determines if the bounds of the container should be used |
| bounds | Object | null | Set the bounds manually {x: number y: number, width: number, height: number} |
| autoAnchor | boolean | false | Determines if the anchor should be set on the start position the user has clicked |
| anchorX | number | 0.5 | The anchor point on the horizontal axis. |
| anchorY | number | 0.5 | The anchor point on the vertical axis. |
| threshold | number| 5 | The minimum velocity the element needs to reach to trigger the throw animation |
| restitution | number | 0 | The bounciness of the element if it hits the bounds. This will be multiplicated with the velocity. You can use negative values to let the element bounce out of the bounds. Numbers **from -1 to 1** are **valid**.
| friction | number | 0.035 | The friction of the element. Lower values make the elements decelerate longer. Numbers **from 0 to 1** are **valid** |
| offsetFriction | number | 0.1 | The friction used out of bounds. This will be included in the calculations if you used a negative restitution. Numbers **from 0 to 1** are **valid** |
| maxVelocity | number | 70 | The maximum velocity the element can reach. Numbers **greater than 0** are **valid**. |
| resizeUpdate | boolean | false | Determines whether the draggable should be updated automatically after the browser is resized. |
| onDown | Function | null | Callback which will be called if the user hits the element before the drag. Whether you return true or false determimes if the drag will be accepted. If you want to **preserve the default behaviour** you should **return the "isHit" parameter**. Parameter list: cursorX, cursorY, elementX, elementY, elementWidth, elementHeight, isHit |
| onMove | Function | null | This will be triggered before the element is going to be moved. At this point the element does **not** have the latest translation. Parameter list: posX, posY, velX, velY. |
| onTranslate | Function | null | This will be called if the translation settled. Parameter list:  elementX, elementY, elementWidth, elementHeight, elementBounds |

## License
momentum.js is open-sourced software licensed under the [MIT license](http://opensource.org/licenses/MIT).