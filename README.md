# How to use the simulator

## Creating a world

You can create a world by typing up a text description of it. You can write up
a description using the following characters:

* “ ” - a blank space. This describes somewhere that is NOT somewhere on the
  lawn. Useful for adding the starting square (which contains the base station)
  outside of the lawn, or creating non-rectangular lawns
* “B” - square contains part of the boundary wire.
* “G” - square contains part of the guide wire.
* “J” - square contains both a part of the boundary wire and a part of the
  guide wire. This is where the guide wire connects (or Joins) the boundary
  wire.
* “L” - square contains otherwise empty lawn.
* “S” - starting square. This contains the base station. When on this square,
  your mower will charge to its full capacity.

The mower will always start on the starting square, facing away from the guide
wire leading out of the starting square.

### Rules for making a world

You can only move horizontally or vertically between squares. As such, when I
say “next to” below, I mean above, below, to the left of, or to the right of,
that square.

* There must always be a spot for the base station.
* The base station must always be next to a guide wire.
* The guide wire cannot be broken; each guide wire square must be next to at
  least two of the following: another guide wire square, a starting square, or
  a “J” square. A “J” square is a square which contains both a piece of the
  guide wire and a piece of the boundary wire.
* The boundary wire cannot be broken; each boundary wire square must be next to
  either another boundary wire square, or a “J” square. The only exception is
  where a gap is made for the guide wire to run out from the base station, as
  seen in the examples below.

### Example text descriptions

Feel free to copy these worlds out for your own programs.

```
BBBBJBBBB
BLLLGLLLB
BLLLGLLLB
BLLLGLLLB
BBBBGBBBB
    S
```

```
BBBBBBBBB
BLLLLLLLB
JGGGGGGGGS
BLLLLLLLB
BBBBBBBBB
```

```
BBBBBBBJBBBBBBBBB
BLLLLLLGLLLLLLLLB
BLLLLLLGLLLLLLLLB
BLLLLLLGLLLLLLLLBBBBBBBBBBBBBB
BLLLLLLGLLLLLLLLLLLLLLLLLLLLLB
BLLLLLLGLLLLLLLLLLLLLLLLLLLLLB
BLLLLLLGGGGGGGGGGGGGGGGGGGLLLB
BLLLLLLLLLLLLLLLLLLLLLLLLGLLLB
BBBBLLLLLLLLLLLLLLLLLLLLLGLLLB
   BLLLLLLLLLLLLLLLLLLLLLGLLLB
   BBBBBBBBBBBBBBBBBBBBBBGBBBB
                         S
```

## API documentation

The following are the commands available to you to use in the command box. You
can also use any JavaScript you want here.

Unless the description of a command says it uses power, you can assume that it
does NOT use any of the mower’s power. Additionally, unless a description says
the command returns a value, you can assume it doesn’t return anything.

`this.isSpaceAhead()`
Tells you if there is space ahead of the mower for it to move into. Returns
`true` or `false`. Can be used to detect boundaries.

`this.isSpaceBehind()`
Tells you if there is space behind the mower for it to move into. Returns
`true` or `false`.

`this.forward()`
Moves the mower forward. Uses one unit of power.

`this.reverse()`
Moves the mower backwards. Uses one unit of power.

`this.turnLeft()`
Turns the mower left. Uses one unit of power.

`this.turnRight()`
Turns the mower left. Uses one unit of power.

`this.isCurrentSpaceMowed()`
Tells you if the space the mower is currently on has already been mowed. Keep
in mind that the mower only mows a space right before leaving that space.
Returns `true` or `false`.

`this.getRemainingPower()`
Tells you how many units of power remain in the mower. Returns a value between
the maximum charge (which is currently set to `40`) and `0`.

`this.isMowerAtBaseStation()`
Tells you if the space the mower is currently on is the base station.

`this.isObjectAtCurrentMowerPosition(objectName)`
Tells you if a given object is at the mower’s current position. Valid values
for `objectName` are:

* `LawnItems.boundaryWire`
* `LawnItems.guideWire`
* `LawnItems.grass`
* `LawnItems.mowedGrass`
* `LawnItems.baseStation`

Returns `true` or `false`. Note that, for the “J” square, both an `itemName` of
`LawnItems.guideWire` *and* one of `LawnItems.boundaryWire` will both return
`true`. Also, anywhere on the lawn (and reachable space except for the base
station) will return `true` for `LawnItems.grass`, even after the lawn has been
mowed (where it will now also return `true` for `LawnItems.mowedGrass`).

`this.directionToBase()`
If the square the mower is on has a guide wire, this returns a hash containing
the number of turns left, and the number of turns right, required to point the
mower to the next guide wire square in the direction of the base. If the square
does **not** have a guide wire, this returns `undefined`.

An example return value is:

```
{
  lefts: 1,
  right: 3
}
```

You can see how to use it in the example programs.

`this.directionsAwayFromBase()`
If the square the mower is on has a guide wire, **or** if the mower is at the
base station, this returns a hash containing the number of turns left, and the
number of turns right, required to point the mower to the next guide wire square
in the direction away from the base station. If the square does **not** either
have a guide wire or a base station, this returns `undefined`.

## Example programs

Reverse out from the base station, turn 360 degrees, then go back in:

```
this.reverse();
this.turnLeft();
this.turnLeft();
this.turnLeft();
this.turnLeft();
this.forward();
```

Reverse out the base station and keep going until you can’t go anymore, then go
forward back until the base station.

```
while (this.isSpaceBehind()) {
  this.reverse();
}
while (this.isSpaceAhead()) {
  this.forward();
}
```

Reverse out of the base station, spin until half of your charge is left, then
go back to the base station.

```
this.reverse();
while (this.getRemainingPower() > 20) {
  this.turnRight();
}
while (!this.isMowerAtBaseStation()) {
  if (this.isSpaceAhead()) {
    this.forward();
    if (!this.isMowerAtBaseStation()) {
      this.reverse();
      this.turnRight();
    }
  }
}
```

This program will always bring the mower back to the base, if the mower is on
a guide wire, with the minimum amount of battery charge used.

```
while (this.isObjectAtCurrentMowerPosition(LawnItems.guideWire)) {
  let directions = this.directionToBase();
  if (directions.lefts < directions.rights) {
    for (let i = 0; i < directions.lefts; i++) {
      this.turnLeft();
    }
  } else {
    for (let i = 0; i < directions.rights; i++) {
      this.turnRight();
    }    
  }
  this.forward();
}
```
