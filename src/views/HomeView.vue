<script setup>
import { onMounted, ref } from 'vue';
import abcjs from "abcjs";
import { transposeABC } from 'abc-notation-transposition';
import { nextTick } from 'vue';
import { computed } from 'vue';

const userText = ref("X:1\nT:Example\nK:Bb\nDCDE|DCDE|DCDE|DCDE|DCDE|DCDE|DCDE|DCDE|\n");
const renderedText = ref(null);
const synth = ref(null);
const scrollbarLeft = ref(null);
const scrollbarTop = ref(null);
const scrollbarHeight = ref(null);
let timer = null; 

onMounted(() => {
  renderScore();
});

function renderScore() {
  renderedText.value = abcjs.renderAbc("target", userText.value, { staffwidth: 740, wrap: {minSpacing: 1.8, maxSpacing: 2.7, preferredMeasuresPerLine: 6 }});
}

async function play() {
  if (synth.value) {
    synth.value.stop();
    timer.stop();
  }


  synth.value = new abcjs.synth.CreateSynth();
  const visualObj1 = renderedText.value[0];

  timer = new abcjs.TimingCallbacks(visualObj1, {
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
      timingCallbacks: timer
    }
  });

  synth.value.prime();
  synth.value.start();

  timer.start(synth.value.audioContext);

}


</script>

<template>
  <main>
    <div id="page">
      <h1>VoiceWorm</h1>
      <textarea class="text" v-model="userText"></textarea> <br>
      <div id="buttons">
        <button type="button" @click="renderScore">Enter</button>
        <button type="button" @click="play">Play</button>
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