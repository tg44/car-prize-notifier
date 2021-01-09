import Vue from 'vue';
import Vuetify from 'vuetify/lib/framework';
import hu from 'vuetify/src/locale/hu';

Vue.use(Vuetify);

export default new Vuetify({
  lang: {
    locales: { hu },
    current: 'hu',
  },
  icons: {
    iconfont: 'fa',
  },
});
