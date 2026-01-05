<script setup>
import { onMounted, ref, computed, watch } from 'vue';
import { useCredentials } from '@/stores/credentials';
import { useRouter } from 'vue-router';
import { useRoute } from 'vue-router';
import abcjs from "abcjs";
import { nextTick } from 'vue';
import lodash from 'lodash';
import { Input, Score, Note, Tuplet, Chord } from '@/lib/abcp';
import { KEYS } from '@/lib/keys';
import axios from 'axios';

const isOwner = ref(false);
const route = useRoute();
const credentials = useCredentials();

const router = useRouter();

const client = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    headers: {
        'Authorization': `Bearer ${credentials.token}`
    }
});

const exercise_id = ref(route.params.id);
const exercise_info = ref(null);
const message = ref('');

async function loadExercise() {
    try {
        const response = await client.get(`/exercise/${exercise_id.value}`);
        exercise_info.value = response.data;
    } catch (error) {
        message.value = error?.response?.data ?? 'Load exercise failed';
        console.error('Load exercise error:', error);
    }
}



//Nome dell'esercizio
const exerciseName = ref(null);
//Testo scritto dall'utente
const userText = ref(null);
//Testo renderizzato da abc
const renderedText = ref(null);
//Synth controller
const synth = ref(null);
const isPaused = ref(false); 
const isPlaying = ref(false); 
//Dimensione e posizione della scrollbar
const scrollbarLeft = ref(null);
const scrollbarTop = ref(null);
const scrollbarHeight = ref(null);
//BPM e conversioni tra note e pitch
const bpm = ref(null);
//Step per la generazione delle trasposizioni
const ascendingSteps = ref(null);
const descendingSteps = ref(null);

//Parametri inseriti dall'utente nelle select - C4 e C5 default
const startingNote = ref(null);
const startingOctave = ref(null);
const highestNote = ref(null);
const highestOctave = ref(null);
const lowestNote = ref(null);
const lowestOctave = ref(null);
//Valori in semitoni MIDI delle note selezionate
const startingSemitones = computed(() =>
  inputToSemitones(startingNote.value, startingOctave.value)
);

const highestSemitones = computed(() =>
  inputToSemitones(highestNote.value, highestOctave.value)
);

const lowestSemitones = computed(() =>
  inputToSemitones(lowestNote.value, lowestOctave.value)
);


//Tags e visibilità
const visibility = ref("1")
const allTags = ref([]);
const selectedTags = ref({});
const groupedTags = computed(() => {
  const groups = {};
  allTags.value.forEach(tag => {
    if (!groups[tag.category]) groups[tag.category] = [];
    groups[tag.category].push(tag);
  });
  return groups;
});

//Timer del synth, da resettare a ogni nuovo play
let timer = null; 

// Funzione per ottenere i tag dal backend
async function fetchTags() {
  try {
    const response = await client.get('/tags');
    return response.data;
  } catch (error) {
    console.error('Error fetching tags:', error?.response || error);
    return [];
  }
}

// Funzione per loggare i tag
 async function logTags() {
    allTags.value = await fetchTags();
 }

const groupedExerciseTags = computed(() => {
  if (!exercise_info.value?.tags) return {};
    const groups = {};
      exercise_info.value.tags.forEach(tag => {
        if (!groups[tag.category]) groups[tag.category] = [];
        groups[tag.category].push(tag);
      });

  return groups;
});


onMounted(async () => {
    await loadExercise();
    logTags();
    exerciseName.value = exercise_info.value.name;
    userText.value = exercise_info.value.abc;
    visibility.value = exercise_info.value.is_public;
    bpm.value = exercise_info.value.bpm;
    ascendingSteps.value = exercise_info.value.a_steps;
    descendingSteps.value = exercise_info.value.d_steps;
    startingNote.value = semitonesToInput(exercise_info.value.s_note).n;
    startingOctave.value = semitonesToInput(exercise_info.value.s_note).o;
    highestNote.value = semitonesToInput(exercise_info.value.h_note).n;
    highestOctave.value = semitonesToInput(exercise_info.value.h_note).o;
    lowestNote.value = semitonesToInput(exercise_info.value.l_note).n;
    lowestOctave.value = semitonesToInput(exercise_info.value.l_note).o;
    selectedTags.value = Object.fromEntries(
        exercise_info.value.tags.map(tag => [tag.id, true])
    );
    isOwner.value = credentials.data.id === exercise_info.value.user_id;
    renderScore();
    console.log(groupedExerciseTags.value);
});

watch(
    () => route.params.id,
    async (new_id, _) => {
        exercise_info.value = null;
        exercise_id.value = new_id;
        await loadExercise();
    }
)


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
  userText.value = "X:1\nK:C\n|cdcdz2z2|\n";
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

  isPaused.value = false;
  isPlaying.value = false;

  scrollbarLeft.value = null;
  scrollbarTop.value = null;
  scrollbarHeight.value = null;
}

function pauseSynthAndTimer() {
  if (synth.value) {
    synth.value.pause();
  }
    if (timer) {
    timer.pause();
  }
}

function resumeSynthAndTimer() {
  if (synth.value) {
    synth.value.start();
  }
  if (timer) {
    timer.start();
  }
}


// Fa partire il timer e il synth, e di conseguenza l'audio
function play() {
    stopSynthAndTimer();
    isPlaying.value = true;

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


// Funzione che avvia il timer con le callback per la scrollbar
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
    },
    endCallback: () => {
    isPlaying.value = false; 
    isPaused.value = false;
  }
  });

  synth.value.prime()
    synth.value.start();
    timer.start(synth.value.audioContext);
}


// Funzione che crea un audio buffer, lo converte in WAV, e crea un oggetto scaricabile dal blob
async function downloadWav() {
  if (!renderedText.value) return;

  const tempSynth = new abcjs.synth.CreateSynth();

  await tempSynth.init({
    visualObj: renderedText.value[0],
    options: { qpm: bpm.value }
  });

  await tempSynth.prime();

  const audioBuffer = tempSynth.getAudioBuffer();

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



// Funzione che crea un SVG e lo rende scaricabile
function downloadSvg() {
  const svgElement = document.querySelector("#target svg");
  if (!svgElement) return;

  const svgData = new XMLSerializer().serializeToString(svgElement);

  const blob = new Blob([svgData], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "spartito.svg";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  URL.revokeObjectURL(url);
}

// Trasforma una nota e ottava in semitoni MIDI
function inputToSemitones(note, octave) {
  return (parseInt(octave)) * 12 + parseInt(note);
}

function semitonesToInput(semitones) {
  const octaveNum = Math.floor(semitones / 12);
  const noteIndex = ((semitones % 12) + 12) % 12;

  return {
    n: noteIndex,
    o: octaveNum
  };
}



// Calcola la differenza di semitoni tra due note
function getSemitoneDifference(note1, note2) {
  if (note1 === null || note2 === null) return null;

  return (note2 - note1);
}


// Separa header e corpo del testo abc
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

function transposeAndRender() {
  isPaused.value = false;
  // Splitta l'abc in header e body, trova la chiave
  const { header, body } = splitAbcHeaderBody(userText.value);
  const key = getSheetKey(header);

  // Crea l'input e lo score
  let input = new Input(body);
  let score = Score.parse(input, KEYS[key.toUpperCase()]);

  // Trova la prima nota
  let first_note = null;
  let highest_note = 0;
  let lowest_note = 1000;
  for(let bar of score.bars) {
    for(let element of bar.elements) {
      if(element instanceof Note) {
        if(first_note === null) {
          first_note = element.data.tone;
        }
        highest_note = Math.max(highest_note, element.data.tone);
        lowest_note = Math.min(lowest_note, element.data.tone);
      } else if(element instanceof Tuplet || element instanceof Chord) {
        for(let se of element.elements) {
          if(se instanceof Note) {
            if(first_note === null) {
              first_note = se.data.tone;
            }
            highest_note = Math.max(highest_note, se.data.tone);
            lowest_note = Math.min(lowest_note, se.data.tone);
          }
        }
      }
    }
  }

  // Calcola l'intervallo di semitoni di partenza
  startingSemitones.value = inputToSemitones(startingNote.value, startingOctave.value);
  const startingInterval = getSemitoneDifference(
    first_note,
    startingSemitones.value
  );

  // Traspone lo score alla nota di partenza
  score.transpose(startingInterval);

  // Calcola l'intervallo di semitoni per la nota più alta
  highestSemitones.value = inputToSemitones(highestNote.value, highestOctave.value);
  const highestInterval = getSemitoneDifference(
    highest_note + startingInterval,
    highestSemitones.value
  );

  // Traspone lo score fino alla nota più alta
  let acc = lodash.cloneDeep(score);
  let current = ascendingSteps.value;

  for(let i = 1; i <= highestInterval; i+=ascendingSteps.value) {
    let tmp_score = lodash.cloneDeep(score);
    tmp_score.transpose(current);
    acc.extend(tmp_score);

    current += ascendingSteps.value;
  }

  // Calcola l'intervallo di semitoni per la nota più bassa
  lowestSemitones.value = inputToSemitones(lowestNote.value, lowestOctave.value);
  const lowestInterval = getSemitoneDifference(
    lowest_note + startingInterval,
    lowestSemitones.value
  );

  // Traspone lo score fino alla nota più bassa
  current = -descendingSteps.value;
  for(let i = highestInterval - 1; i >= lowestInterval; i-=descendingSteps.value) {
    let tmp_score = lodash.cloneDeep(score);
    tmp_score.transpose(i);
    acc.extend(tmp_score);
    current -= descendingSteps.value;
  }

  userText.value = header + "\n" + acc.generate();
  renderScore();
}


// Funzione che mette in pausa o riprende il synth e il timer
function togglePause() {
  if (isPaused.value) {
    resumeSynthAndTimer();
  } else {
    pauseSynthAndTimer();
  }
  isPaused.value = !isPaused.value;
}

</script>

<template>
  <main>
    <div id="page">
      <h1>VoiceWorm</h1>
      <fieldset>
      <legend>Exercise Name</legend>
      <div v-if="!isOwner"><p class="readonly-name">{{ exerciseName }}</p></div>
      <input v-else type="text" id="exerciseName" class="text" v-model="exerciseName"/>
    </fieldset>

      <fieldset>
      <legend>Input ABC Notation</legend>
      <textarea id="exerciseInput" class="text" v-model="userText"></textarea>
      <br>
      <button type="button" @click="renderScore">Enter</button>
    </fieldset>
    <fieldset>
    <legend>Tempo and Steps</legend>
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
    </div>

    <div id="step-control">
        <div id="ascending-step">
        <label for="ascending_steps">Ascending steps: </label>
        <select v-model.number="ascendingSteps" name="ascending_steps" id="ascending_steps">
          <option v-for="n in 6" :key="n" :value="n">{{ n }}</option>
        </select>
        </div>
        <div id="descending_step">
        <label for="descending_steps">Descending steps: </label>
        <select v-model.number="descendingSteps" name="descending_steps" id="descending_steps">
          <option v-for="n in 6" :key="n" :value="n">{{ n }}</option>
        </select>
      </div>
    </div>
    </fieldset>

<fieldset>
    <legend>Transposition Range</legend>
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

 <div id="lowest-control">
    <label for="lowest_note">Lowest note: </label>
    <select v-model="lowestNote" name="lowest_note" id="lowest_note">
      <option value="0" >C</option>
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
      <label for="lowest-octave"></label>
    <select  v-model="lowestOctave" name="lowest-octave" id="lowest-octave">
      <option value="1">1</option>
      <option value="2">2</option>
      <option value="3" selected>3</option>
      <option value="4">4</option>
      <option value="5">5</option>
      <option value="6">6</option>
      <option value="7">7</option>
    </select>
</div>
</fieldset>

<fieldset>
      <legend>Actions</legend>
      <div id="buttons">
        <button type="button" @click="transposeAndRender">Generate</button>
        <button type="button" @click="resetToDefault">Reset</button>
        <button type="button" @click="play">Play</button>
        <button :disabled="!isPlaying" @click="togglePause">{{ isPaused ? 'Resume' : 'Pause' }}</button>
        <button type="button" @click="downloadWav">Save WAV</button>
        <button type="button" @click="downloadSvg">Save SVG</button>
      </div>
</fieldset>

<fieldset>
    <legend>Rendered Score</legend>
    <div id="container">
      <div id="target"></div>
      <div id="scrollbar" v-if="scrollbarLeft!==null && scrollbarHeight!==null && scrollbarTop!==null" :style="{ left: scrollbarLeft + 'px', top: scrollbarTop + 'px', height: scrollbarHeight + 'px'}"></div>
    </div>
</fieldset>

    <fieldset>
        <legend>Tags</legend>
        <fieldset v-if="isOwner" v-for="(tags, category) in groupedTags" :key="category" class="tag-group">
            <legend>{{ category }}</legend>
            <div v-for="tag in tags" :key="tag.id" class="tag-label"><input type="checkbox" v-model="selectedTags[tag.id]"/>{{ tag.label }}</div>
        </fieldset>
        
      <div v-else>
        <div v-if="exercise_info?.tags?.length > 0">
          <fieldset v-for="(tags, category) in groupedExerciseTags" :key="category" class="tag-group">
            <legend>{{ category }}</legend>
            <div v-for="tag in tags" :key="tag.id" class="tag-label">{{ tag.label }}</div>
          </fieldset>
        </div>
        <div v-else>
          <p>No tags</p>
        </div>
      </div>



    </fieldset>


    <fieldset v-if="isOwner">
      <legend>Visibility</legend>

      <div id="visibility">
      <input
        type="radio"
        id="public"
        :value="1"
        v-model="visibility"
      />
      <label for="public">Public</label>

      <input
        type="radio"
        id="private"
        :value="0"
        v-model="visibility"
      />
      <label for="private">Private</label>
      </div>

      <div>
      <button id="submit-button" @click="submitExercise">Submit Exercise</button>
        </div>
    </fieldset>

    </div> 
  </main>
</template>


<style scoped>

fieldset {
  padding: 20px;
  width: 100%;
}

.text {
  width: 50%;
}

#starting-control, #highest-control, #lowest-control, #step-control, #visibility, #bpm-control, #buttons {
  padding: 10px;
}

#submit-button {
  margin-left: 10px;
}

#ascending-step, #descending_step {
  display: inline-block;
  margin-right: 20px;
}

#buttons {
  display: grid;
  grid-template-columns: repeat(2, auto);
  gap: 12px;
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

.readonly-name {
  margin: 0;
  padding: 0;
}


</style>