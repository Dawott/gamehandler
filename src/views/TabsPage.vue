<template>
  <ion-page>
    <ion-tabs>
      <ion-router-outlet></ion-router-outlet>
      <template #bottom>
      <ion-tab-bar>
        <ion-tab-button tab="teams" href="/tabs/teams">
          <ion-icon :icon="peopleOutline"></ion-icon>
          <ion-label>Drużyny</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="my-teams" href="/tabs/my-teams">
          <ion-icon :icon="peopleCircleOutline"></ion-icon>
          <ion-label>Moje Drużyny</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="profile" href="/tabs/profile">
          <ion-icon :icon="personOutline"></ion-icon>
          <ion-label>Profil</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
      </template>
    </ion-tabs>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage,
  IonTabs,
  IonTabBar,
  IonTabButton,
  IonIcon,
  IonLabel,
  IonRouterOutlet
} from '@ionic/vue'
import { peopleCircleOutline, peopleOutline, personOutline } from 'ionicons/icons'
</script>