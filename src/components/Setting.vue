<script setup lang="ts">
import { getMessage } from '~/background/i18n';
import { houseKeepTabGroupCount, autoSaveTabGroupPerMinites, isAutoSaveTabGroup, showNotificationWhenAutoSaveTabGroup } from '~/logic/storage'
import 'bootstrap'

import { useSnackbar } from "vue3-snackbar";
const snackbar = useSnackbar();
const props = defineProps({
  tabTitle: String
})

function showSaved() {
  snackbar.add({ type: 'success', text: 'saved!' });
}

async function initAlarm() {
  console.log("initAlarm clearAll alarm");
  console.log("initAlarm clear before", await chrome.alarms.getAll());
  chrome.alarms.clearAll();
  console.log("initAlarm clear after", await chrome.alarms.getAll());
  if (isAutoSaveTabGroup.value) {
    console.log("initAlarm create before");
    chrome.alarms.create('auto-save-tab-group', { delayInMinutes: 1, periodInMinutes: autoSaveTabGroupPerMinites.value });
    console.log("initAlarm create after", await chrome.alarms.getAll());
  }
}


</script>
<template>
  <div class="mx-2 my-3">
    <div class="d-flex justify-content-between">
      <div class="fs-5 fw-bold">
        <span>{{ props.tabTitle }}</span>
      </div>
      <div>
        <span class="mx-2" role="button">
          <span class="tab-menu pointer">
          </span>
        </span>
        <span class="mx-2" role="button">
          <span class="tab-menu pointer">
          </span>
        </span>
        <span class="mx-2" role="button">
          <span class="tab-menu pointer">
          </span>
        </span>
        <span class="mx-2" role="button">
          <span class="tab-menu">
          </span>
        </span>
      </div>
    </div>
  </div>
  <div class="flex-container">
    <div class="row mb-2">
      <div class="col-12 mb-1 fs-5">
        <span class="form-check-label col-8">{{ getMessage("settingAutoSaveTabGroupTitle") }}</span>
      </div>
      <div class="col-12 mb-1">
        <div class="form-check form-switch">
          <input class="form-check-input" type="checkbox" id="isAutoSaveTabGroup" v-model="isAutoSaveTabGroup"
            @change="showSaved(); initAlarm();">
          <label class="form-check-label" for="isAutoSaveTabGroup">{{ getMessage("settingAutoSaveTabGroupEnable")
          }}</label>
        </div>
      </div>
      <div class="col-12 mb-1">
        <div class="form-check form-switch">
          <input class="form-check-input" type="checkbox" id="showNotificationWhenAutoSaveTabGroup"
            v-model="showNotificationWhenAutoSaveTabGroup" @change="showSaved();" :disabled="!isAutoSaveTabGroup">
          <label class="form-check-label" for="showNotificationWhenAutoSaveTabGroup">{{
            getMessage("settingAutoSaveTabGroupNotify") }}</label>
        </div>
      </div>
      <div class="col-12 mb-1">
        <div class="input-group mb-3">
          <span class="input-group-text" id="basic-addon1"><ic:twotone-history /></span>
          <input type="number" class="form-control" v-model="autoSaveTabGroupPerMinites"
            @change="showSaved(); initAlarm();" :disabled="!isAutoSaveTabGroup">
        </div>
      </div>
    </div>
    <div class="row mb-2">
      <div class="col-12 mb-1 fs-5">
        <span class="form-check-label col-8">
          {{ getMessage("settingAutoSaveTabGroupCountOfHistory") }}
        </span>
      </div>
      <div class="col-12 mb-1">
        <div class="input-group mb-3">
          <span class="input-group-text" id="basic-addon1"><ic:twotone-history /></span>
          <input type="number" class="form-control" placeholder="keep history count" v-model="houseKeepTabGroupCount"
            @change="showSaved()">
        </div>
      </div>
    </div>
  </div>
</template>
