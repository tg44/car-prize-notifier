import Vue from 'vue';
import firebase from 'firebase';
import 'firebase/firestore';
import { firestorePlugin } from 'vuefire';
import moment from 'moment';
import vueCookies from 'vue-cookies';
import App from './App.vue';
import router from './router';
import vuetify from './plugins/vuetify';

Vue.config.productionTip = false;

Vue.filter('formatDate', (value) => {
  if (value) {
    return moment(value).format('YYYY.MM.DD hh:mm:ss');
  }
  return 'nem ismert';
});

Vue.use(vueCookies);

Vue.use(firestorePlugin);
const firebaseConfig = {
  apiKey: 'AIzaSyCDNZwCqBhn6w7r4FJrtB2M_Czrr4SYCds',
  authDomain: 'car-prize-notifier.firebaseapp.com',
  projectId: 'car-prize-notifier',
  storageBucket: 'car-prize-notifier.appspot.com',
  messagingSenderId: '891909311465',
  appId: '1:891909311465:web:348b166908f56624f59978',
  measurementId: 'G-NWS9S3QL7V',
};

const firebaseApp = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const { Timestamp, GeoPoint } = firebase.firestore;
export {
  Timestamp,
  GeoPoint,
  firebaseApp,
  db,
};

firebase.auth().onAuthStateChanged(() => {
  new Vue({
    router,
    vuetify,
    render: (h) => h(App),
    data: () => ({
    }),
    firestore: {
    },
  }).$mount('#app');
});
