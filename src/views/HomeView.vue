<script setup>
import { onMounted, ref } from 'vue';
import abcjs from "abcjs";
import { transposeABC } from 'abc-notation-transposition';
import { nextTick } from 'vue';
import { computed } from 'vue';

const userText = ref("X:1\nT:Example\nK:Bb\nCDCD|\n");
const renderedText = ref(null);
const synth = ref(null);
const scrollbarLeft = ref(null);
const scrollbarTop = ref(null);
const scrollbarHeight = ref(null);
const bpm = ref(120);
const startNote = ref("C4");
const NOTE_TO_SEMITONE = {
  "C": 0,
  "C#": 1, "Db": 1,
  "D": 2,
  "D#": 3, "Eb": 3,
  "E": 4,
  "F": 5,
  "F#": 6, "Gb": 6,
  "G": 7,
  "G#": 8, "Ab": 8,
  "A": 9,
  "A#": 10, "Bb": 10,
  "B": 11
};

let timer = null; 

onMounted(() => {
  renderScore();
});

// Renderizza lo spartito all'avvio o quando premuto enter
function renderScore() {
  var options = {add_classes: true, selectTypes: true, staffwidth: 740, wrap: {minSpacing: 1.8, maxSpacing: 2.7, preferredMeasuresPerLine: 6 }};
  renderedText.value = abcjs.renderAbc("target", userText.value, options);
  console.log("Prima nota " + getFirstNote());
  //console.log(renderedText.value[0])
}

// Fa partire il timer e il synth, e di conseguenza l'audio
async function play() {
  if (synth.value) {
    synth.value.stop();
    timer.stop();
  }
  synth.value = new abcjs.synth.CreateSynth();
  const visualObj = renderedText.value[0];

  timer = new abcjs.TimingCallbacks(visualObj, {
    qpm: bpm.value,
eventCallback: ev => {
  if (ev && ev.left !== undefined) {
    nextTick(() => {
      scrollbarLeft.value = Math.round(ev.left);
      scrollbarTop.value = Math.round(ev.top);
      scrollbarHeight.value = Math.round(ev.height);
    });
  }
}
  });
  
  await synth.value.init({
    visualObj: renderedText.value[0],
    options: {
      qpm: bpm.value,
      timingCallbacks: timer
    }
  });

  synth.value.prime();
  synth.value.start();

  timer.start(synth.value.audioContext);

    console.log("Nuova nota di partenza " + startNote);
    console.log("Differenza in semitoni:", getSemitoneDifference());

}

function getFirstNote() {
  const visualObj = (renderedText.value)[0];
  const note_object = visualObj.lines[0].staff[0].voices[0][0]
  let note_name = note_object.pitches[0].name.toUpperCase();
  const note_pitch = note_object.pitches[0].pitch;
  const note_octave = 4 + Math.floor((note_pitch) / 12); 
  const note_accidental = note_object.pitches[0].accidental;
  let accidental_symbol = "";
  if (note_accidental === "sharp") {
    note_name = note_name.slice(1);
    accidental_symbol = "♯";
  } else if (note_accidental === "flat") {
    note_name = note_name.slice(1);
    accidental_symbol = "♭";
  } else if (note_accidental === "dblsharp") {
    note_name = note_name.slice(1);
    accidental_symbol = "𝄪";
  } else if (note_accidental === "dblflat") {
    note_name = note_name.slice(1);
    accidental_symbol = "𝄫";
  } else if (note_accidental === "natural") {
    accidental_symbol = "♮";
  }
  const note_string = ""+note_name +accidental_symbol+note_octave;
  return note_string;
}

function noteToMidi(noteString) {
  const match = noteString.match(/^([A-Ga-g])([#b♯♭]?)(\d+)$/);
  if (!match) return null;

  let [, letter, accidental, octave] = match;
  letter = letter.toUpperCase();
  octave = parseInt(octave);

  if (accidental === "♯") accidental = "#";
  if (accidental === "♭") accidental = "b";

  const semitone = NOTE_TO_SEMITONE[letter + (accidental || "")];
  return (octave + 1) * 12 + semitone;
}

function getSemitoneDifference() {
  const firstNote = getFirstNote();
  const firstMidi = noteToMidi(firstNote);
  const startMidi = noteToMidi(startNote.value);

  if (firstMidi === null || startMidi === null) return null;

  if (firstMidi > startMidi) {
    return -(firstMidi-startMidi)
  } else {
    return (startMidi - firstMidi)
  }
}

// funzione per trasporre e renderizzare
function transposeAndRender() {
  const interval = getSemitoneDifference();
  if (interval === null) {
    console.warn("Impossibile calcolare differenza in semitoni.");
    return;
  }

  console.log("Intervallo da trasporre:", interval);

  // trasponi il testo ABC
  const transposedNotation = transposeABC(userText.value, interval);

  // aggiorna il testo e renderizza
  userText.value = transposedNotation;

  const options = {
    add_classes: true,
    selectTypes: true,
    staffwidth: 740,
    wrap: { minSpacing: 1.8, maxSpacing: 2.7, preferredMeasuresPerLine: 6 }
  };

  renderedText.value = abcjs.renderAbc("target", userText.value, options);

  console.log("Prima nota trasposta:", getFirstNote());
}



</script>

<template>
  <main>
    <div id="page">
      <h1>VoiceWorm</h1>
      <textarea class="text" v-model="userText"></textarea> <br>
      <div id="buttons">
        <button type="button" @click="transposeAndRender">Enter</button>
        <button type="button" @click="play">Play</button>
      </div>
      <div id="bpm-control">
        <label for="bpm">BPM: </label>
        <input
      id="bpm"
      type="number"
      v-model.number="bpm"
      min="1"
      max="300"
      step="1"
      @input="bpm = Math.floor(bpm)"
    />
    <input
      type="range"
      v-model.number="bpm"
      min="1"
      max="300"
      step="1"
    />

    <div id="transpose-control">
  <label>Starting note: <input v-model="startNote" type="text" maxlength="2" /></label>
  <!--<label>Highest note: <input v-model="highNote" type="text" maxlength="2" /></label>
  <label>Lowest note: <input v-model="lowNote" type="text" maxlength="2" /></label>-->
</div>

      </div>
    <div id="container">
      <div id="target"></div>
      <div id="scrollbar" v-if="scrollbarLeft!==null && scrollbarHeight!==null && scrollbarTop!==null" :style="{ left: scrollbarLeft + 'px', top: scrollbarTop + 'px', height: scrollbarHeight + 'px'}"></div>
    </div>
  </div>

  </main>
</template>


<style scoped>

.text {
  width: 50%;
  height: 100px;
}

#transpose-control {
  padding: 20px;
}

#bpm-control {
  padding: 20px;
}

#buttons {
  display: flex;
  gap: 20px;
  margin: 0;
}

#page {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100vh;  
}

#container {
  margin: 10px;
  position: relative;
  width: fit-content;
  min-height: 50px;
  border: 1px solid #ddd;
  background-color: white;
}

#scrollbar {
  position: absolute;
  width: 2px;
  background-color: rgba(255, 0, 0, 0.7);
  transition: all 50ms linear;
  left: 10px;
  z-index: 10;
}
</style>