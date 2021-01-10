import Vue from 'vue';
import Vuetify from 'vuetify/lib/framework';
import hu from 'vuetify/src/locale/hu';

import colors from 'vuetify/lib/util/colors';

Vue.use(Vuetify);

export default new Vuetify({
  lang: {
    locales: { hu },
    current: 'hu',
  },
  icons: {
    iconfont: 'mdi',
  },
  theme: {
    themes: {
      light: {
        primary: colors.lightGreen.darken4,
        secondary: colors.lightGreen.base,
        accent: colors.lightGreen.accent4,
      },
    },
  },
});
