<script setup lang="ts">
import { useToggle } from '@vueuse/core'
import 'uno.css'
import '../style.css'

const [show, toggle] = useToggle(false)
// const isShow:string = ref("true");

function getAccountProfileUrl() {
  return window.location.href.replaceAll(/\/items\/.*/g, "");
}

// function showToggle() {
//   isShow.value = !isShow.value;
//   isShow.
// }

</script>

<template>
  <div class="fixed qiita-window-container m-5 z-100 flex items-start font-sans select-none leading-1em">
    <div class="bg-white text-gray-800 rounded-lg shadow w-max h-min" p="x-4 y-2" m="y-auto r-2"
      transition="opacity duration-300" :class="show ? 'opacity-100' : 'opacity-0'">
      <iframe :src="getAccountProfileUrl()" frameborder="0" style="border: 0" width="800" height="600"></iframe>
    </div>
    <div class="flex w-10 h-10 rounded-full shadow cursor-pointer" @click="toggle()">
      <img title="[Qiitaノ窓]プロフィールを覗く(/ω・＼)ﾁﾗｯ" src="../../assets/icon-16.png" />
    </div>
  </div>
</template>
