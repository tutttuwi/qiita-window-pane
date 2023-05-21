<script setup lang="ts">
import { savedTabList } from '~/logic/storage'
import { getMessage } from '~/background/i18n';
import 'bootstrap'

// import { useSnackbar } from "vue3-snackbar";
// const snackbar = useSnackbar();

const props = defineProps({
  tabTitle: String
});

const tabList = computed<any[]>(() => {
  let parsedSavedTabList: Array<any> = JSON.parse(savedTabList.value);
  const parsedSavedTabs: Array<any> = parsedSavedTabList.sort((a, b) => { return (a.title > b.title) ? -1 : 1 }).filter(tabItem => !tabItem.isGroup);
  const parsedSavedTabGroups: Array<any> = parsedSavedTabList.sort((a, b) => { return (a.title > b.title) ? -1 : 1 }).filter(tabItem => tabItem.isGroup);
  let parsedSavedTabListResult = [...parsedSavedTabGroups];
  parsedSavedTabListResult.push(...parsedSavedTabs);
  // parsedSavedTabListResult.sort((a, b) => {
  //   if (sortSetting.value.updateDate === 'asc') {
  //     return new Date(a.updateDate).getTime() - new Date(b.updateDate).getTime();
  //   } else {
  //     return new Date(b.updateDate).getTime() - new Date(a.updateDate).getTime();
  //   }
  // });
  // parsedSavedTabList.sort((a, b) => {
  //   if (sortSetting.value.group === 'asc') {
  //     return (a.isGroup ? 0 : 1) - (b.updateDate ? 0 : 1);
  //   } else {
  //     return (b.isGroup ? 0 : 1) - (a.updateDate ? 0 : 1);
  //   }
  // });
  return parsedSavedTabListResult;
});

async function trushTab(tab: any) {
  // console.log("tabId", tab.id);
  // console.log("tabList before", tabList);
  savedTabList.value = JSON.stringify(tabList.value.filter((tabItem) => tabItem.id !== tab.id));
}
async function trushTabGroup(groupTab: any) {
  savedTabList.value = JSON.stringify(tabList.value.filter((tabItem) => tabItem.uuid !== groupTab.uuid));
}

function openTab(tab: any) {
  chrome.tabs.create(
    {
      // index: 1,
      // openerTabId: 1,
      url: tab.url,
      // pinned: false,
      // windowId: 1,
      // active: true,
      // selected: true
    }
  );
}

async function toggleCollapseExpand(groupTab: any) {
  savedTabList.value = JSON.stringify(tabList.value.map((tabItem) => {
    if (tabItem.uuid === groupTab.uuid) {
      tabItem.collapsed = !groupTab.collapsed
    }
    return tabItem;
  }));
}

async function editColor(tab: any) {
  savedTabList.value = JSON.stringify(tabList.value.map((tabItem) => {
    if (tabItem.uuid === tab.uuid) {
      tabItem.isUnderEditColor = !tab.isUnderEditColor;
    }
    return tabItem;
  }));
}
function changeTabColor(tab: any, color: string) {
  savedTabList.value = JSON.stringify(tabList.value.map((tabItem) => {
    if (tabItem.uuid === tab.uuid) {
      tabItem.color = color;
    }
    return tabItem;
  }));
}

async function editTitle(tab: any) {
  savedTabList.value = JSON.stringify(tabList.value.map((tabItem) => {
    if (tabItem.uuid === tab.uuid) {
      tabItem.isUnderEditTitle = true;
    }
    return tabItem;
  }));
  let editTitleInput = document.getElementById("saved-tab-group-title-" + tab.uuid);
  if (editTitleInput) {
    await nextTick();
    editTitleInput.focus();
  }
}

function bindTitle(tab: any) {
  savedTabList.value = JSON.stringify(tabList.value.map((tabItem) => {
    if (tabItem.uuid === tab.uuid) {
      tabItem.isUnderEditTitle = false;
    }
    return tabItem;
  }));
}

async function restoreTabGroup(tab: any) {
  let createdTabIds: Array<number> = [];
  // 子タブ作成
  for (const tabItem of tab.childTabs) {
    const createdTab: chrome.tabs.Tab = await chrome.tabs.create(
      {
        // index: 1,
        // openerTabId: 1,
        url: tabItem.url,
        // pinned: false,
        // windowId: 1,
        active: false,
        selected: false
      }
    );
    const createdTabId: number = createdTab.id || 0;
    createdTabIds.push(createdTabId);
  }
  // グループ作成
  const createdGroupId: number = await chrome.tabs.group({ tabIds: createdTabIds });
  // グループ編集
  chrome.tabGroups.update(createdGroupId, {
    collapsed: tab.collapsed,
    color: tab.color,
    title: tab.title
  });
}

async function restoreAndTrushTabGroup(tab: any) {
  await restoreTabGroup(tab);
  trushTabGroup(tab);
}

function trushChildTab(tab: any, childTab: any) {
  savedTabList.value = JSON.stringify(tabList.value.map((tabItem) => {
    if (tabItem.uuid === tab.uuid) {
      tabItem.childTabs = tab.childTabs.filter((childTabItem: any) => childTabItem.id !== childTab.id);
    }
    return tabItem;
  }));
}

function trushSavedTabList() {
  if (confirm(getMessage("confirmTrushAllSavedTab"))) {
    savedTabList.value = "[]"; // 初期化
  }
}

watch(tabList, () => { fetchTabs() });

// const QueryInWindow = {
//   windowId: chrome.windows.WINDOW_ID_CURRENT,
// };

async function fetchTabs() {
  // if group tab don't have child tabs, remove it.
  // console.log("fetchTabs", tabList.value);
  const deleteTargetTabGroup: any = tabList.value.filter((tabItem) => tabItem.childTabs && tabItem.childTabs.length === 0);
  // console.log("deleteTargetTabGroup", deleteTargetTabGroup);
  if (deleteTargetTabGroup && deleteTargetTabGroup.length > 0) {
    // console.log("fetchTabs if inner", tabList.value);
    // console.log(JSON.stringify(tabList.value.filter((tabItem: any) => !tabItem.childTabs || (tabItem.childTabs && tabItem.childTabs.length !== 0))));
    savedTabList.value = JSON.stringify(tabList.value.filter((tabItem: any) => !tabItem.childTabs || (tabItem.childTabs && tabItem.childTabs.length !== 0)));
  }
}

// console.log("tabList", tabList);
// fetchTabs(tabList.value);

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
        <span class="mx-2" role="button" @click="trushSavedTabList()" :title="getMessage('trushAllSavedTabs')">
          <span class="tab-menu">
            <mdi:garbage-can class="text-danger" />
          </span>
        </span>
      </div>
    </div>
  </div>
  <ul class="list-group list-scroll">
    <template
      v-for=" tab in                                                               tabList                                                               ">

      <template v-if="tab.isGroup">
        <!-- タブグループの場合 -->
        <li class="list-group-custom mx-3">
          <div class="d-flex justify-content-between">

            <div class="position-relative" style="width: 400px;z-index: 2;" role="button">
              <div class="text-truncate">
                <material-symbols:tab-group-sharp class="d-inline-block size-20 align-text-bottom me-2"
                  :class="'tab-group-' + tab.color" @click="editColor(tab)" />
                <span class="group-name me-2" v-if="!tab.isUnderEditTitle" @click="editTitle(tab)">
                  <template v-if="tab.title === ''">untitled</template>
                  <template v-if="tab.title !== ''">{{ tab.title }}</template>
                </span>
                <input :class="tab.isUnderEditTitle ? '' : 'd-none'" class="me-2" type="text"
                  :id="'saved-tab-group-title-' + tab.uuid" v-model="tab.title" v-on:keydown.enter="bindTitle(tab)"
                  v-on:blur="bindTitle(tab)">
                <span class="badge rounded-pill bg-secondary">{{ tab.childTabs.length + ' tabs' }}</span>
                <template v-if="tab.collapsed">
                  <span class="ms-1 me-2">
                    <ph:dots-three />
                  </span>
                  <span class="me-2" v-for=" childTabs of tab.childTabs">
                    <img class="tabs-favicon me-1" :src="`/_favicon/?pageUrl=${encodeURIComponent(childTabs.url)}`">
                  </span>
                </template>
                <template v-if="tab.isUnderEditColor">
                  <div :id="'saved-tab-group-title-' + tab.id" class="mt-1" v-on:blur="tab.isUnderEditColor = false;">
                    <material-symbols:tab-group-sharp @click=" changeTabColor(tab, 'grey')"
                      class="d-inline-block rounded-circle size-20 align-text-bottom me-2 tab-group-grey" />
                    <material-symbols:tab-group-sharp @click=" changeTabColor(tab, 'blue')"
                      class="d-inline-block rounded-circle size-20 align-text-bottom me-2 tab-group-blue" />
                    <material-symbols:tab-group-sharp @click=" changeTabColor(tab, 'red')"
                      class="d-inline-block rounded-circle size-20 align-text-bottom me-2 tab-group-red" />
                    <material-symbols:tab-group-sharp @click=" changeTabColor(tab, 'yellow')"
                      class="d-inline-block rounded-circle size-20 align-text-bottom me-2 tab-group-yellow" />
                    <material-symbols:tab-group-sharp @click=" changeTabColor(tab, 'green')"
                      class="d-inline-block rounded-circle size-20 align-text-bottom me-2 tab-group-green" />
                    <material-symbols:tab-group-sharp @click=" changeTabColor(tab, 'pink')"
                      class="d-inline-block rounded-circle size-20 align-text-bottom me-2 tab-group-pink" />
                    <material-symbols:tab-group-sharp @click=" changeTabColor(tab, 'purple')"
                      class="d-inline-block rounded-circle size-20 align-text-bottom me-2 tab-group-purple" />
                    <material-symbols:tab-group-sharp @click=" changeTabColor(tab, 'cyan')"
                      class="d-inline-block rounded-circle size-20 align-text-bottom me-2 tab-group-cyan" />
                    <material-symbols:tab-group-sharp @click=" changeTabColor(tab, 'orange')"
                      class="d-inline-block rounded-circle size-20 align-text-bottom me-2 tab-group-orange" />
                  </div>
                </template>
              </div>
              <mdi:plus-thick v-if="tab.collapsed" class="state-indicator" @click=" toggleCollapseExpand(tab);" />
              <mdi:minus-thick v-if="!tab.collapsed" class="state-indicator" @click=" toggleCollapseExpand(tab);" />
            </div>

            <div class="d-flex">
              <div class="mx-2 tab-menu non-pointer">
                <span class="badge bg-light text-dark">{{ tab.updateDate }}</span>
              </div>
              <div class="mx-2 pointer" role="button" @click=" toggleCollapseExpand(tab);">
                <span class="tab-menu pointer" v-if="tab.collapsed" :title="getMessage('expand')">
                  <material-symbols:keyboard-arrow-down-rounded />
                </span>
                <span class="tab-menu pointer" v-else :title="getMessage('collapse')">
                  <material-symbols:keyboard-arrow-up-rounded />
                </span>
              </div>
              <div class="mx-2 pointer" role="button">
                <span class="tab-menu" :title="'restore tab group'" @click=" restoreTabGroup(tab)">
                  <fluent:window-arrow-up-16-filled />
                </span>
              </div>
              <div class="mx-2 pointer" role="button">
                <span class="tab-menu" :title="'restore and trush tab group'" @click=" restoreAndTrushTabGroup(tab)">
                  <fa-solid:trash-restore />
                </span>
              </div>
              <div class="mx-2 pointer" role="button" @click=" trushTabGroup(tab)" :title="'trush tab group'">
                <span class="tab-menu">
                  <mdi:garbage-can class="text-danger" />
                </span>
              </div>
            </div>
          </div>
        </li>
        <template v-for="             childTab              of              tab.childTabs             ">
          <!-- タブグループ子タブ -->
          <li class="list-group-custom mx-3" :class="tab.collapsed ? 'd-none' : ''">
            <div class="d-flex justify-content-between">
              <div class="tab-in-group position-relative" style="width: 400px;z-index:1;" role="button"
                @click=" openTab(childTab)" :title="childTab.url">
                <div class="text-truncate">
                  <img class="tabs-favicon me-1" :src="`/_favicon/?pageUrl=${encodeURIComponent(childTab.url)}`">
                  {{ childTab.title }}
                </div>
              </div>
              <div class="d-flex">
                <div class="mx-2 pointer" role="button">
                  <span class="tab-menu">
                  </span>
                </div>
                <div class="mx-2 pointer" role="button">
                  <span class="tab-menu" :title="'restore tab'">
                  </span>
                </div>
                <div class="mx-2 pointer" role="button">
                  <span class="tab-menu" :title="'restore and trush tab'">
                  </span>
                </div>
                <div class="mx-2 pointer" role="button" :title="'trush tab'" @click=" trushChildTab(tab, childTab)">
                  <span class="tab-menu">
                    <mdi:garbage-can class="text-danger" />
                  </span>
                </div>
              </div>
            </div>
          </li>
        </template>
      </template>

      <template v-else>
        <!-- タブグループ以外 -->
        <li class="list-group-custom mx-3">
          <div class="d-flex justify-content-between">
            <div class="position-relative" style="width: 400px;z-index:1;" role="button" @click=" openTab(tab)"
              :title="tab.url">
              <div class="text-truncate">
                <img class="tabs-favicon me-1" :src="`/_favicon/?pageUrl=${encodeURIComponent(tab.url)}`">
                {{ tab.title }}
              </div>
            </div>
            <div class="d-flex">
              <div class="mx-2 tab-menu non-pointer">
                <span class="badge bg-light text-dark">{{ tab.updateDate }}</span>
              </div>
              <div class="mx-2 pointer" role="button">
                <span class="tab-menu">
                </span>
              </div>
              <div class="mx-2 pointer" role="button">
                <span class="tab-menu" :title="getMessage('popupSaveTab')">
                </span>
              </div>
              <div class="mx-2 pointer" role="button">
                <span class="tab-menu" :title="getMessage('popupSaveAndCloseTab')">
                </span>
              </div>
              <div class="mx-2 pointer" role="button" @click=" trushTab(tab)" :title="getMessage('popupCloseTab')">
                <span class="tab-menu">
                  <mdi:garbage-can class="text-danger" />
                </span>
              </div>
            </div>
          </div>
        </li>
      </template>
    </template>

  </ul>
</template>
