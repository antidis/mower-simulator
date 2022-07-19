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
}

class World {
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
    let width = this.world[0].length;
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
    return this.worldObject[x][y];
  }

  constructWorldFromObject() {
    throw new Error("Not yet implemented.");
  }

  draw() {

  }
}


class MowerSimulator extends World {
  constructor(opts) {
    super(opts);
    this.placeMower();
  }

  static mowerMaxCharge = 40;

  resetMowerSimulatior() {
    this.mowerOrientation = undefined;
    this.resetWorld();
    this.placeMower();
  }

  placeMower() {
    this.mowerPosition = this.startPosition;
    // Check surrounds for position of guide wire
    [[0, -1], [0, 1], [-1, 0], [1, 0]].forEach((orientation) => {
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

  areQueryCoordsMowable(x, y) {
    return super.queryCoords(x, y).hasObjects();
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

  isSpaceAhead() {
    let queryCoords = this.coordinatesAhead();
    return this.areQueryCoordsMowable(
      queryCoords[0],
      queryCoords[1]
    );
  }

  isSpaceBehind() {
    let queryCoords = this.coordinatesBehind();
    return this.areQueryCoordsMowable(
      queryCoords[0],
      queryCoords[1]
    );
  }

  isObjectAtPosition(objectName, x, y) {
    return super.queryPosition(x, y).hasObject(objectName);
  }

  isObjectAtCurrentMowerPosition(objectName) {
    return isObjectAtPosition(objectName, this.mowerPosition[0], this.mowerPosition[1]);
  }

  isMowerAtBaseStation() {
    return isObjectAtCurrentMowerPosition(LawnItems.baseStation);
  }

  isCurrentCellMowed() {
    return isObjectAtCurrentMowerPosition(LawnItems.mowedGrass);
  }

  isCurrentSpaceMowed() {
    return super.queryCoords(this.mowerPosition[0], this.mowerPosition[1])
      .hasObject(LawnItems.mowedGrass);
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
    let newMowerPosition = coordinatesFunction();
    if (checkingFunction()) {
      this.mowerPosition = newMowerPosition;
    } else {
      alert(`Tried to ${direction} mower outside of bounds, to [${newMowerPosition[0]}, ${newMowerPosition[1]}]`);
    }
    this.moveEnd();
  }

  forward() {
    this.moveMower(
      'advance',
      this.isSpaceAhead,
      this.coordinatesAhead
    );
  }

  reverse() {
    this.moveMower(
      'reverse',
      this.isSpaceBehind,
      this.coordinatesBehind
    );
  }

  mow() {
    super.queryPosition(
      this.mowerPosition[0],
      this.mowerPosition[1]
    ).addObject(LawnItems.mowedGrass);
  }

  moveEnd() {
    if (this.isMowerAtBaseStation()) {
      this.chargeMower();
    } else {
      this.usePower();
    }
  }

}

document.querySelector("#CreateWorld").addEventListener("click", (e) => {
  theWorld = new MowerSimulator({
    world: document.querySelector(".mower-simulation-world-entry").value,
    query: ".mower-simulation-view"
  });
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
