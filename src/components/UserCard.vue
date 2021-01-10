<template>
  <v-card
    v-if="!isAuthenticated"
    class="mx-auto"
    max-width="400">
    <Login/>
  </v-card>
  <v-card
    v-else
    class="mx-auto"
    max-width="400">
    <v-list-item three-line>
      <v-list-item-content>
        <v-list-item-title class="mb-4">
          {{ isAuthenticated.displayName }}
        </v-list-item-title>
        <v-list-item-subtitle class="mb-4">
          Email cím: {{ isAuthenticated.email }}
        </v-list-item-subtitle>
        <v-list-item-subtitle v-if="isAuthenticated.emailVerified" class="mb-4">
          Email cím megeősítve
        </v-list-item-subtitle>
        <v-list-item-subtitle v-else class="mb-4">
          Email cím megeősítésre vár
        </v-list-item-subtitle>
      </v-list-item-content>
      <v-list-item-avatar>
        <img v-bind:src="isAuthenticated.photoURL" alt="">
      </v-list-item-avatar>
    </v-list-item>
  </v-card>
</template>

<script>
import { Vue } from 'vue-property-decorator';
import Login from '@/components/Login.vue';
import firebase from 'firebase';

export default Vue.extend({
  name: 'UserCard',

  components: {
    Login,
  },

  computed: {
    isAuthenticated() {
      return firebase.auth().currentUser;
    },
  },
});
</script>
