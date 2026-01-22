
<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useScore } from '@/composables/useScore';

const props = defineProps({
  initialData: {
    type: Object,
    default: null
  },
  isOwner: {
    type: Boolean,
    default: true
  },
  mode: {
    type: String,
    required: true,
    validator: (value) => ['create', 'edit'].includes(value)
  },
  allTags: {
    type: Array,
    default: () => []
  },
  message: String,
  deleteMessage: String,
  favoritesMessage: String,
  isFavorite: Boolean
});

const emit = defineEmits(['save', 'delete', 'update:data', 'toggle-favorite']);

const {
  userText,
  renderedText,
  isPaused,
  isPlaying,
  bpm,
  scrollbarLeft,
  scrollbarTop,
  scrollbarHeight,
  ascendingSteps,
  descendingSteps,
  startingNote,
  startingOctave,
  highestNote,
  highestOctave,
  lowestNote,
  lowestOctave,
  startingSemitones,
  highestSemitones,
  lowestSemitones,
  manualStep,
  manualStartOffset,
  manualAscendingOffset,
  manualDescendingOffset,
  renderScore,
  play,
  togglePause,
  stopSynthAndTimer,
  transposeAndRender,
  resetToDefault,
  resetToLastSaved,
  defineBase,
  downloadWav,
  downloadSvg,
  inputToSemitones,
  semitonesToInput,
  incStart,
  decStart,
  incAscending,
  decAscending,
  incDescending,
  decDescending,
  finishManualStep,
  debouncedRender
} = useScore();

const exerciseName = ref(props.mode === 'create' ? "Choose a significant name" : "");
const visibility = ref("1");
const selectedTags = ref({});
const showManualMode = ref(false);
const showAutomaticMode = ref(false);

const groupedTags = computed(() => {
  const groups = {};
  props.allTags.forEach(tag => {
    if (!groups[tag.category]) groups[tag.category] = [];
    groups[tag.category].push(tag);
  });
  return groups;
});

const groupedExerciseTags = computed(() => {
  if (!props.initialData?.tags) return {};
  const groups = {};
  props.initialData.tags.forEach(tag => {
    if (!groups[tag.category]) groups[tag.category] = [];
    groups[tag.category].push(tag);
  });
  return groups;
});

function toggleManualMode() {
  showManualMode.value = !showManualMode.value;
  if (showManualMode.value) showAutomaticMode.value = false;
  if (showManualMode.value) defineBase();
}

function toggleAutomaticMode() {
  showAutomaticMode.value = !showAutomaticMode.value;
  if (showAutomaticMode.value) showManualMode.value = false;
}

function handleSubmit() {
  const data = {
    name: exerciseName.value,
    abc: userText.value,
    is_public: Number(visibility.value),
    bpm: bpm.value,
    a_steps: ascendingSteps.value,
    d_steps: descendingSteps.value,
    s_note: startingSemitones.value,
    h_note: highestSemitones.value,
    l_note: lowestSemitones.value,
    tag_ids: Object.keys(selectedTags.value).filter(id => selectedTags.value[id]).map(Number)
  };
  emit('save', data);
}

watch(() => props.initialData, (newData) => {
  if (newData) {
    exerciseName.value = newData.name;
    userText.value = newData.abc;
    visibility.value = newData.is_public;
    bpm.value = newData.bpm;
    ascendingSteps.value = newData.a_steps;
    descendingSteps.value = newData.d_steps;

    if (newData.s_note !== undefined) {
      const s = semitonesToInput(newData.s_note);
      startingNote.value = s.n;
      startingOctave.value = s.o;
    }
    if (newData.h_note !== undefined) {
      const h = semitonesToInput(newData.h_note);
      highestNote.value = h.n;
      highestOctave.value = h.o;
    }
    if (newData.l_note !== undefined) {
      const l = semitonesToInput(newData.l_note);
      lowestNote.value = l.n;
      lowestOctave.value = l.o;
    }

    if (newData.tags) {
       selectedTags.value = {};
       newData.tags.forEach(tag => { selectedTags.value[tag.id] = true; });
    }
    
    renderScore();
    defineBase();
  }
}, { immediate: true });

onMounted(() => {
    if (props.mode === 'create') {
        defineBase();
    }
    renderScore();
});

watch(userText, () => {
    debouncedRender();
});
</script>

<template>
  <div class="content-wrapper">
    <div class="form-container">
      <div class="page-title">
        <h1>{{ mode === 'create' ? 'Create a new exercise' : exerciseName }}</h1>
        <div class="title-underline"></div>
      </div>

      <div v-if="isOwner" class="form-section">
        <h2 class="form-label">Exercise name</h2>
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
          :readonly="!isOwner"
        ></textarea>

        <div class="enter-buttons">
          <button type="button" @click="play" class="action-button">Play</button>
          <button :disabled="!isPlaying" @click="togglePause" class="action-button">
            {{ isPaused ? 'Resume' : 'Pause' }}
          </button>
          <button type="button" @click="downloadWav" class="action-button">Save WAV</button>
          <button type="button" @click="downloadSvg" class="action-button">Save SVG</button>
          <button v-if="isOwner" type="button" @click="mode === 'edit' ? resetToLastSaved() : resetToDefault()" class="action-button danger-button">
            {{ mode === 'edit' ? 'Reset' : 'Restart' }}
          </button>
        </div>
      </div>

      <div class="form-section">
        <h2 class="form-label">Tempo</h2>
        <div id="bpm-control" class="bpm-control">
          <label for="bpm-number">BPM: </label>
          <input
            class="bpm form-input"
            type="number"
            v-model.number="bpm"
            min="1"
            max="300"
            step="1"
            id="bpm-number"
            @input="bpm = Math.floor(bpm)"
            :disabled="!isOwner"
          />
          <input
            type="range"
            v-model.number="bpm"
            min="1"
            max="300"
            step="1"
            id="bpm-slider"
            class="range-input"
            :disabled="!isOwner"
          />
        </div>
      </div>

      <div v-if="isOwner" class="modes-container">
        <div id="manual-section" class="form-section">
          <button class="manual-button" :class="{ 'active-mode': !showManualMode }" @click="toggleManualMode">
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
          <button class="automatic-button" :class="{ 'active-mode': !showAutomaticMode }" @click="toggleAutomaticMode">
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
                      <option v-for="(label, i) in ['C','C#/Db','D','D#/Eb','E','F','F#/Gb','G','G#/Ab','A','A#/Bb','B']" :value="i" :key="label">{{label}}</option>
                    </select>

                    <select v-model="startingOctave" id="octaves" class="select-input">
                      <option v-for="n in 7" :value="n" :key="n">{{n}}</option>
                    </select>
                  </div>

                  <div class="note-group">
                    <h2 class="note-label" for="highest_note">Highest note:</h2>
                    <select v-model="highestNote" id="highest_note" class="select-input">
                      <option v-for="(label, i) in ['C','C#/Db','D','D#/Eb','E','F','F#/Gb','G','G#/Ab','A','A#/Bb','B']" :value="i" :key="label">{{label}}</option>
                    </select>

                    <select v-model="highestOctave" id="highest-octave" class="select-input">
                      <option v-for="n in 7" :value="n" :key="n">{{n}}</option>
                    </select>
                  </div>

                  <div class="note-group">
                    <h2 class="note-label" for="lowest_note">Lowest note:</h2>
                    <select v-model="lowestNote" id="lowest_note" class="select-input">
                      <option v-for="(label, i) in ['C','C#/Db','D','D#/Eb','E','F','F#/Gb','G','G#/Ab','A','A#/Bb','B']" :value="i" :key="label">{{label}}</option>
                    </select>

                    <select v-model="lowestOctave" id="lowest-octave" class="select-input">
                      <option v-for="n in 7" :value="n" :key="n">{{n}}</option>
                    </select>
                  </div>
              </div>
              
              <div class="action-buttons">
                <button type="button" @click="transposeAndRender" class="action-button">Generate</button>
                <button type="button" @click="resetToLastSaved" class="action-button danger-button">Reset</button>
              </div>
          </div>
        </div>
      </div>

      <div class="form-section">
        <h2 class="form-label">Tags</h2>
        
        <div v-if="isOwner">
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
        <div v-else>
            <div v-if="props.initialData?.tags?.length > 0">
              <div v-for="(tags, category) in groupedExerciseTags" :key="category" class="tag-group">
                <div class="category-name">{{ category }}</div>
                <div class="tags">
                  <span v-for="tag in tags" :key="tag.id" class="tag-label">{{ tag.label }}</span>
                </div>
              </div>
            </div>
            <div v-else>
              <p>No tags</p>
            </div>
        </div>
      </div>

      <div v-if="mode === 'edit'" class="form-section">
        <h2 class="form-label">Favorites</h2>
        <div v-if="isFavorite">
          <p>This exercise is in your favorites.</p>
          <div class="action-buttons">
            <button class="action-button danger-button" @click="$emit('toggle-favorite')">Remove from Favorites</button>
          </div>
        </div>
        <div v-else>
          <p>This exercise is not in your favorites.</p>
          <div class="action-buttons">
            <button class="action-button" @click="$emit('toggle-favorite')">Add to Favorites</button>
          </div>
        </div>
        <p class="status-message">{{ favoritesMessage }}</p>
      </div>

      <div v-if="isOwner" class="form-section">
        <h2 class="form-label">Visibility</h2>
        <div class="visibility">
          <input type="radio" id="public" :value="1" v-model="visibility" />
          <label for="public">Public</label>
          <input type="radio" id="private" :value="0" v-model="visibility" />
          <label for="private">Private</label>
        </div>
      </div>

      <div v-if="isOwner" class="form-section">
           <div v-if="mode === 'create'">
              <button id="submit-button" @click="handleSubmit">Submit Exercise</button>
              <div v-if="message" class="status-message">{{ message }}</div>
           </div>
           
           <div v-else>
               <h2 class="form-label" id="danger-text">Danger Zone</h2>
               <div class="danger-buttons">
                <button id="delete-button" class="danger-button" @click="handleSubmit">Modify Exercise</button>
                <button id="delete-button" class="danger-button" @click="$emit('delete')">Delete Exercise</button>
                <div v-if="message" class="modify-message">{{ message }}</div>
                <div v-if="deleteMessage" class="delete-message">{{ deleteMessage }}</div>
               </div>
           </div>
        </div>
    </div>

    <div class="preview-container">
      <div class="form-section" id="renderedscore">
        <h2 class="form-label">Rendered Score</h2>
        <div id="score-container">
          <div id="target"></div>
          <div id="scrollbar" v-if="scrollbarLeft!==null && scrollbarHeight!==null && scrollbarTop!==null" 
               :style="{ left: scrollbarLeft + 'px', top: scrollbarTop + 'px', height: scrollbarHeight + 'px'}"></div>
        </div>
      </div>
    </div>
  </div>
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
