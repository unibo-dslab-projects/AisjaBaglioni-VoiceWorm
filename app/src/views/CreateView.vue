<script setup>
import { onMounted, ref, computed } from 'vue';
import { useCredentials } from '@/stores/credentials';
import { useRouter } from 'vue-router';
import abcjs from "abcjs";
import { nextTick } from 'vue';
import lodash from 'lodash';
import { Input, Score, Note, Tuplet, Chord } from '@/lib/abcp';
import { KEYS } from '@/lib/keys';
import axios from 'axios';
import Header from '@/components/Header.vue';
import Footer from '@/components/Footer.vue';

const credentials = useCredentials();
const router = useRouter();

const client = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    headers: {
        'Authorization': `Bearer ${credentials.token}`
    }
});

//Nome dell'esercizio
const exerciseName = ref("Choose a significant name");
//Testo scritto dall'utente
const userText = ref("X:1\nK:C\n|[ceg]z2cdcd|\n");
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
const bpm = ref(85);
//Step per la generazione delle trasposizioni
const ascendingSteps = ref(1);
const descendingSteps = ref(1);

//Parametri inseriti dall'utente nelle select - C4 e C5 default
const startingNote = ref(0);
const startingOctave = ref(4);
const highestNote = ref(0);
const highestOctave = ref(5);
const lowestNote = ref(0);
const lowestOctave = ref(3);

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

const message = ref('');


// Funzione per inviare l'esercizio al backend
async function submitExercise() {
  try {
    await client.post('/exercises', {
      name: exerciseName.value,
      abc: userText.value,
      is_public: Number(visibility.value),
      bpm: bpm.value,
      a_steps: ascendingSteps.value,
      d_steps: descendingSteps.value,
      s_note: startingSemitones.value,
      h_note: highestSemitones.value,
      l_note: lowestSemitones.value,
      tag_ids: Object.keys(selectedTags.value)
        .filter(tagID => selectedTags.value[tagID])
    });
    router.push('/');
  } catch (error) {
    message.value = error?.response?.data ?? 'Submit exercise failed';
    console.error('Submit exercise error:', error);
  }
}


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

onMounted(() => {
    renderScore();
    logTags();
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
  userText.value = "X:1\nK:C\n|[ceg]z2cdcd|\n";
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
  const startingInterval = getSemitoneDifference(
    first_note,
    startingSemitones.value
  );

  // Traspone lo score alla nota di partenza
  score.transpose(startingInterval);

  // Calcola l'intervallo di semitoni per la nota più alta
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
    <Header/>
    <div class="page">
    <div class="page-title">
      <h1>Create a new exercise</h1>
      <div class="title-underline"></div>
    </div>

      <div class="form-section">
        <label class="form-label" for="exercise-name">
          Exercise name
        </label>

        <input
          type="text"
          maxlength="50"
          id="exercise-name"
          class="form-input"
          v-model="exerciseName"
        />
      </div>

      <div class="form-section">
        <label class="form-label" for="exerciseInput">
          ABC Notation
        </label>
        <textarea
          id="exerciseInput"
          class="exercise-text"
          rows="8"
          v-model="userText"
        ></textarea>

        <div class="enter-buttons">
          <button type="button" class="action-button" @click="renderScore">Enter</button>
          <button type="button" @click="play" class="action-button">Play</button>
          <button :disabled="!isPlaying" @click="togglePause" class="action-button">
            {{ isPaused ? 'Resume' : 'Pause' }}
          </button>
          <button type="button" @click="downloadWav" class="action-button">Save WAV</button>
          <button type="button" @click="downloadSvg" class="action-button">Save SVG</button>
        </div>
      </div>


  <div class="form-section" id="renderedscore">
  <label class="form-label" for="renderedscore">Rendered Score</label>
  <div id="score-container">
    <div id="target"></div>
    <div id="scrollbar" v-if="scrollbarLeft!==null && scrollbarHeight!==null && scrollbarTop!==null" :style="{ left: scrollbarLeft + 'px', top: scrollbarTop + 'px', height: scrollbarHeight + 'px'}"></div>
  </div>
</div>

  <div class="form-section">
  <label class="form-label" for="bpm-control">Tempo and Steps</label>

  <div id="bpm-control" class="bpm-control">
    <label for="bpm">BPM: </label>
    <input
      class="bpm form-input"
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
      class="range-input"
    />
  </div>

  <div id="step-control" class="step-control">
    <div class="step-group">
      <label for="ascending_steps">Ascending steps:</label>
      <select v-model.number="ascendingSteps" id="ascending_steps" class="select-input">
        <option v-for="n in 6" :key="n" :value="n">{{ n }}</option>
      </select>
    </div>

    <div class="step-group">
      <label for="descending_steps">Descending steps:</label>
      <select v-model.number="descendingSteps" id="descending_steps" class="select-input">
        <option v-for="n in 6" :key="n" :value="n">{{ n }}</option>
      </select>
    </div>
  </div>
</div>

<div class="form-section">
  <label class="form-label" for="note-group">Transposition Range</label>

  <div class="note-group">
    <label class="note-label" for="starting_note">Starting note:</label>
    <select v-model="startingNote" id="starting_note" class="select-input">
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

    <select v-model="startingOctave" id="octaves" class="select-input">
      <option value="1">1</option>
      <option value="2">2</option>
      <option value="3">3</option>
      <option value="4">4</option>
      <option value="5">5</option>
      <option value="6">6</option>
      <option value="7">7</option>
    </select>
  </div>

  <div class="note-group">
    <label class="note-label" for="highest_note">Highest note:</label>
    <select v-model="highestNote" id="highest_note" class="select-input">
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

    <select v-model="highestOctave" id="highest-octave" class="select-input">
      <option value="1">1</option>
      <option value="2">2</option>
      <option value="3">3</option>
      <option value="4">4</option>
      <option value="5">5</option>
      <option value="6">6</option>
      <option value="7">7</option>
    </select>
  </div>

  <div class="note-group">
    <label class="note-label" for="lowest_note">Lowest note:</label>
    <select v-model="lowestNote" id="lowest_note" class="select-input">
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

    <select v-model="lowestOctave" id="lowest-octave" class="select-input">
      <option value="1">1</option>
      <option value="2">2</option>
      <option value="3">3</option>
      <option value="4">4</option>
      <option value="5">5</option>
      <option value="6">6</option>
      <option value="7">7</option>
    </select>
  </div>
</div>


<div class="form-section">
  <label class="form-label">Actions</label>
  <div class="action-buttons">
    <button type="button" @click="transposeAndRender" class="action-button">Generate</button>
    <button type="button" @click="resetToDefault" class="action-button">Reset</button>
  </div>
</div>




<div class="form-section">
  <label class="form-label">Tags</label>
  <div v-for="(tags, category) in groupedTags" :key="category" class="tag-group">
    <div class="category-name">{{ category }}</div>
    <div class="tags">
      <label v-for="tag in tags" :key="tag.id" class="tag-label">
        <input type="checkbox" v-model="selectedTags[tag.id]" />
        {{ tag.label }}
      </label>
    </div>
  </div>
</div>


    <div class="form-section">
      <label class="form-label">Visibility</label>

      <div class="visibility">
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
        </div>
      <div class="form-section">
      <button id="submit-button" @click="submitExercise">Submit Exercise</button>
      <div v-if="message" class="status-message">{{ message }}</div>
      </div>
    </div>

    </div> 
    <Footer/>
</template>


<style scoped>
#scrollbar {
  position: absolute;
  width: 3px;
  background-color: rgba(255, 0, 251, 0.7);
  transition: all 50ms linear;
  left: 10px;
  z-index: 10;
  opacity: 0.8;
}


#score-container {
  margin: 10px;
  position: relative;
  min-height: 50px;
  border: 1px solid var(--accent-color);
  background-color: var(--score-bg);
  color: var(--score-text);
}

#target {
  min-height: 50px;
}


</style>