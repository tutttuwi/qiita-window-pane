<script setup lang="ts">

import { getMessage } from '~/background/i18n';
import 'bootstrap'
import { Vue3Snackbar } from "vue3-snackbar";
import { PAGES } from "~/constants";
// function openOptionsPage() {
//   browser.runtime.openOptionsPage()
// }
// const parsedSavedTabList = computed<any[]>(() => JSON.parse(savedTabList.value));

// function initSavedTabList() {
//   if (confirm("ストレージを初期化しますか？")) {
//     savedTabList.value = "[]"; // 初期化
//   }
// }

let currentPage = ref<ValueOf<typeof PAGES>>(PAGES.CURRENT_TABS);
function changePage(pageId: ValueOf<typeof PAGES>) {
  currentPage.value = pageId;
}

// function openFullScrean() {
//   chrome.windows.create({
//     focused: true,
//     type: "popup",
//     state: "normal",
//     url: location.href
//   });
// }

</script>

<template>
  <div class="popup-wrapper">

    <main class="px-3 py-3 text-gray-700">
      <div class="d-flex align-items-stretch">
        <div class="nav flex-column nav-pills pe-2 me-4 border-end h-550 justify-content-between" id="v-pills-tab"
          role="tablist" aria-orientation="vertical">
          <div class="mt-2 sticky-top d-flex flex-column">
            <button class="nav-link active btn-circle mb-2" id="current-tabs-tab" data-bs-toggle="tab"
              data-bs-target="#current-tabs" type="button" role="tab" aria-controls="current-tabs" aria-selected="true"
              :title="getMessage('popupCurrentTabs')" @click="changePage(PAGES.CURRENT_TABS)">
              <bx:windows />
            </button>
            <button class="nav-link btn-circle mb-2" id="nav-profile-tab" data-bs-toggle="tab"
              data-bs-target="#nav-profile" type="button" role="tab" aria-controls="nav-profile" aria-selected="false"
              :title="getMessage('popupSavedGroups')" @click="changePage(PAGES.SAVED_TABS)">
              <material-symbols:save />
            </button>
            <button class="nav-link btn-circle mb-2" id="nav-contact-tab" data-bs-toggle="tab"
              data-bs-target="#nav-contact" type="button" role="tab" aria-controls="nav-contact" aria-selected="false"
              :title="getMessage('popupSetting')" @click="changePage(PAGES.SETTING)">
              <ant-design:setting-filled />
            </button>
          </div>
          <div class="d-flex flex-column justify-content-center">
            <button class="nav-link btn-secondary btn-circle mb-2" id="current-tabs-tab" data-bs-toggle="tab"
              data-bs-target="#current-tabs" type="button" role="tab" aria-controls="current-tabs"
              :title="getMessage('popupCurrentTabs')" @click="changePage(PAGES.SUPPORT)">
              <iconoir:donate />
            </button>
            <!-- <div class="text-center align-text-center" style="cursor: pointer;">
              <span @click="openFullScrean()"><octicon:screen-full-16 /></span>
            </div> -->
          </div>
        </div>
        <div class="tab-content w-650" id="nav-tabContent">
          <CurrentTabs :tabTitle="getMessage('popupCurrentTabs')" v-if="currentPage === PAGES.CURRENT_TABS" />
          <SavedTabs :tabTitle="getMessage('popupSavedGroups')" v-if="currentPage === PAGES.SAVED_TABS" />
          <Setting :tab-title="getMessage('popupSetting')" v-if="currentPage === PAGES.SETTING" />
          <Support :tab-title="getMessage('popupSupport')" v-if="currentPage === PAGES.SUPPORT" />
        </div>
      </div>

    </main>
  </div>
  <vue3-snackbar bottom center :duration="1000"></vue3-snackbar>
</template>
