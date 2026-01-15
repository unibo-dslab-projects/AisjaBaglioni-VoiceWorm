function assert(cond) {
    if (!cond) throw new Error("Invalid input");
}

function gcd(a, b) {
    if (b === 0) return a;
    return gcd(b, a % b);
}

class Input {
    constructor(string) {
        this.input = string;
        this.index = 0;
        this.length = this.input.length;
    }

    peek() {
        if (!this.hasNext()) return null;
        return this.input[this.index];
    }

    next() {
        if (!this.hasNext()) return null;
        return this.input[this.index++];
    }

    hasNext() {
        return this.index < this.length;
    }

    allRemainingAfterPeek(func) {
        for (let i = this.index + 1; i < this.length; i++) {
            if (!func(this.input[i])) return false;
        }
        return true;
    }
}

class Whitespace {
    static SYMBOLS = " \n";

    constructor(symbol) {
        this.symbol = symbol;
    }

    static hasFirst(char) {
        return Whitespace.SYMBOLS.includes(char);
    }

    static parse(input) {
        return new Whitespace(input.next());
    }

    generate() {
        return this.symbol;
    }
}

class Rest {
    constructor(duration) { this.duration = duration; }

    static hasFirst(char) {
        return char === "z";
    }

    static parse(input) {
        assert(Rest.hasFirst(input.next()));
        let duration = Duration.parse(input);
        return new Rest(duration);
    }

    generate() {
        return "z" + this.duration.generate();
    }
}

class Pitch {
    static SYMBOLS = "abcdefgABCDEFG";

    static TONE_MAPPER = {
        "c": 0,
        "d": 2,
        "e": 4,
        "f": 5,
        "g": 7,
        "a": 9,
        "b": 11
    };

    toTone() {
        return Pitch.TONE_MAPPER[this.note] + this.modifier * 12 + 60;
    }

    constructor(note, modifier) {
        this.note = note;
        this.modifier = modifier;
    }

    static hasFirst(char) {
        return Pitch.SYMBOLS.includes(char);
    }

    static parse(input) {
        let note = input.next();
        let modifier = 0;
        if (note === note.toUpperCase()) {
            modifier = -1;
            note = note.toLowerCase();
        }
        return new Pitch(note, modifier);
    }

    generate() {
        let note = this.note;
        if (this.modifier === -1) {
            note = note.toUpperCase();
        }
        return note;
    }
}

class Octave {
    static SYMBOLS = ",'";

    constructor(modifier) {
        this.modifier = modifier;
    }

    static hasFirst(char) {
        return Octave.SYMBOLS.includes(char);
    }

    static parse(input) {
        let modifier = 0;
        while (Octave.hasFirst(input.peek())) {
            if (input.next() === "'") {
                modifier++;
            } else {
                modifier--;
            }
        }
        return new Octave(modifier);
    }
    toTone() {
        return this.modifier * 12;
    }

    generate() {
        let output = "";
        for (let i = 0; i < Math.abs(this.modifier); i++) {
            if (this.modifier > 0) {
                output += "'";
            } else {
                output += ",";
            }
        }
        return output;
    }
}

class Duration {
    constructor(numerator, denominator) {
        assert(gcd(numerator, denominator) === 1);
        this.numerator = numerator;
        this.denominator = denominator;
    }

    static SYMBOLS = "0123456789/";

    static hasFirst(char) {
        return Duration.SYMBOLS.includes(char);
    }

    static readNumber(input) {
        let number = 0;
        const DIGITS = "0123456789";
        while (DIGITS.includes(input.peek())) {
            number = number * 10 + parseInt(input.next());
        }
        return number;
    }

    static parse(input) {
        let numerator = 1;
        let denominator = 8;
        if (input.peek() === "/") {
            assert(input.next() === "/");
            denominator *= Duration.readNumber(input);
        } else if (Duration.hasFirst(input.peek())) {
            numerator *= Duration.readNumber(input);
            if (input.peek() === "/") {
                assert(input.next() === "/");
                denominator *= Duration.readNumber(input);
            }
        }
        let divisor = gcd(numerator, denominator);
        numerator /= divisor;
        denominator /= divisor;
        return new Duration(numerator, denominator);
    }

    generate() {
        let num = this.numerator * 8;
        let den = this.denominator;
        let divisor = gcd(num, den);
        num /= divisor;
        den /= divisor;
        if (num === 1 && den === 1) return "";
        if (num === 1) return "/" + den;
        if (den === 1) return num + "";
        return num + "/" + den;
    }
}

class PartialAccidental {
    static VISUAL_TO_SHIFT = {
        "^": 1,
        "^^": 2,
        "_": -1,
        "__": -2,
        "=": 0,
        "": 0
    };

    isDetermining() {
        return this.visual !== "";
    }

    impliedShift() {
        return PartialAccidental.VISUAL_TO_SHIFT[this.visual];
    }

    constructor(visual) {
        this.visual = visual;
    }

    static SYMBOLS = "^_=";

    static hasFirst(char) {
        return PartialAccidental.SYMBOLS.includes(char);
    }

    static parse(input) {
        if (!PartialAccidental.hasFirst(input.peek())) return new PartialAccidental("");
        let visual = input.next();
        if (PartialAccidental.hasFirst(input.peek())) {
            visual += input.next();
        }
        assert(["^", "^^", "_", "__", "="].includes(visual));
        return new PartialAccidental(visual);
    }
}

class Accidental {
    constructor(partial, note, alterations) {
        this.partial = partial;
        if (this.partial.isDetermining()) {
            this.shift = this.partial.impliedShift();
            alterations[note] = this.shift;
        } else {
            this.shift = alterations[note];
        }
    }

    toTone() {
        return this.shift;
    }

    generate() {
        if (this.partial.isDetermining()) {
            return this.partial.visual;
        }
        return "";
    }
}

const TONE_EXPLORER = [
    [["c", "", 0], ["b", "", -1], ["d", "", 0], ["c", "=", 0]], // DO
    [["c", "", 0], ["d", "", 0], ["b", "", -1], ["c", "^", 0]], // DO#/REb
    [["d", "", 0], ["c", "", 0], ["e", "", 0], ["d", "=", 0]],  // RE
    [["d", "", 0], ["e", "", 0], ["f", "", 0], ["d", "^", 0]],  // RE#/MIb
    [["e", "", 0], ["f", "", 0], ["d", "", 0], ["e", "=", 0]],  // MI
    [["f", "", 0], ["e", "", 0], ["g", "", 0], ["f", "=", 0]],  // FA
    [["f", "", 0], ["g", "", 0], ["e", "", 0], ["f", "^", 0]],  // FA#/SOLb
    [["g", "", 0], ["f", "", 0], ["a", "", 0], ["g", "=", 0]],  // SOL
    [["g", "", 0], ["a", "", 0], ["g", "^", 0]],                // SOL#/LAb
    [["a", "", 0], ["g", "", 0], ["b", "", 0], ["a", "=", 0]],  // LA
    [["a", "", 0], ["b", "", 0], ["c", "", 1], ["a", "^", 0]],  // LA#/SIb
    [["b", "", 0], ["c", "", 1], ["a", "", 0], ["b", "=", 0]]   // SI
];

class Note {
    constructor(pitch, octave, duration, accidental) {
        this.pitch = pitch;
        this.octave = octave;
        this.duration = duration;
        this.accidental = accidental;
        this.data = new Object();
        this.data.tone = this.pitch.toTone() + this.octave.toTone() + this.accidental.toTone();
    }

    static hasFirst(_char) {
        return true;
    }

    static parse(input, alterations) {
        let partial_accidental = PartialAccidental.parse(input);
        assert(Pitch.hasFirst(input.peek()));
        let pitch = Pitch.parse(input);
        let octave = Octave.parse(input);
        let duration = Duration.parse(input);
        let accidental = new Accidental(partial_accidental, pitch.note, alterations);
        return new Note(pitch, octave, duration, accidental);
    }

    generate() {
        return this.accidental.generate() + this.pitch.generate() + this.octave.generate() + this.duration.generate();
    }

    transpose(semitones, alterations) {
        this.data.tone += semitones;
        let tone = this.data.tone % 12;
        let octave = Math.floor(this.data.tone / 12);
        let choices = TONE_EXPLORER[tone];
        for (let choice of choices) {
            let t_pitch = new Pitch(choice[0], 0);
            let t_octave = new Octave(octave + choice[2] - 5);
            let t_p_accidental = new PartialAccidental(choice[1]);
            let t_accidental = new Accidental(t_p_accidental, choice[0], alterations);
            if (t_octave.modifier == -1) {
                t_pitch.modifier = -1;
                t_octave.modifier = 0;
            }
            let t_note_tone = t_pitch.toTone() + t_octave.toTone() + t_accidental.toTone();
            if (t_note_tone === this.data.tone) {
                this.pitch = t_pitch;
                this.octave = t_octave;
                this.accidental = t_accidental;
                break;
            }
        }
    }
}

class Chord {
    constructor(elements, duration) {
        this.elements = elements;
        this.duration = duration;
    }

    static hasFirst(char) {
        return char === "[";
    }

    static parse(input, alterations) {
        assert(Chord.hasFirst(input.next()));
        let elements = new Array();
        while (input.peek() !== "]") {
            let el = null;
            if (Whitespace.hasFirst(input.peek())) {
                el = Whitespace.parse(input);
            } else if (Note.hasFirst(input.peek())) {
                el = Note.parse(input, alterations);
            }
            elements.push(el);
        }
        assert(input.next() === "]");
        let duration = Duration.parse(input);
        return new Chord(elements, duration);
    }

    generate() {
        let output = "[";
        for (let el of this.elements) {
            output += el.generate();
        }
        output += "]" + this.duration.generate();
        return output;
    }

    transpose(semitones, alterations) {
        for (let el of this.elements) {
            if (el instanceof Note) {
                el.transpose(semitones, alterations);
            }
        }
    }
}

class Tuplet {
    static hasFirst(char) {
        return char === "(";
    }

    constructor(elements, n) {
        this.elements = elements;
        this.n = n;
    }

    static parse(input, alterations) {
        assert(Tuplet.hasFirst(input.next()));
        let n = Duration.readNumber(input);
        let elements = new Array();
        let note_counter = 0;
        while (note_counter < n) {
            let el = null;
            if (Whitespace.hasFirst(input.peek())) {
                el = Whitespace.parse(input);
            } else if (Chord.hasFirst(input.peek())) {
                el = Chord.parse(input, alterations);
                note_counter++;
            } else if (Rest.hasFirst(input.peek())) {
                el = Rest.parse(input);
                note_counter++;
            } else if (Note.hasFirst(input.peek())) {
                el = Note.parse(input, alterations);
                note_counter++;
            }
            elements.push(el);
        }
        return new Tuplet(elements, n);
    }

    generate() {
        let output = "(" + this.n;
        for (let el of this.elements) {
            output += el.generate();
        }
        return output;
    }

    transpose(semitones, alterations) {
        for (let el of this.elements) {
            if (el instanceof Note || el instanceof Chord) {
                el.transpose(semitones, alterations);
            }
        }
    }
}

class Bar {
    constructor(elements) {
        this.elements = elements;
    }

    static hasFirst(char) {
        return char === "|";
    }

    static parse(input, globalAlterations) {
        let alterations = structuredClone(globalAlterations);
        assert(Bar.hasFirst(input.next()));
        let elements = new Array();
        while (input.hasNext() && !Bar.hasFirst(input.peek())) {
            let el = null;
            if (Whitespace.hasFirst(input.peek())) {
                el = Whitespace.parse(input);
            } else if (Tuplet.hasFirst(input.peek())) {
                el = Tuplet.parse(input, alterations);
            } else if (Chord.hasFirst(input.peek())) {
                el = Chord.parse(input, alterations);
            } else if (Rest.hasFirst(input.peek())) {
                el = Rest.parse(input);
            } else if (Note.hasFirst(input.peek())) {
                el = Note.parse(input, alterations);
            }
            elements.push(el);
        }
        return new Bar(elements);
    }

    generate() {
        let output = "|";
        for (let el of this.elements) {
            output += el.generate();
        }
        return output;
    }

    transpose(semitones, globalAlterations) {
        let alterations = structuredClone(globalAlterations);
        for (let el of this.elements) {
            if (el instanceof Note || el instanceof Chord || el instanceof Tuplet) {
                el.transpose(semitones, alterations);
            }
        }
    }
}

const C_MAJOR = {
    "a": 0,
    "b": 0,
    "c": 0,
    "d": 0,
    "e": 0,
    "f": 0,
    "g": 0
};

class Score {
    constructor(bars, prefix, suffix, alterations) {
        this.bars = bars;
        this.prefix = prefix;
        this.suffix = suffix;
        this.alterations = alterations;
    }

    static parse(input, alterations = C_MAJOR) {
        let bars = new Array();
        let prefix = new Array();
        let suffix = new Array();
        while (Whitespace.hasFirst(input.peek())) {
            prefix.push(Whitespace.parse(input));
        }
        while (Bar.hasFirst(input.peek())) {
            if (input.allRemainingAfterPeek(Whitespace.hasFirst)) {
                assert(Bar.hasFirst(input.next()));
                break;
            }
            bars.push(Bar.parse(input, alterations));
        }
        while (input.hasNext()) {
            assert(Whitespace.hasFirst(input.peek()));
            suffix.push(Whitespace.parse(input));
        }
        return new Score(bars, prefix, suffix, alterations);
    }

    generate() {
        let output = "";
        for (let el of this.prefix) {
            output += el.generate();
        }
        for (let bar of this.bars) {
            output += bar.generate();
        }
        output += "|";
        for (let el of this.suffix) {
            output += el.generate();
        }
        return output;
    }

    transpose(semitones) {
        for (let bar of this.bars) {
            bar.transpose(semitones, this.alterations);
        }
    }

    extend(score) {
        assert(score instanceof Score);
        for (let key in this.alterations) {
            assert(this.alterations[key] === score.alterations[key]);
        }
        this.bars.push(...score.bars);
        this.suffix = score.suffix;
    }
}

export { Input, Whitespace, Rest, Pitch, Note, Score, Bar, Octave, Accidental, Tuplet, Chord };