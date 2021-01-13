<template>
  <v-tabs
    v-model="tab"
    show-arrows
    background-color="accent"
    icons-and-text
    dark
    grow
  >
    <v-tabs-slider color="primary"></v-tabs-slider>
    <v-tab v-for="i in tabs" :key="i.name">
      <v-icon large>{{ i.icon }}</v-icon>
      <div class="caption py-1">{{ i.name }}</div>
    </v-tab>
    <v-tab-item>
      <v-card class="px-4">
        <v-card-text
          class="text-center"
        >
          <v-btn
            @click="socialLogin"
          >
            <v-icon>
              mdi-google
            </v-icon>
            Google Bejelentkezés
          </v-btn>
        </v-card-text>
      </v-card>
      <v-card class="px-4">
        <v-card-text>
          <v-form ref="loginForm" v-model="valid" lazy-validation>
            <v-row>
              <v-col cols="12">
                <v-text-field v-model="loginEmail" :rules="loginEmailRules" label="E-mail" required></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-text-field v-model="loginPassword" :append-icon="show1?'eye':'eye-off'" :rules="[rules.required, rules.min]" :type="show1 ? 'text' : 'password'" name="input-10-1" label="Password" hint="At least 8 characters" counter @click:append="show1 = !show1"></v-text-field>
              </v-col>
              <v-col class="d-flex" cols="12" sm="6" xsm="12">
              </v-col>
              <v-spacer></v-spacer>
              <v-col class="d-flex" align-end>
                <v-btn x-large block :disabled="!valid" color="success" @click="validate"> Belépés </v-btn>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
      </v-card>
    </v-tab-item>
    <v-tab-item>
      <v-card class="px-4">
        <v-card-text>
          <v-form ref="registerForm" v-model="valid" lazy-validation>
            <v-row>
              <v-col cols="12">
                <v-text-field v-model="email" :rules="emailRules" label="E-mail" required></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-text-field v-model="password" :append-icon="show1 ? 'mdi-eye' : 'mdi-eye-off'" :rules="[rules.required, rules.min]" :type="show1 ? 'text' : 'password'" name="input-10-1" label="Password" hint="At least 8 characters" counter @click:append="show1 = !show1"></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-text-field block v-model="verify" :append-icon="show1 ? 'mdi-eye' : 'mdi-eye-off'" :rules="[rules.required, passwordMatch]" :type="show1 ? 'text' : 'password'" name="input-10-1" label="Confirm Password" counter @click:append="show1 = !show1"></v-text-field>
              </v-col>
              <v-col class="d-flex" cols="12" sm="6" xsm="12">
              </v-col>
              <v-spacer></v-spacer>
              <v-col class="d-flex" align-end>
                <v-btn x-large block :disabled="!valid" color="success" @click="validate"> Regisztrálok </v-btn>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
      </v-card>
    </v-tab-item>
  </v-tabs>
</template>

<script lang="ts">
import Vue from 'vue';
import firebase from 'firebase';

export default Vue.extend({
  name: 'Login',

  data: () => ({
    tab: 0,
    tabs: [
      { name: 'Belépés', icon: 'mdi-account' },
      { name: 'Regisztráció', icon: 'mdi-account-outline' },
    ],
    valid: true,

    email: '',
    password: '',
    verify: '',
    loginPassword: '',
    loginEmail: '',
    loginEmailRules: [
      (v) => !!v || 'Required',
      (v) => /.+@.+\..+/.test(v) || 'E-mail must be valid',
    ],
    emailRules: [
      (v) => !!v || 'Required',
      (v) => /.+@.+\..+/.test(v) || 'E-mail must be valid',
    ],

    show1: false,
    rules: {
      required: (value) => !!value || 'Required.',
      min: (v) => (v && v.length >= 8) || 'Min 8 characters',
    },
  }),
  computed: {
    passwordMatch() {
      return () => this.password === this.verify || 'Password must match';
    },
  },
  methods: {
    validate() {
      if (this.$refs.loginForm.validate()) {
        firebase.auth().signInWithEmailAndPassword(this.loginEmail, this.loginPassword).then((user) => {
          console.log(user);
          this.$router.replace('settings');
        }).catch((err) => {
          alert(`error: ${err.message}`);
        });
      } else {
        firebase.auth().createUserWithEmailAndPassword(this.email, this.password).then((user) => {
          console.log(user);
          firebase.auth().currentUser.sendEmailVerification();
          this.$router.replace('settings');
        }).catch((err) => {
          alert(`error: ${err.message}`);
        });
      }
    },
    reset() {
      this.$refs.form.reset();
    },
    resetValidation() {
      this.$refs.form.resetValidation();
    },
    socialLogin() {
      const provider = new firebase.auth.GoogleAuthProvider();

      firebase.auth().signInWithPopup(provider).then((result) => {
        console.log(result);
        this.$router.replace('settings');
      }).catch((err) => {
        alert(`error: ${err.message}`);
      });
    },
  },
});

</script>
