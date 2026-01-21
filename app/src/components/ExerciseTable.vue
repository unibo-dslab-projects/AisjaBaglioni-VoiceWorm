<script setup>
const props = defineProps({
  exercises: {
    type: Array,
    required: true
  },
  page: {
    type: Number,
    default: undefined
  },
  limit: {
    type: Number,
    default: 10
  },
  loading: {
    type: Boolean,
    default: false
  },
  showAuthor: {
    type: Boolean,
    default: false
  },
  showVisibility: {
    type: Boolean,
    default: false
  },
  isOwner: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['change-page']);

const MAX_TAGS = 3;

function prevPage() {
  if (props.page > 0) {
    emit('change-page', props.page - 1);
  }
}

function nextPage() {
  if (props.exercises.length >= props.limit) {
    emit('change-page', props.page + 1);
  }
}
</script>

<template>
  <div class="table-wrapper">
    <table>
      <thead>
        <tr>
          <th>Exercise</th>
          <th v-if="showAuthor">Author</th>
          <th v-if="showVisibility">Visibility</th>
          <th>Tags</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="exercises.length === 0">
          <td :colspan="showAuthor || showVisibility ? 3 : 2" class="empty-state">
            No exercises found.
          </td>
        </tr>
        <tr v-for="exercise in exercises" :key="exercise.id">
          <td>
            <router-link :to="`/exercise/${exercise.id}`" class="exercise-link">
              {{ exercise.name }}
            </router-link>
          </td>
          <td v-if="showAuthor">
            <router-link :to="`/user/${exercise.user_id}`" class="user-link">
              {{ exercise.username }}
            </router-link>
          </td>
          <td v-if="showVisibility">
             <span v-if="isOwner && exercise.is_public">🌍 Public</span>
             <span v-else-if="isOwner">🔒 Private</span>
          </td>
          <td class="tags-cell">
            <span
              v-for="tag in exercise.tags.slice(0, MAX_TAGS)"
              :key="tag.id"
              :class="['tag', tag.category]"
            >
              {{ tag.label }}
            </span>
            <span v-if="exercise.tags.length > MAX_TAGS" class="tag more">
              +{{ exercise.tags.length - MAX_TAGS }}
              <span class="tooltip">
                {{ exercise.tags.slice(MAX_TAGS).map(t => t.label).join(', ') }}
              </span>
            </span>
            <span v-if="exercise.tags.length === 0">—</span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <div v-if="page !== undefined" class="pagination">
    <button @click="prevPage" :disabled="page === 0 || loading">Previous</button>
    <span>Page {{ page + 1 }}</span>
    <button @click="nextPage" :disabled="exercises.length < limit || loading">Next</button>
  </div>
</template>

<style scoped>

</style>
