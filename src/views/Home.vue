<template>
  <v-container class="grey lighten-5">
    <v-row no-gutters>
      <v-col order="12">
        <UserCard/>
      </v-col>
      <v-col>
        Az oldal célja, hogy a felhasználóknak emailes értesítést adjon egy-egy <a href="https://www.otpbank.hu/portal/hu/Megtakaritas/ForintBetetek/Gepkocsinyeremeny" target="_blank">Gépkocsi nyereményj betét</a> sorsolás eredményéről!
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import UserCard from '@/components/UserCard.vue'; // @ is an alias to /src

@Component({
  components: {
    UserCard,
  },
})
export default class Home extends Vue {}
</script>
