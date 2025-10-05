<template>
  <div>
    <h1>Vue Test App</h1>
    <p>This is a test application for framework detection.</p>
    <div>
      <button @click="count++">count is {{ count }}</button>
    </div>
    <div>
      <p>Framework: Vue 3</p>
      <p>Build tool: Vite</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const count = ref(0)
</script>
