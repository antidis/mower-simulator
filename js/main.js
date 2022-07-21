var theWorld;

class LawnItems {
  static boundaryWire = "boundaryWire";
  static guideWire = "guideWire";
  static grass = "grass";
  static mowedGrass = "mowedGrass";
  static baseStation = "baseStation";
  static types = [
    LawnItems.boundaryWire,
    LawnItems.guideWire,
    LawnItems.grass,
    LawnItems.mowedGrass,
    LawnItems.baseStation
  ];

  constructor(opts) {
    this.objectHash = {};
    LawnItems.types.forEach((itemName) => {
      this.objectHash[itemName] = (opts[itemName] === undefined) ? false : opts[itemName];
    });
    this.objectHash["guideWireDirectionToBase"] = opts["guideWireDirectionToBase"];
    this.objectHash["guideWireDirectionAwayFromBase"] = opts["guideWireDirectionAwayFromBase"];
  }

  hasObject(itemName) {
    return this.objectHash[itemName];
  }

  hasObjects() {
    let hasObjects = false;
    LawnItems.types.forEach((itemName) => {
      hasObjects = hasObjects || this.hasObject(itemName);
    });
    return hasObjects;
  }

  addObject(itemName) {
    this.objectHash[itemName] = true;
  }

  removeObject(itemName) {
    this.objectHash[itemName] = false;
  }

  isEmpty() {
    return !this.hasObjects();
  }

  guideWireDirectionToBase() {
    return this.objectHash.guideWireDirectionToBase;
  }

  setGuideWireDirectionToBase(val) {
    this.objectHash.guideWireDirectionToBase = val;
  }

  guideWireDirectionAwayFromBase() {
    return this.objectHash.guideWireDirectionAwayFromBase;
  }

  setGuideWireDirectionAwayFromBase(val) {
    this.objectHash.guideWireDirectionAwayFromBase = val;
  }

}

class World {
  static orientations = [[0, -1], [0, 1], [-1, 0], [1, 0]];

  constructor(opts) {
    if (opts === undefined) {
      throw new Error("Options not specified.")
    }
    if (typeof opts["world"] === undefined) {
      throw new Error("World not specified.")
    }
    if (typeof opts["query"] !== "string") {
      throw new Error("Draw query not specified.")
    }
    Object.keys(opts).forEach((optKey) => {
      this[optKey] = opts[optKey];
    });
    this.constructWorld();
    this.canvasEl = document.querySelector(this.query);
  }

  constructWorld() {
    if (typeof this.world === "string") {
      this.world = this.world.split(/\n/);
    }
    if ((typeof this.world === "object") && (typeof this.world[0] === "string")) {
      this.constructWorldFromString();
    } else {
      this.constructWorldFromObject();
    }
  }

  resetWorld() {
    this.startPosition = undefined;
    this.constructWorld();
  }

  constructWorldFromString() {
    let depth = this.world.length;
    let width = Math.max.apply(null, this.world.map((s) => s.length));
    this.worldObject = new Array(width);
    for (let i = 0; i < width; i++) {
      this.worldObject[i] = new Array(depth);
      for (let j = 0; j < depth; j++) {
        let objectsFound = this.findObjectsInString(this.world[j][i]);
        this.worldObject[i][j] = objectsFound;
        if (objectsFound.hasObject(LawnItems.baseStation)) {
          this.startPosition = [i, j];
        }
      }
    }
    if (this.startPosition === undefined) {
      throw new Error("Could not find start position in world string.");
    }
    this.plotGuideWireDirection();
  }

  coordDiff(first, second) {
    return [
      second[0] - first[0],
      second[1] - first[1]
    ];
  }

  plotGuideWireDirection() {
    let oldCoords = this.startPosition;
    let newCoords = this.unplottedGuideWireNearby(oldCoords[0], oldCoords[1]);
    while (newCoords !== undefined) {
      this.worldObject[oldCoords[0]][oldCoords[1]].setGuideWireDirectionAwayFromBase(this.coordDiff(oldCoords, newCoords));
      this.worldObject[newCoords[0]][newCoords[1]].setGuideWireDirectionToBase(this.coordDiff(newCoords, oldCoords));

      oldCoords = newCoords;
      newCoords = this.unplottedGuideWireNearby(oldCoords[0], oldCoords[1]);
    }
  }

  unplottedGuideWireNearby(x, y) {
    return World.orientations.map(orientation => [x + orientation[0], y + orientation[1]])
      .reduce(
        (previousValue, currentValue) => {
          let q = this.queryCoords(currentValue[0], currentValue[1]);
          if (
            (q !== undefined)
            && q.hasObject(LawnItems.guideWire)
            && (
              (q.guideWireDirectionToBase() === undefined)
              || (q.guideWireDirectionAwayFromBase() === undefined)
            )
          ) {
            return currentValue;
          } else {
            return previousValue;
          }
        }
      , undefined);
  }

  findObjectsInString(character) {
    let foundObjectNames = [];
    let opts = {};

    if (character === undefined) {
      character = " ";
    }

    if ((character !== " ") && (character !== "S")) {
      foundObjectNames.push(LawnItems.grass);
    }
    if ((character === "B") || (character === "J")) {
      foundObjectNames.push(LawnItems.boundaryWire);
    }
    if ((character === "G") || (character === "J")) {
      foundObjectNames.push(LawnItems.guideWire);
    }
    if (character === "S") {
      foundObjectNames.push(LawnItems.baseStation);
    }
    if ([" ", "S", "B", "J", "G", "S", "L"].indexOf(character) === -1) {
      throw new Error("Unknown character in world string.");
    }

    foundObjectNames.forEach((name) => {
      opts[name] = true;
    });

    return new LawnItems(opts);
  }

  queryCoords(x, y) {
    let row = this.worldObject[x];
    return (row === undefined) ? row : row[y];
  }

  constructWorldFromObject() {
    throw new Error("Not yet implemented.");
  }

  draw() {
    this.canvasEl.width = this.canvasEl.offsetWidth;
    this.canvasEl.height = this.canvasEl.offsetHeight;
    let widthInSquares = this.worldObject.length;
    let heightInSquares = this.worldObject[0].length;
    for (let i = 0; i < widthInSquares; i++) {
      for (let j = 0; j < heightInSquares; j++) {
        let squareDetails = determineLawnSquareDetails({
          x: i,
          y: j,
          width: widthInSquares,
          height: heightInSquares
        }, this.canvasEl);
        drawLawnSquare(this.worldObject[i][j], squareDetails, this.canvasEl);
      }
    }
  }
}


class MowerSimulator extends World {
  constructor(opts) {
    super(opts);
    this.placeMower();
  }

  static mowerMaxCharge = 40;

  resetMowerSimulator() {
    this.mowerOrientation = undefined;
    this.resetWorld();
    this.placeMower();
  }

  placeMower() {
    this.mowerPosition = [ this.startPosition[0], this.startPosition[1]];
    // Check surrounds for position of guide wire
    World.orientations.forEach((orientation) => {
      let queryPoint = super.queryCoords(this.startPosition[0] + orientation[0], this.startPosition[1] + orientation[1]);
      if ((queryPoint !== undefined) && queryPoint.hasObjects()) {
        if (queryPoint.hasObject(LawnItems.guideWire)) {
          this.mowerOrientation = [(orientation[0] * -1), (orientation[1] * -1)];
        }
      }
    });
    if (this.mowerOrientation === undefined) {
      throw new Error("Cannot determine orientation of mower.");
    }
    this.chargeMower();
  }

  chargeMower() {
    this.mowerCharge = MowerSimulator.mowerMaxCharge;
  }

  processMowerInstructions(instructions) {
    let processFunction = new Function(instructions);
    processFunction.apply(this);
  }

  usePower(amount = 1) {
    this.mowerCharge = this.mowerCharge - amount;
    if (this.mowerCharge <= 0) {
      alert("Mower is out of charge.");
    }
  }

  getRemainingPower() {
    return this.mowerCharge;
  }

  queryCurrentCoords() {
    return super.queryCoords(this.mowerPosition[0], this.mowerPosition[1]);
  }

  areQueryCoordsLawn(x, y) {
    let coordsData = super.queryCoords(x, y);
    return ((coordsData !== undefined) && coordsData.hasObjects());
  }

  isObjectAtPosition(objectName, x, y) {
    let coordsData = super.queryCoords(x, y);
    return ((coordsData !== undefined) && coordsData.hasObject(objectName));
  }

  directionAwayFromBase() {
    if (this.isObjectAtCurrentMowerPosition(LawnItems.guideWire) || this.isObjectAtCurrentMowerPosition(LawnItems.baseStation)) {
      let q = this.queryCurrentCoords();
      if (q !== undefined) {
        return this.leftsAndRightsToOrientation(this.mowerOrientation, q.guideWireDirectionAwayFromBase());
      }
    }
  }

  directionToBase() {
    if (this.isObjectAtCurrentMowerPosition(LawnItems.guideWire)) {
      let q = this.queryCurrentCoords();
      if (q !== undefined) {
        return this.leftsAndRightsToOrientation(this.mowerOrientation, q.guideWireDirectionToBase());
      }
    }
  }

  leftsAndRightsToOrientation(a, b) {
    let lefts = 0;
    let tr = {
      x: a[0],
      y: a[1]
    };

    while ((lefts < 4) && !((tr.x === b[0]) && (tr.y === b[1]))) {
      lefts++;
      let temp = tr.x;
      tr.x = tr.y;
      tr.y = temp * -1;
    }

    if (lefts !== 4) {
      return {
        lefts: lefts,
        rights: ((4 - lefts) % 4)
      }
    }
  }

  coordinatesAhead() {
    return [
      this.mowerPosition[0] + this.mowerOrientation[0],
      this.mowerPosition[1] + this.mowerOrientation[1]
    ];
  }

  coordinatesBehind() {
    return [
      this.mowerPosition[0] - this.mowerOrientation[0],
      this.mowerPosition[1] - this.mowerOrientation[1]
    ];
  }

  isSpaceAhead(itemName) {
    let queryCoords = this.coordinatesAhead();
    return this.isSpaceAbstration(
      itemName,
      queryCoords[0],
      queryCoords[1]
    );
  }

  isSpaceBehind(itemName) {
    let queryCoords = this.coordinatesBehind();
    return this.isSpaceAbstration(
      itemName,
      queryCoords[0],
      queryCoords[1]
    );
  }

  isSpaceAbstration(itemName, x, y) {
    if (itemName === undefined) {
      return this.areQueryCoordsLawn(x, y);
    } else {
      return this.isObjectAtPosition(x, y);
    }
  }

  isObjectAtCurrentMowerPosition(objectName) {
    return this.isObjectAtPosition(objectName, this.mowerPosition[0], this.mowerPosition[1]);
  }

  isMowerAtBaseStation() {
    return this.isObjectAtCurrentMowerPosition(LawnItems.baseStation);
  }

  isCurrentSpaceMowed() {
    return this.isObjectAtCurrentMowerPosition(LawnItems.mowedGrass);
  }

  turnLeft() {
    if (this.mowerOrientation[0] === 0) {
      this.mowerOrientation = [ this.mowerOrientation[1], 0];
    } else {
      this.mowerOrientation = [ 0, this.mowerOrientation[0] * -1];
    }
    this.moveEnd();
  }

  turnRight() {
    if (this.mowerOrientation[0] === 0) {
      this.mowerOrientation = [ this.mowerOrientation[1] * -1, 0];
    } else {
      this.mowerOrientation = [ 0, this.mowerOrientation[0]];
    }
    this.moveEnd();
  }

  moveMower(direction, checkingFunction, coordinatesFunction) {
    this.mow();
    let newMowerPosition = coordinatesFunction.apply(this);
    if (checkingFunction.apply(this)) {
      this.mowerPosition = newMowerPosition;
    } else {
      alert(`Tried to ${direction} mower outside of bounds, to [${newMowerPosition[0]}, ${newMowerPosition[1]}]`);
    }
    this.moveEnd();
  }

  forward() {
    this.moveMower(
      "advance",
      this.isSpaceAhead,
      this.coordinatesAhead
    );
  }

  reverse() {
    this.moveMower(
      "reverse",
      this.isSpaceBehind,
      this.coordinatesBehind
    );
  }

  mow() {
    if (this.isObjectAtCurrentMowerPosition(LawnItems.grass)) {
      super.queryCoords(
        this.mowerPosition[0],
        this.mowerPosition[1]
      ).addObject(LawnItems.mowedGrass);
    }
  }

  moveEnd() {
    if (this.isMowerAtBaseStation()) {
      this.chargeMower();
    } else {
      this.usePower();
    }
    this.draw();
  }

  draw() {
    super.draw();
    let widthInSquares = this.worldObject.length;
    let heightInSquares = this.worldObject[0].length;
    let mowerSquareDetails = {
      x: this.mowerPosition[0],
      y: this.mowerPosition[1],
      width: widthInSquares,
      height: heightInSquares
    };
    drawMower(mowerSquareDetails, this.mowerOrientation, this.canvasEl);
  }

}

document.querySelector("#CreateWorld").addEventListener("click", (e) => {
  theWorld = new MowerSimulator({
    world: document.querySelector(".mower-simulation-world-entry").value,
    query: ".mower-simulation-view"
  });
  theWorld.draw();
  e.preventDefault();
  return false;
});

document.querySelector("#RunCode").addEventListener("click", (e) => {
  code = document.querySelector(".mower-simulation-code-entry").value;
  theWorld.processMowerInstructions(code);
  e.preventDefault();
  return false;
});

document.querySelector("#ClearCode").addEventListener("click", (e) => {
  document.querySelector(".mower-simulation-code-entry").value = "";
  e.preventDefault();
  return false;
});

function determineLawnSquareDetails(w, canvasEl) {
  let canvasWidth = canvasEl.width;
  let canvasHeight = canvasEl.height;
  let cellWidth = Math.floor(canvasWidth / w.width);
  let cellHeight = Math.floor(canvasHeight / w.height);
  let x = {
    x: (cellWidth * w.x),
    y: (cellHeight * w.y),
    width: cellWidth,
    height: cellHeight
  };
  return x;
}

function drawLawnSquare(lawnItems, squareDetails, canvasEl) {
  if (canvasEl.getContext) {
    let ctx = canvasEl.getContext("2d");
    ctx.strokeStyle = "#eee";
    ctx.fillStyle = lawnItems.hasObject(LawnItems.grass)
      ? lawnItems.hasObject(LawnItems.mowedGrass)
        ? "#a1df50" : "#37ae0f"
      : lawnItems.hasObject(LawnItems.baseStation)
        ? "#000" : "#fff";
    ctx.fillRect(
      squareDetails.x,
      squareDetails.y,
      squareDetails.width,
      squareDetails.height
    );
    ctx.strokeRect(
      squareDetails.x,
      squareDetails.y,
      squareDetails.width,
      squareDetails.height
    );
    let letter;
    if (lawnItems.hasObject(LawnItems.boundaryWire)) {
      letter = "B";
    }
    if (lawnItems.hasObject(LawnItems.guideWire)) {
      letter = (letter === "B") ? "J" : "G";
    }
    if (letter !== undefined) {
      ctx.font = "20px Helvetica Neue";
      ctx.fillStyle = "#000";
      ctx.textAlign = "center";
      ctx.fillText(
        letter,
        squareDetails.x + (squareDetails.width / 2),
        squareDetails.y + (squareDetails.height / 2)
      );
    }
  }
}

function drawMower(w, orientation, canvasEl) {
  if (canvasEl.getContext) {
    let ctx = canvasEl.getContext("2d");
    let squareDetails = determineLawnSquareDetails(w, canvasEl);
    let quarterSquareWidth = squareDetails.width / 4;
    let quarterSquareHeight = squareDetails.height / 4;
    let mowerBounds = {
      left: Math.floor(squareDetails.x + quarterSquareWidth),
      right: Math.ceil(squareDetails.x + squareDetails.width - quarterSquareWidth),
      top: Math.floor(squareDetails.y + quarterSquareHeight),
      bottom: Math.ceil(squareDetails.y + squareDetails.height - quarterSquareHeight)
    };

    let firstPoint = {};
    let secondPoint = {};
    let thirdPoint = {};

    if (orientation[0] === 0) {
      firstPoint.x = mowerBounds.left;
      secondPoint.x = mowerBounds.right;
      thirdPoint.x = Math.floor(mowerBounds.left + quarterSquareWidth);
      let mowerIsUp = (orientation[1] === -1);
      firstPoint.y = mowerIsUp ? mowerBounds.bottom : mowerBounds.top;
      secondPoint.y = firstPoint.y;
      thirdPoint.y = mowerIsUp ? mowerBounds.top : mowerBounds.bottom;
    } else {
      firstPoint.y = mowerBounds.top;
      secondPoint.y = mowerBounds.bottom;
      thirdPoint.y = Math.floor(mowerBounds.top + quarterSquareHeight);
      let mowerIsLeft = (orientation[0] === -1);
      firstPoint.x = mowerIsLeft ? mowerBounds.right : mowerBounds.left;
      secondPoint.x = firstPoint.x;
      thirdPoint.x = mowerIsLeft ? mowerBounds.left : mowerBounds.right;
    }

    ctx.fillStyle = "rgba(255, 0, 0, 0.3)";
    ctx.strokeStyle = "#f00";
    ctx.beginPath();
    ctx.moveTo(firstPoint.x, firstPoint.y);
    ctx.lineTo(secondPoint.x, secondPoint.y);
    ctx.lineTo(thirdPoint.x, thirdPoint.y);
    ctx.lineTo(firstPoint.x, firstPoint.y);
    ctx.fill();
    ctx.stroke();
  }
}
