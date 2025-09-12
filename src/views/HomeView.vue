<script setup>
import { onMounted, ref } from 'vue';
import abcjs from "abcjs";
import { transposeABC } from 'abc-notation-transposition';
import { nextTick } from 'vue';

//Testo scritto dall'utente
const userText = ref("X:1\nK:D\ncdcdz2z2|\n");
//Testo renderizzato da abc
const renderedText = ref(null);
//Synth controller
const synth = ref(null);
//Dimensione e posizione della scrollbar
const scrollbarLeft = ref(null);
const scrollbarTop = ref(null);
const scrollbarHeight = ref(null);
//BPM e conversioni tra note e pitch
const bpm = ref(120);
const NOTE_REGEX = /[\^_=]*[A-Ga-g][,']*/g;
const NOTE_TO_SEMITONE = {
  "C": 0,
  "^C": 1,
  "D": 2,
  "^D": 3,
  "E": 4,
  "F": 5,
  "^F": 6,
  "G": 7,
  "^G": 8,
  "A": 9,
  "^A": 10,
  "B": 11
};

const SEMITONE_TO_NOTE = {
  0: "C",
  1: "^C",
  2: "D",
  3: "^D",
  4: "E",
  5: "F",
  6: "^F",
  7: "G",
  8: "^G",
  9: "A",
  10: "^A",
  11: "B"
}

//Parametri inseriti dall'utente nelle select - C4 e C5 default
const startingNote = ref(0);
const startingOctave = ref(4);
const highestNote = ref(0);
const highestOctave = ref(5);

//Timer del synth, da resettare a ogni nuovo play
let timer = null; 

onMounted(() => {
  renderScore();
});

// Renderizza lo spartito all'avvio o quando richiesto
async function renderScore() {
  stopSynthAndTimer();

  var options = {
    add_classes: true,
    selectTypes: true,
    staffwidth: 740,
    wrap: { minSpacing: 1.8, maxSpacing: 2.7, preferredMeasuresPerLine: 6 }
  };

  renderedText.value = abcjs.renderAbc("target", userText.value, options);

  if (synth.value) {
    synth.value.stop();
  }
  
  synth.value = new abcjs.synth.CreateSynth();
  const visualObj = renderedText.value[0];

  await synth.value.init({
    visualObj: visualObj,
    options: { qpm: bpm.value }
  });

}

// Reset dello spartito
function resetToDefault() {
  stopSynthAndTimer();
  userText.value = "X:1\nK:D\ncdcdz2z2|\n";
  renderScore();
}

// Funzione che ferma il synth e il timer, e resetta la scrollbar
function stopSynthAndTimer() {
  if (synth.value) {
    synth.value.stop();
  }
  if (timer) {
    timer.stop();
    timer = null;
  }
  scrollbarLeft.value = null;
  scrollbarTop.value = null;
  scrollbarHeight.value = null;
}


// Fa partire il timer e il synth, e di conseguenza l'audio
function play() {
  if (!renderedText.value) return;
  
  if (!synth.value) {
    synth.value = new abcjs.synth.CreateSynth();
  }

  const visualObj = renderedText.value[0];

  if (!synth.value.isInitialized) {
    synth.value.init({
      visualObj,
      options: { qpm: bpm.value }
    }).then(() => {
      synth.value.prime().then(() => {
        startTimingCallbacks(visualObj);
      });
    });
  } else {

    if (timer) timer.stop();
    startTimingCallbacks(visualObj);
  }
}

function startTimingCallbacks(visualObj) {
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

  synth.value.prime()
    synth.value.start();
    timer.start(synth.value.audioContext);
}



async function downloadWav() {
  if (!renderedText.value) return;

  // Creo un synth temporaneo separato
  const tempSynth = new abcjs.synth.CreateSynth();

  // Inizializza con il BPM corrente
  await tempSynth.init({
    visualObj: renderedText.value[0],
    options: { qpm: bpm.value }
  });

  await tempSynth.prime(); // Calcola buffer audio

  const audioBuffer = tempSynth.getAudioBuffer();

  // Funzione per convertire AudioBuffer in WAV (stessa di prima)
  function bufferToWave(abuffer) {
    const numOfChan = abuffer.numberOfChannels;
    const length = abuffer.length * numOfChan * 2 + 44;
    const buffer = new ArrayBuffer(length);
    const view = new DataView(buffer);

    let offset = 0;
    function writeString(s) {
      for (let i = 0; i < s.length; i++) view.setUint8(offset++, s.charCodeAt(i));
    }

    const write16 = (data) => { view.setInt16(offset, data, true); offset += 2; };
    const write32 = (data) => { view.setUint32(offset, data, true); offset += 4; };

    writeString('RIFF'); write32(length - 8); writeString('WAVE');
    writeString('fmt '); write32(16); write16(1); write16(numOfChan);
    write32(abuffer.sampleRate); write32(abuffer.sampleRate * numOfChan * 2);
    write16(numOfChan * 2); write16(16);
    writeString('data'); write32(abuffer.length * numOfChan * 2);

    for (let i = 0; i < abuffer.length; i++)
      for (let channel = 0; channel < numOfChan; channel++) {
        let sample = abuffer.getChannelData(channel)[i];
        sample = Math.max(-1, Math.min(1, sample));
        write16(sample < 0 ? sample * 0x8000 : sample * 0x7FFF);
      }

    return new Blob([buffer], { type: 'audio/wav' });
  }

  const wavBlob = bufferToWave(audioBuffer);

  const url = URL.createObjectURL(wavBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'exercise.wav';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}



function downloadSvg() {
  const svgElement = document.querySelector("#target svg");
  if (!svgElement) return;

  // Serializza l'SVG in stringa
  const svgData = new XMLSerializer().serializeToString(svgElement);

  // Crea un Blob e un URL temporaneo
  const blob = new Blob([svgData], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);

  // Crea un link per il download
  const a = document.createElement("a");
  a.href = url;
  a.download = "spartito.svg";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  URL.revokeObjectURL(url);
}




// Nota più alta dello spartito utente
function getHighestNote(baseAbc) {
  const visualObj = abcjs.renderAbc("*", baseAbc)[0];
  const note_pitches = visualObj.lines[0].staff[0].voices[0];
  const note_names = new Array();
  const note_values = new Array();

  for (let pitch of note_pitches) {
    if (pitch.pitches){
      note_names.push(pitch.pitches[0].name)
      note_values.push(noteToSemitones(pitch.pitches[0].name))
    }
  }
  
  return Math.max(...note_values);
}

// Prima nota dello spartito utente
function getFirstNote() {
  const visualObj = (renderedText.value)[0];
  const note_object = visualObj.lines[0].staff[0].voices[0][0]
  let note_name = note_object.pitches[0].name;
  return note_name;
}

//c è 5, C è su 4 -> , abbassano di 1 ottava -> ' alzano di un'ottava -> dopo la nota
//^ -> diesis, ^^-> doppio diesis -> _ -> bemolle -> __ doppio bemolle -> = bequadro -> prima della nota
//Dalla nota, estrae il corrispondente semitono MIDI
function noteToSemitones(noteString) {
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

//Trasforma l'input delle select in semitoni MIDI
function inputToSemitones(note, octave) {
  return (parseInt(octave) + 1) * 12 + parseInt(note);
}

//Calcola la differenza di semitoni
function getSemitoneDifference(note1, note2) {
  if (note1 === null || note2 === null) return null;

  return (note2 - note1);
}

//Trova la stringa della nota a partire dal numero dei semitoni
function semitonesToNote(semitones) {
  let octave = (semitones / 12 | 0) - 5;
  let pitch = semitones % 12;
  let note = SEMITONE_TO_NOTE[pitch];
  let modifiedNote = note;
  if (octave < 0) {
    for (let i = 0; i < Math.abs(octave); i++){
      modifiedNote+=",";
    }
  } else if (octave == 1){
    modifiedNote = note.toLowerCase();
  } else if (octave > 1) {
    modifiedNote = note.toLowerCase();
    for (let i = 1; i < Math.abs(octave); i++){
      modifiedNote+="'";
    }
  }
  return modifiedNote;
}

//Trasforma una nota in notazione standard
function abcNoteToStandard(noteString) {
  const match = noteString.match(/^([_=^_]*)([a-gA-G])/);
  if (!match) return null;

  let [, accidental, letter] = match;
  letter = letter.toUpperCase();

  let result = letter;
  if (accidental.includes("^")) {
    result += "#".repeat(accidental.length); // ^, ^^ ecc.
  } else if (accidental.includes("_")) {
    result += "b".repeat(accidental.length); // _, __ ecc.
  }
  return result;
}


// Separa header e corpo del testo
function splitAbcHeaderBody(abcString) {
  const lines = abcString.split("\n");
  const header = [];
  const body = [];

  let isBody = false;
  for (let line of lines) {
    if (line.startsWith("K:")) {
      header.push(line);
      isBody = true;
    } else if (!isBody) {
      header.push(line);
    } else {
      body.push(line);
    }
  }
  return { header: header.join("\n"), body: body.join("\n") };
}

//Ottiene la chiave dall'header
function getSheetKey(header) {
  const match = header.match(/^K:([^\s]+)/m);
  return match ? match[1] : null;
}


//Traspone una nota
function transposeNote(noteString, step, key) {
  const midi = noteToSemitones(noteString);
  if (midi === null) return noteString; 
  let newMidi = midi + step;
  return semitonesToNote(newMidi);
}


//Traspone una stringa
function transposeBody(string, step, key) {
return string.replace(NOTE_REGEX, match => transposeNote(match, step, key));
}

//Concatena le stringhe per generare un nuovo spartito
function transposeAndRender() {
  const startingInterval = getSemitoneDifference(noteToSemitones(getFirstNote()), inputToSemitones(startingNote.value, startingOctave.value));
  const startingABC = transposeABC(userText.value, startingInterval); // Ritorna una stringa comprensiva della nuova chiave
  const { header, body } = splitAbcHeaderBody(startingABC);
  const key = getSheetKey(header);
  const highestInterval = getSemitoneDifference(getHighestNote(startingABC), inputToSemitones(highestNote.value, highestOctave.value));
  let concatenedAbc = startingABC;
  for (let i = 0; i < highestInterval; i++) {
    let newPiece = transposeBody(body, i+1, key);
    concatenedAbc += newPiece;
  }
  userText.value = concatenedAbc;
  renderScore();
}

//ABANDONED
// Sta creando un nuovo brano a ogni trasposizione
// Deve invece concatenare delle stringhe su un unico brano
// Devo avere una funzione parser che mi aumenti i semitoni sulla base della grammatica interna di abcNotation
// NON CANCELLARE
/*function transposeAndRender1() {
  const startingInterval = getSemitoneDifference(noteToSemitones(getFirstNote()), inputToSemitones(startingNote.value, startingOctave.value));
  const baseAbc = transposeABC(userText.value, startingInterval);
  var concatenedAbc = baseAbc;
  const highestInterval = getSemitoneDifference(getHighestNote(baseAbc), inputToSemitones(highestNote.value, highestOctave.value));
  for (let i = 0; i < highestInterval; i++) {
    var newPiece = transposeABC(baseAbc, i+1);
    concatenedAbc += newPiece;
  }
  userText.value = concatenedAbc;
  renderScore();
}*/

</script>

<template>
  <main>
    <div id="page">
      <h1>VoiceWorm</h1>
      <textarea id="exerciseInput" class="text" v-model="userText"></textarea> <br>
      <div id="buttons">
        <button type="button" @click="renderScore">Enter</button>
        <button type="button" @click="transposeAndRender">Generate</button>
        <button type="button" @click="play">Play</button>
        <button type="button" @click="resetToDefault">Reset</button>
        <button type="button" @click="downloadWav">Save WAV</button>
        <button type="button" @click="downloadSvg">Save SVG</button>
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
    <select v-model="startingNote" name="starting_note" id="starting_note">
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
    <select v-model="highestNote" name="highest_note" id="highest_note">
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
    <select  v-model="highestOctave" name="highest-octave" id="highest-octave">
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