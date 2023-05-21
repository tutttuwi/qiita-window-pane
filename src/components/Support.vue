<script setup lang="ts">
import 'bootstrap'
import { getMessage } from '~/background/i18n';
const props = defineProps({
  tabTitle: String
})

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
        <span>
          {{ getMessage("supportDonationTitle") }} <bx:donate-heart />
        </span>
      </div>
      <div class="col-12 mb-1">
        <span>{{ getMessage("supportDonationDescription") }}</span>
      </div>
      <div class="col-12 mb-1">
        <a href="https://www.buymeacoffee.com/tutttuwi" target="_blank" class="btn btn-outline-primary">
          <line-md:buy-me-a-coffee-filled /> {{ getMessage("supportDonationBuyACoffee") }}
        </a>
      </div>
    </div>
    <div class="row mb-2">
      <div class="col-12 mb-1 fs-5">
        <span class="form-check-label col-8">
          {{ getMessage("supportRequestTitle") }} <fluent-mdl2:message-friend-request />
        </span>
      </div>
      <div class="col-12 mb-1">
        <span class="col-12">
          {{ getMessage("supportRequestDescription") }}
        </span>
      </div>
    </div>
  </div>
</template>
