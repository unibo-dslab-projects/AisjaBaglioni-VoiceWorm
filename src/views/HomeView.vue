<script setup>
import { onMounted, ref, render } from 'vue';
import abcjs from "abcjs";
import { transposeABC } from 'abc-notation-transposition';
import { nextTick } from 'vue';
import { computed } from 'vue';

const userText = ref("X:1\nK:Bb\ncdcd|\n");
const renderedText = ref(null);
const synth = ref(null);
const scrollbarLeft = ref(null);
const scrollbarTop = ref(null);
const scrollbarHeight = ref(null);
const bpm = ref(120);
const NOTE_TO_SEMITONE = {
  "C": 0,
  "D": 2,
  "E": 4,
  "F": 5,
  "G": 7,
  "A": 9,
  "B": 11
};

const startingNote = ref(0);
const startingOctave = ref(4);
const highestNote = ref(0);
const highestOctave = ref(5);
let timer = null; 

onMounted(() => {
  renderScore();
});

// Renderizza lo spartito all'avvio o quando premuto enter
function renderScore() {
  var options = {add_classes: true, selectTypes: true, staffwidth: 740, wrap: {minSpacing: 1.8, maxSpacing: 2.7, preferredMeasuresPerLine: 6 }};
  renderedText.value = abcjs.renderAbc("target", userText.value, options);
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
}


//Nota più alta iniziale
function getHighestNote(baseAbc) {
  const visualObj = abcjs.renderAbc("*", baseAbc)[0];
  const note_pitches = visualObj.lines[0].staff[0].voices[0];
  const note_names = new Array();
  const note_values = new Array();

  for (let pitch of note_pitches) {
    if (pitch.pitches){
      note_names.push(pitch.pitches[0].name)
      note_values.push(noteToMidi(pitch.pitches[0].name))
    }
  }
  
  return Math.max(...note_values);
}

function getFirstNote() {
  const visualObj = (renderedText.value)[0];
  const note_object = visualObj.lines[0].staff[0].voices[0][0]
  let note_name = note_object.pitches[0].name;
  return note_name;
}

//c è 5, C è su 4 -> , abbassano di 1 ottava -> ' alzano di un'ottava -> dopo la nota
//^ -> diesis, ^^-> doppio diesis -> _ -> bemolle -> __ doppio bemolle -> = bequadro -> prima della nota
function noteToMidi(noteString) {
  let idx = 0;
  const modSymbols = {
    "^": 1,
    "_": -1,
    "=": 0
  };
  let semitoneOffset = 0;
  while (idx < noteString.length && modSymbols[noteString[idx]] !== undefined) {
    semitoneOffset += modSymbols[noteString[idx]];
    idx++;
  }
  if (idx >= noteString.length) return null;
  let note = noteString[idx++];
  let octave = null;
  if (note.toUpperCase() == note) {
    octave = 4;
  } else {
    octave = 5;
  }
  note = note.toUpperCase();
  semitoneOffset += NOTE_TO_SEMITONE[note];
  const octaveSymbols = {
    ",": -1,
    "'": 1
  };
  while (idx < noteString.length && octaveSymbols[noteString[idx]] !== undefined) {
    octave += octaveSymbols[noteString[idx]];
    idx++;
  }
  return (octave + 1) * 12 + semitoneOffset;
}

function inputToMidi(note, octave) {
  return (parseInt(octave) + 1) * 12 + parseInt(note);
}

function getSemitoneDifference(note1, note2) {
  if (note1 === null || note2 === null) return null;

  return (note2 - note1);
}


// Questa funzionerà quando funzionerà il resto
function transposeAndRender() {
  const startingInterval = getSemitoneDifference(noteToMidi(getFirstNote()), inputToMidi(startingNote.value, startingOctave.value));
  const baseAbc = transposeABC(userText.value, startingInterval);
  console.log(baseAbc);
  var concatenedAbc = baseAbc;
  const highestInterval = getSemitoneDifference(getHighestNote(baseAbc), inputToMidi(highestNote.value, highestOctave.value));
  for (let i = 0; i < highestInterval; i++) {
    var newPiece = transposeABC(baseAbc, i+1);
    concatenedAbc += newPiece;
  }
  userText.value = concatenedAbc;
  renderScore();
}

</script>

<template>
  <main>
    <div id="page">
      <h1>VoiceWorm</h1>
      <textarea class="text" v-model="userText"></textarea> <br>
      <div id="buttons">
        <button type="button" @click="renderScore">Enter</button>
        <button type="button" @click="transposeAndRender">Generate</button>
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

    <div id="starting-control">
    <label for="starting_note">Starting note: </label>
    <select v-model="startingNote" name="starting_note" id="notes">
      <option value="0">C</option>
      <option value="1">C#/Db</option>
      <option value="2">D</option>
      <option value="3">D#/Eb</option>
      <option value="4">E</option>
      <option value="5">F</option>
      <option value="6">F#/Gb</option>
      <option value="7">G</option>
      <option value="8">G#/Ab</option>
      <option value="9">A</option>
      <option value="10">A#/Bb</option>
      <option value="11">B</option>
    </select>
      <label for="octaves"></label>
    <select  v-model="startingOctave" name="octaves" id="octaves">
      <option value="1">1</option>
      <option value="2">2</option>
      <option value="3">3</option>
      <option value="4" selected>4</option>
      <option value="5">5</option>
      <option value="6">6</option>
      <option value="7">7</option>
    </select>
  <!--<label>Highest note: <input v-model="highNote" type="text" maxlength="2" /></label>
  <label>Lowest note: <input v-model="lowNote" type="text" maxlength="2" /></label>-->
</div>

    <div id="highest-control">
    <label for="highest_note">Highest note: </label>
    <select v-model="highestNote" name="highest_note" id="notes">
      <option value="0">C</option>
      <option value="1">C#/Db</option>
      <option value="2">D</option>
      <option value="3">D#/Eb</option>
      <option value="4">E</option>
      <option value="5">F</option>
      <option value="6">F#/Gb</option>
      <option value="7">G</option>
      <option value="8">G#/Ab</option>
      <option value="9">A</option>
      <option value="10">A#/Bb</option>
      <option value="11">B</option>
    </select>
      <label for="highest-octave"></label>
    <select  v-model="highestOctave" name="highest-octave" id="octaves">
      <option value="1">1</option>
      <option value="2">2</option>
      <option value="3">3</option>
      <option value="4">4</option>
      <option value="5" selected>5</option>
      <option value="6">6</option>
      <option value="7">7</option>
    </select>
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

#starting-control, #highest-control {
  padding: 10px;
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