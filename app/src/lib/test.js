/*import { string, int } from "parjs";
import { or, maybe, then, between, manySepBy } from "parjs/combinators"

function createParser() {
    const baseBaseNote = string("c").pipe(or("d"), or("e"), or("f"), or("g"), or("a"), or("b"));
    const baseHighNote = string("C").pipe(or("D"), or("E"), or("F"), or("G"), or("A"), or("B"));
    const baseNote = baseBaseNote.pipe(or(baseHighNote));
    const basePause = string("p").pipe(or("P"));

    const alter = string("##").pipe(or("#"), or("bb"), or("b")).pipe(maybe());

    const baseOctaveShift = string("1").pipe(or("2"), or("3"), or("4"), or("5"));
    const baseOctaveSign = string("+").pipe(or("-"));
    const baseOctave = baseOctaveSign.pipe(then(baseOctaveShift));
    const octave = baseOctave.pipe(maybe());

    const baseNumber = int({ allowSign: false });
    const baseDot = string(".").pipe(maybe());
    const baseFraction = baseNumber.pipe(then("/"), then(baseNumber), maybe());
    const baseOptionFraction = baseFraction.pipe(then(baseDot), between("(", ")"));
    const fraction = baseOptionFraction.pipe(maybe());

    const baseNplets = baseNumber.pipe(between("[", "]"));

    const baseValLeg = string("-").pipe(maybe());

    const pause = fraction.pipe(then(basePause));
    const pureNote = baseNote.pipe(then(alter), then(octave));
    const note = fraction.pipe(then(pureNote));
    const nplet = fraction.pipe(then(baseNplets), then(pureNote.pipe(manySepBy("_"))));
    const chord = fraction.pipe(then(pureNote.pipe(manySepBy(":"))));

    const baseEntity = chord.pipe(or(nplet), or(note), or(pause));
    return baseEntity;
}

export { createParser }*/