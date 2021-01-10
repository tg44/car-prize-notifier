<template>
  <v-app>
    <v-app-bar
      app
      color="secondary"
      dark
    >
      <div class="d-flex align-center">
        <v-btn
          color="secondary"
          to="/"
        >
          <v-icon>mdi-car</v-icon>
        </v-btn>
      </div>

      <v-spacer></v-spacer>

      <v-btn
        v-if="isAuthenticated"
        color="primary"
        to="/settings"
      >
        <span class="mr-2">Beállítások</span>
        <v-icon>mdi-cog</v-icon>
      </v-btn>
      <v-btn
        v-if="isAuthenticated"
        color="primary"
        @click="logout"
      >
        <span class="mr-2">Kijelentkezés</span>
        <v-icon>mdi-logout</v-icon>
      </v-btn>
    </v-app-bar>

    <v-main>
      <router-view/>
    </v-main>

    <v-bottom-sheet
      v-model="needConsent"
      persistent
      inset
    >
      <v-card tile>
        <v-list-item>
          <v-list-item-content>
            <v-list-item-title>Az oldal sütiket használ, analitikai célokra!</v-list-item-title>
            <v-list-item-subtitle>Ezek szükségesek a működéshez!</v-list-item-subtitle>
          </v-list-item-content>

          <v-spacer></v-spacer>

            <v-list-item-action>
              <v-btn
                class="mt-6"
                text
                color="error"
                @click="acceptCookie"
              >
                Tudomásul vettem!
              </v-btn>
            </v-list-item-action>
        </v-list-item>
      </v-card>
    </v-bottom-sheet>

    <v-footer
      dark
      padless
    >
      <v-btn to="/about">Adatvédelem</v-btn>
      <v-btn href="https://github.com/tg44/car-prize-notifier" target="_blank">Github</v-btn>
      <v-spacer></v-spacer>
      Az oldal semmilyen jogi kapcsolatban nem áll az OTP Bank-al!
    </v-footer>
  </v-app>
</template>

<script lang="ts">
import firebase from 'firebase';
import Vue from 'vue';

export default Vue.extend({
  name: 'App',

  data: () => ({
    needConsent: true,
  }),

  computed: {
    isAuthenticated() {
      return firebase.auth().currentUser;
    },
  },

  mounted() {
    this.needConsent = !this.$cookies.isKey('cookie-consent');
  },

  methods: {
    acceptCookie() {
      this.$cookies.set('cookie-consent', 'true', '2y');
      this.needConsent = false;
    },
    home() {
      this.$router.replace('/');
    },
    settings() {
      this.$router.replace('/settings');
    },
    logout() {
      firebase.auth().signOut().then(() => {
        this.$router.replace('/');
      });
    },
  },
});
</script>
