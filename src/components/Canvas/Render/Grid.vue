<template>
  <div class="canvas-grid"></div>
</template>

<style scoped>
.canvas-grid {
  position: absolute;
  top: -5000px;
  left: -5000px;
  width: 15000px;
  height: 15000px;
  background-image: 
    linear-gradient(rgba(106, 125, 91, 0.1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(106, 125, 91, 0.1) 1px, transparent 1px);
  background-size: 50px 50px;
  pointer-events: none;
  z-index: -1;
}
</style>
