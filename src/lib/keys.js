let KEYS = {};

KEYS["C"] = {
    "a": 0,
    "b": 0,
    "c": 0,
    "d": 0,
    "e": 0,
    "f": 0,
    "g": 0
};
KEYS["CMAJ"] = KEYS["C"];

KEYS["CMIN"] = {
    "a": -1,
    "b": -1,
    "c": 0,
    "d": 0,
    "e": -1,
    "f": 0,
    "g": 0
};
KEYS["CM"] = KEYS["CMIN"];

KEYS["D"] = {
    "a": 0,
    "b": 0,
    "c": 1,
    "d": 0,
    "e": 0,
    "f": 1,
    "g": 0
};
KEYS["DMAJ"] = KEYS["D"];

KEYS["DMIN"] = {
    "a": 0,
    "b": -1,
    "c": 0,
    "d": 0,
    "e": 0,
    "f": 0,
    "g": 0
};
KEYS["DM"] = KEYS["DMIN"];

export { KEYS };