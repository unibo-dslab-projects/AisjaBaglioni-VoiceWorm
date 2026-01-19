<script setup>
import { onMounted, ref, computed, watch } from 'vue';
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
const userText = ref("X:1\nK:C\nT:Aisja\nL:1/4\nM:4/4\n|[ceg]z2cdcd|");
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

//Trasposizione manuale
const originalBarCount = computed(() => countOriginalBars());
const manualStartOffset = ref(0);
const manualAscendingOffset = ref(0);
const manualDescendingOffset = ref(0);
const baseHeader = ref("");
const baseBody   = ref("");

//Gestione delle sezioni
const showManualMode = ref(false);
const showAutomaticMode = ref(false);
const manualStep = ref(0); 

//Messaggio di errore
const message = ref('');

//Attesa per aggiornamento
const debouncedRender = lodash.debounce(renderScore, 250);

function countOriginalBars() {
  const { body } = splitAbcHeaderBody(baseBody.value);

  if (!body) return 0;

  const bars = body.split("|").filter(b => b.trim() !== "");

  return bars.length;
}

function toggleManualMode() {
  showManualMode.value = !showManualMode.value;
  if (showManualMode.value) showAutomaticMode.value = false;
}

function toggleAutomaticMode() {
  showAutomaticMode.value = !showAutomaticMode.value;
  if (showAutomaticMode.value) showManualMode.value = false;
}

function finishManualStep() {
  manualStep.value = 0;
  manualStartOffset.value = 0;
  manualAscendingOffset.value = 0;
  manualDescendingOffset.value = 0;
  defineBase();
}


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
    defineBase();
    logTags();
});

watch(userText, () => {
  debouncedRender();
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
  userText.value = "X:1\nK:C\nT:Aisja\nL:1/4\nM:4/4\n|[ceg]z2cdcd|";
  manualStep.value = 0;
  manualStartOffset.value = 0;
  manualAscendingOffset.value = 0;
  manualDescendingOffset.value = 0;
  renderScore();
}

function resetToLastSaved() {
  userText.value = baseHeader.value+"\n"+baseBody.value;
  manualStep.value = 0;
  manualStartOffset.value = 0;
  manualAscendingOffset.value = 0;
  manualDescendingOffset.value = 0;
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
  const fieldRegex = /^[A-Za-z]:/;

for (let line of lines) {
    const trimmedLine = line.trim();

    if (isBody) {
      body.push(line);
    } else {
      const isHeaderLine = 
        fieldRegex.test(trimmedLine) || 
        trimmedLine.startsWith('%') || 
        trimmedLine === '';

      if (isHeaderLine) {
        header.push(line);
      } else {
        isBody = true;
        body.push(line);
      }
    }
  }

  return { 
    header: header.join("\n").trim(), 
    body: body.join("\n").trim() 
  };
}

//Ottiene la chiave dall'header
function getSheetKey(header) {
  if (!header) return 'C'; // Default se l'header è vuoto
  const match = header.match(/^K:([^\s]+)/m);
  return match ? match[1] : 'C'; // Default se non trova K:
}

function transposeAndRender() {
  isPaused.value = false;
  // Splitta l'abc in header e body, trova la chiave
  const { header, body } = splitAbcHeaderBody(userText.value);
  const key = getSheetKey(header);

  // Crea l'input e lo score
  let input = new Input(body);
  let score = Score.parse(input, KEYS[key.toUpperCase()]);

  // Trova la prima nota// Trova la prima nota e i limiti (usando il basso come riferimento per gli accordi)
  let first_note = null;
  let highest_note = -Infinity;
  let lowest_note = Infinity;

  // Funzione interna per aggiornare i limiti in modo consistente
  const updateLimits = (tone) => {
    if (first_note === null) first_note = tone;
    highest_note = Math.max(highest_note, tone);
    lowest_note = Math.min(lowest_note, tone);
  };

  for (let bar of score.bars) {
    for (let element of bar.elements) {
      if (element instanceof Note) {
        updateLimits(element.data.tone);
      } 
      else if (element instanceof Chord) {
        const tones = element.elements
          .filter(se => se instanceof Note)
          .map(se => se.data.tone);
        
        if (tones.length > 0) {
          const bassOfChord = Math.min(...tones);
          updateLimits(bassOfChord);
        }
      } 
      else if (element instanceof Tuplet) {
        for (let se of element.elements) {
          if (se instanceof Note) {
            updateLimits(se.data.tone);
          } else if (se instanceof Chord) {
            const tones = se.elements
              .filter(e => e instanceof Note)
              .map(e => e.data.tone);
            if (tones.length > 0) updateLimits(Math.min(...tones));
          }
        }
      }
    }
  }
  if (first_note === null) return;


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

function getLastBar() {
  const { header, body } = splitAbcHeaderBody(userText.value);

  if (!body) return null;
  
  const bars = body.split("|")
                   .map(b => b.trim())
                   .filter(b => b !== "");

  if (bars.length === 0) return null;
  const count = parseInt(originalBarCount.value);
  const lastBars = "|"+bars.slice(-count).join("|")+"|";
  
  return lastBars;
}

function removeLastBar() {
  const { header, body } = splitAbcHeaderBody(userText.value);

  if (!body) return body;

  const bars = body.split("|").filter(b => b.trim() !== "");

  if (bars.length <= originalBarCount.value) return;

  const newBars = bars.slice(0, bars.length - 1);

  const newBody = "|" + newBars.map(b => b.trim()).join("|") + "|";

  userText.value = header + "\n" + newBody;
}


function incStart() {
  const actualBody = splitAbcHeaderBody(userText.value).body;
  manualStartOffset.value++;
  let key = getSheetKey(baseHeader.value);
  let input = new Input(actualBody);
  let score = Score.parse(input, KEYS[key.toUpperCase()]);
  score.transpose(1, KEYS[key.toUpperCase()]);
  let acc = lodash.cloneDeep(score);
  userText.value = baseHeader.value + "\n" + acc.generate();
  renderScore();
}

function decStart() {
  const actualBody = splitAbcHeaderBody(userText.value).body;
  manualStartOffset.value--;
  let key = getSheetKey(baseHeader.value);
  let input = new Input(actualBody);
  let score = Score.parse(input, KEYS[key.toUpperCase()]);
  score.transpose(-1, KEYS[key.toUpperCase()]);
  let acc = lodash.cloneDeep(score);
  userText.value = baseHeader.value + "\n" + acc.generate();
  renderScore();
}

function incAscending() {
  const actualBody = splitAbcHeaderBody(userText.value).body;
  manualAscendingOffset.value++;
  let key = getSheetKey(baseHeader.value);
  let input = new Input(actualBody);
  let score = Score.parse(input, KEYS[key.toUpperCase()]);
  let acc = lodash.cloneDeep(score);
  let lastbar = new Input(getLastBar());
  let newbar = Score.parse(lastbar, KEYS[key.toUpperCase()]);
  newbar.transpose(1, KEYS[key.toUpperCase()])
  acc.extend(newbar);
  userText.value = baseHeader.value + "\n" + acc.generate();
  renderScore();
}

function decAscending() {
  manualAscendingOffset.value = Math.max(0, manualAscendingOffset.value - 1);
  removeLastBar();
  renderScore();
}

function incDescending() {
  manualDescendingOffset.value++;
  const actualBody = splitAbcHeaderBody(userText.value).body;
  let key = getSheetKey(baseHeader.value);
  let input = new Input(actualBody);
  let score = Score.parse(input, KEYS[key.toUpperCase()]);
  let acc = lodash.cloneDeep(score);
  let lastbar = new Input(getLastBar());
  let newbar = Score.parse(lastbar, KEYS[key.toUpperCase()]);
  newbar.transpose(-1, KEYS[key.toUpperCase()])
  acc.extend(newbar);
  userText.value = baseHeader.value + "\n" + acc.generate();
  renderScore();
}

function decDescending() {
  manualDescendingOffset.value = Math.max(0, manualDescendingOffset.value - 1);
  removeLastBar();
  renderScore();
}

function defineBase() {
  baseHeader.value = splitAbcHeaderBody(userText.value).header;
  baseBody.value = splitAbcHeaderBody(userText.value).body;
  renderScore();
}

</script>

<template>
    <Header/>
    <div class="page">
      <div class="content-wrapper">
      <div class="form-container">
      <div class="page-title">
      <h1>Create a new exercise</h1>
      <div class="title-underline"></div>
    </div>

      <div class="form-section">
        <h2 class="form-label">
          Exercise name
        </h2>

        <input
          type="text"
          maxlength="50"
          id="exercise-name"
          class="form-input"
          v-model="exerciseName"
        />
      </div>

      <div class="form-section">
        <h2 class="form-label">ABC Notation</h2>
        <textarea
          id="exerciseInput"
          class="exercise-text"
          rows="8"
          v-model="userText"
        ></textarea>

        <div class="enter-buttons">
          <button type="button" @click="play" class="action-button">Play</button>
          <button :disabled="!isPlaying" @click="togglePause" class="action-button">
            {{ isPaused ? 'Resume' : 'Pause' }}
          </button>
          <button type="button" @click="downloadWav" class="action-button">Save WAV</button>
          <button type="button" @click="downloadSvg" class="action-button">Save SVG</button>
          <button type="button" @click="resetToDefault" class="action-button danger-button">Restart</button>
        </div>
      </div>


  <div class="form-section">
  <h2 class="form-label">Tempo</h2>

  <div id="bpm-control" class="bpm-control">
    <label for="bpm-number">BPM: </label>
    <input
      class="bpm form-input"
      id="bpm-number"
      type="number"
      v-model.number="bpm"
      min="1"
      max="300"
      step="1"
      @input="bpm = Math.floor(bpm)"
    />
    
    <input
      type="range"
      id="bpm-slider"
      v-model.number="bpm"
      min="1"
      max="300"
      step="1"
      class="range-input"
    />
  </div>
</div>

<div class="modes-container">
<div id="manual-section" class="form-section">
  <button class="manual-button" :class="{ 'active-mode': !showManualMode }"@click="toggleManualMode">
    Manual Mode
  </button>

  <div v-if="showManualMode" class="manual-mode">
  <div v-show="manualStep === 0" class="manual-row">
    <div class="moreless">
    <p>Start:</p>
    <div class="controls-wrapper">
    <button class="action-button" @click="decStart">−</button>
    {{ manualStartOffset }}
    <button class="action-button" @click="incStart">+</button>
    </div>
    </div>
    <div class="nextsteps">
    <button class="action-button danger-button" @click="resetToLastSaved">Reset</button>
    <button class="action-button" @click="manualStep++">Next →</button>
    </div>
  </div>


  <div v-show="manualStep === 1" class="manual-row">
    <div class="moreless">
    <p>Ascending:</p>
    <div class="controls-wrapper">
    <button class="action-button" @click="decAscending">−</button>
    {{ manualAscendingOffset }}
    <button class="action-button" @click="incAscending">+</button>
    </div>
    </div>
    <div class="nextsteps">
    <button class="action-button danger-button" @click="resetToLastSaved">Reset</button>
    <button class="action-button" @click="manualStep++">Next →</button>
    </div>
  </div>


  <div v-show="manualStep === 2" class="manual-row">
    <div class="moreless">
    <p>Descending:</p>
     <div class="controls-wrapper">
    <button class="action-button" @click="decDescending">−</button>
    {{ manualDescendingOffset }}
    <button class="action-button" @click="incDescending">+</button>
    </div>
    </div>
    <div class="nextsteps">
    <button class="action-button danger-button" @click="resetToLastSaved">Reset</button>
    <button class="action-button" @click="finishManualStep">Finish</button>
    </div>
  </div>
</div>
</div>


<div id="automatic-section" class="form-section">
  <button class="automatic-button" :class="{ 'active-mode': !showAutomaticMode }"@click="toggleAutomaticMode">
    Automatic Mode
  </button>
  <div v-if="showAutomaticMode" class="form-section" id="automatic-mode">
  <h2 class="form-label">Steps</h2>
  <div id="step-control" class="step-control">
    <div class="step-group">
      <h2 for="ascending_steps">Ascending steps:</h2>
      <select v-model.number="ascendingSteps" id="ascending_steps" class="select-input">
        <option v-for="n in 6" :key="n" :value="n">{{ n }}</option>
      </select>
    </div>

    <div class="step-group">
      <h2 for="descending_steps">Descending steps:</h2>
      <select v-model.number="descendingSteps" id="descending_steps" class="select-input">
        <option v-for="n in 6" :key="n" :value="n">{{ n }}</option>
      </select>
    </div>
  </div>

<div class="form-section">
  <h2 class="form-label">Transposition Range</h2>

  <div class="note-group">
    <h2 class="note-label" for="starting_note">Starting note:</h2>
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
    <h2 class="note-label" for="highest_note">Highest note:</h2>
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
    <h2 class="note-label" for="lowest_note">Lowest note:</h2>
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
</div>
  <div class="action-buttons">
  <button type="button" @click="transposeAndRender" class="action-button">Generate</button>
  <button type="button" @click="resetToDefault" class="action-button danger-button">Restart</button>
  </div>
</div>
</div>

<div class="form-section">
  <h2 class="form-label">Tags</h2>
  <div v-for="(tags, category) in groupedTags" :key="category" class="tag-group">
    <div class="category-name">{{ category }}</div>
    <div class="tags">
      <label v-for="tag in tags" :key="tag.id" class="tag-label">
        <input name="tagcheckbox" type="checkbox" v-model="selectedTags[tag.id]" />
        {{ tag.label }}
      </label>
    </div>
  </div>
</div>


    <div class="form-section">
      <h2 class="form-label">Visibility</h2>

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


    <div class="preview-container">
    <div class="form-section" id="renderedscore">
    <h2 class="form-label">Rendered Score</h2>
  <div id="score-container">
    <div id="target"></div>
    <div id="scrollbar" v-if="scrollbarLeft!==null && scrollbarHeight!==null && scrollbarTop!==null" :style="{ left: scrollbarLeft + 'px', top: scrollbarTop + 'px', height: scrollbarHeight + 'px'}"></div>
  </div>
</div>
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