let KEYS = {};

// Major keys with sharps
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


KEYS["G"] = {
    "a": 0,
    "b": 0,
    "c": 0,
    "d": 0,
    "e": 0,
    "f": 1,
    "g": 0
};
KEYS["GMAJ"] = KEYS["G"];

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


KEYS["A"] = {
    "a": 0,
    "b": 0,
    "c": 1,
    "d": 0,
    "e": 0,
    "f": 1,
    "g": 1
};
KEYS["AMAJ"] = KEYS["A"];

KEYS["E"] = {
    "a": 0,
    "b": 0,
    "c": 1,
    "d": 1,
    "e": 0,
    "f": 1,
    "g": 1
};
KEYS["EMAJ"] = KEYS["E"];

KEYS["B"] = {
    "a": 1,
    "b": 0,
    "c": 1,
    "d": 1,
    "e": 0,
    "f": 1,
    "g": 1
};
KEYS["BMAJ"] = KEYS["B"];

KEYS["F#"] = {
    "a": 1,
    "b": 0,
    "c": 1,
    "d": 1,
    "e": 1,
    "f": 1,
    "g": 1
};
KEYS["F#MAJ"] = KEYS["F#"];

KEYS["C#"] = {
    "a": 1,
    "b": 1,
    "c": 1,
    "d": 1,
    "e": 1,
    "f": 1,
    "g": 1
};
KEYS["C#MAJ"] = KEYS["C#"];

// Major keys with flats

KEYS["F"] = {
    "a": 0,
    "b": -1,
    "c": 0,
    "d": 0,
    "e": 0,
    "f": 0,
    "g": 0
};
KEYS["FMAJ"] = KEYS["F"];

KEYS["BB"] = {
    "a": 0,
    "b": -1,
    "c": 0,
    "d": 0,
    "e": -1,
    "f": 0,
    "g": 0
};
KEYS["BBMAJ"] = KEYS["BB"];

KEYS["EB"] = {
    "a": -1,
    "b": -1,
    "c": 0,
    "d": 0,
    "e": -1,
    "f": 0,
    "g": 0
};
KEYS["EBMAJ"] = KEYS["EB"];

KEYS["AB"] = {
    "a": -1,
    "b": -1,
    "c": 0,
    "d": -1,
    "e": -1,
    "f": 0,
    "g": 0
};
KEYS["ABMAJ"] = KEYS["AB"];

KEYS["DB"] = {
    "a": -1,
    "b": -1,
    "c": 0,
    "d": -1,
    "e": -1,
    "f": 0,
    "g": -1
};
KEYS["DBMAJ"] = KEYS["DB"];

KEYS["GB"] = {
    "a": -1,
    "b": -1,
    "c": -1,
    "d": -1,
    "e": -1,
    "f": 0,
    "g": -1
};
KEYS["GBMAJ"] = KEYS["GB"];

KEYS["CB"] = {
    "a": -1,
    "b": -1,
    "c": -1,
    "d": -1,
    "e": -1,
    "f": -1,
    "g": -1
};
KEYS["CBMAJ"] = KEYS["CB"];

// Minor keys with sharps

KEYS["AMIN"] = {
    "a": 0,
    "b": 0,
    "c": 0,
    "d": 0,
    "e": 0,
    "f": 0,
    "g": 0
};
KEYS["AM"] = KEYS["AMIN"];

KEYS["EMIN"] = {
    "a": 0,
    "b": 0,
    "c": 0,
    "d": 0,
    "e": 0,
    "f": 1,
    "g": 0
};
KEYS["EM"] = KEYS["EMIN"];

KEYS["BMIN"] = {
    "a": 0,
    "b": 0,
    "c": 1,
    "d": 0,
    "e": 0,
    "f": 1,
    "g": 0
};
KEYS["BM"] = KEYS["BMIN"];

KEYS["F#MIN"] = {
    "a": 0,
    "b": 0,
    "c": 1,
    "d": 0,
    "e": 0,
    "f": 1,
    "g": 1
};
KEYS["F#M"] = KEYS["F#MIN"];

KEYS["C#MIN"] = {
    "a": 0,
    "b": 0,
    "c": 1,
    "d": 1,
    "e": 0,
    "f": 1,
    "g": 1
};
KEYS["C#M"] = KEYS["C#MIN"];

KEYS["G#MIN"] = {
    "a": 1,
    "b": 0,
    "c": 1,
    "d": 1,
    "e": 0,
    "f": 1,
    "g": 1
};
KEYS["G#M"] = KEYS["G#MIN"];

KEYS["D#MIN"] = {
    "a": 1,
    "b": 0,
    "c": 1,
    "d": 1,
    "e": 1,
    "f": 1,
    "g": 1
};
KEYS["D#M"] = KEYS["D#MIN"];

KEYS["A#MIN"] = {
    "a": 1,
    "b": 1,
    "c": 1,
    "d": 1,
    "e": 1,
    "f": 1,
    "g": 1
};
KEYS["A#M"] = KEYS["A#MIN"];

// Minor keys with flats

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

KEYS["GMIN"] = {
    "a": 0,
    "b": -1,
    "c": 0,
    "d": 0,
    "e": -1,
    "f": 0,
    "g": 0
};
KEYS["GM"] = KEYS["GMIN"];

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

KEYS["FMIN"] = {
    "a": -1,
    "b": -1,
    "c": 0,
    "d": -1,
    "e": -1,
    "f": 0,
    "g": 0
};
KEYS["FM"] = KEYS["FMIN"];

KEYS["BBMIN"] = {
    "a": -1,
    "b": -1,
    "c": 0,
    "d": -1,
    "e": -1,
    "f": 0,
    "g": -1
};
KEYS["BBM"] = KEYS["BBMIN"];

KEYS["EBMIN"] = {
    "a": -1,
    "b": -1,
    "c": -1,
    "d": -1,
    "e": -1,
    "f": 0,
    "g": -1
};
KEYS["EBM"] = KEYS["EBMIN"];

KEYS["ABMIN"] = {
    "a": -1,
    "b": -1,
    "c": -1,
    "d": -1,
    "e": -1,
    "f": -1,
    "g": -1
};
KEYS["ABM"] = KEYS["ABMIN"];

// Modal keys

function modalGen(map, full, minLength, origin) {
    for(let i = minLength; i <= full.length; i++) {
        map[full.substring(0, i)] = map[origin];
    }
}

// Modal C 
modalGen(KEYS, "CIONIAN", 4, "C");
modalGen(KEYS, "CDORIAN", 4, "BB");
modalGen(KEYS, "CPHRYGIAN", 4, "AB");
modalGen(KEYS, "CLYDIAN", 4, "G");
modalGen(KEYS, "CMIXOLYDIAN", 4, "F");
modalGen(KEYS, "CAEOLIAN", 4, "EB");
modalGen(KEYS, "CLOCRIAN", 4, "DB");

// Modal C#
modalGen(KEYS, "C#IONIAN", 5, "C#");
modalGen(KEYS, "C#DORIAN", 5, "B");
modalGen(KEYS, "C#PHRYGIAN", 5, "A");
modalGen(KEYS, "C#LYDIAN", 5, "G#");
modalGen(KEYS, "C#MIXOLYDIAN", 5, "F#");
modalGen(KEYS, "C#AEOLIAN", 5, "E");
modalGen(KEYS, "C#LOCRIAN", 5, "D");

// Modal D
modalGen(KEYS, "DIONIAN", 4, "D");
modalGen(KEYS, "DDORIAN", 4, "C");
modalGen(KEYS, "DPHRYGIAN", 4, "BB");
modalGen(KEYS, "DLYDIAN", 4, "A");
modalGen(KEYS, "DMIXOLYDIAN", 4, "G");
modalGen(KEYS, "DAEOLIAN", 4, "F");
modalGen(KEYS, "DLOCRIAN", 4, "EB");

// Modal EB
modalGen(KEYS, "EBIONIAN", 5, "EB");
modalGen(KEYS, "EBDORIAN", 5, "DB");
modalGen(KEYS, "EBPHRYGIAN", 5, "B");
modalGen(KEYS, "EBLYDIAN", 5, "BB");
modalGen(KEYS, "EBMIXOLYDIAN", 5, "AB");
modalGen(KEYS, "EBAEOLIAN", 5, "GB");
modalGen(KEYS, "EBLOCRIAN", 5, "E");

// Modal E
modalGen(KEYS, "EIONIAN", 4, "E");
modalGen(KEYS, "EDORIAN", 4, "D");
modalGen(KEYS, "EPHRYGIAN", 4, "C");
modalGen(KEYS, "ELYDIAN", 4, "B");
modalGen(KEYS, "EMIXOLYDIAN", 4, "A");
modalGen(KEYS, "EAEOLIAN", 4, "G");
modalGen(KEYS, "ELOCRIAN", 4, "F");

// Modal F
modalGen(KEYS, "FIONIAN", 4, "F");
modalGen(KEYS, "FDORIAN", 4, "EB");
modalGen(KEYS, "FPHRYGIAN", 4, "DB");
modalGen(KEYS, "FLYDIAN", 4, "C");
modalGen(KEYS, "FMIXOLYDIAN", 4, "BB");
modalGen(KEYS, "FAEOLIAN", 4, "AB");
modalGen(KEYS, "FLOCRIAN", 4, "GB");

// Modal F#
modalGen(KEYS, "F#IONIAN", 5, "F#");
modalGen(KEYS, "F#DORIAN", 5, "E");
modalGen(KEYS, "F#PHRYGIAN", 5, "D");
modalGen(KEYS, "F#LYDIAN", 5, "C#");
modalGen(KEYS, "F#MIXOLYDIAN", 5, "B");
modalGen(KEYS, "F#AEOLIAN", 5, "A");
modalGen(KEYS, "F#LOCRIAN", 5, "G");

// Modal G
modalGen(KEYS, "GIONIAN", 4, "G");
modalGen(KEYS, "GDORIAN", 4, "F");
modalGen(KEYS, "GPHRYGIAN", 4, "EB");
modalGen(KEYS, "GLYDIAN", 4, "D");
modalGen(KEYS, "GMIXOLYDIAN", 4, "C");
modalGen(KEYS, "GAEOLIAN", 4, "BB");
modalGen(KEYS, "GLOCRIAN", 4, "AB");

// Modal AB
modalGen(KEYS, "ABIONIAN", 5, "AB");
modalGen(KEYS, "ABDORIAN", 5, "GB");
modalGen(KEYS, "ABPHRYGIAN", 5, "E");
modalGen(KEYS, "ABLYDIAN", 5, "EB");
modalGen(KEYS, "ABMIXOLYDIAN", 5, "DB");
modalGen(KEYS, "ABAEOLIAN", 5, "B");
modalGen(KEYS, "ABLOCRIAN", 5, "A");

// Modal A
modalGen(KEYS, "AIONIAN", 4, "A");
modalGen(KEYS, "ADORIAN", 4, "G");
modalGen(KEYS, "APHRYGIAN", 4, "F");
modalGen(KEYS, "ALYDIAN", 4, "E");
modalGen(KEYS, "AMIXOLYDIAN", 4, "D");
modalGen(KEYS, "AAEOLIAN", 4, "C");
modalGen(KEYS, "ALOCRIAN", 4, "BB");

// Modal A#
modalGen(KEYS, "A#IONIAN", 5, "A#");
modalGen(KEYS, "A#DORIAN", 5, "G#");
modalGen(KEYS, "A#PHRYGIAN", 5, "F#");
modalGen(KEYS, "A#LYDIAN", 5, "F");
modalGen(KEYS, "A#MIXOLYDIAN", 5, "D#");
modalGen(KEYS, "A#AEOLIAN", 5, "C#");
modalGen(KEYS, "A#LOCRIAN", 5, "B");

// Modal B
modalGen(KEYS, "BIONIAN", 4, "B");
modalGen(KEYS, "BDORIAN", 4, "A");
modalGen(KEYS, "BPHRYGIAN", 4, "G");
modalGen(KEYS, "BLYDIAN", 4, "F#");
modalGen(KEYS, "BMIXOLYDIAN", 4, "E");
modalGen(KEYS, "BAEOLIAN", 4, "D");
modalGen(KEYS, "BLOCRIAN", 4, "C");

export { KEYS };