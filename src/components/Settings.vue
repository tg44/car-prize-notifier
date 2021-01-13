<template>
  <v-container
    class="mx-auto"
    max-width="400"
  >
    <v-row>
      <v-col class="md-2">
      <v-switch
        v-model="data.enableNonWinningEmail"
        @change="emailChange"
        :loading="switchLoading"
        :disabled="switchLoading"
        label="Email értesítés"
      />
      </v-col>
    </v-row>
    <v-row>
      <v-col class="md-12">
        <v-data-table
          :headers="headers"
          :items="data.tickets"
          sort-by="id"
          class="elevation-1"
        >
          <template v-slot:top>
            <v-toolbar
              flat
            >
              <v-toolbar-title>Kötvény számok</v-toolbar-title>
              <v-divider
                class="mx-4"
                inset
                vertical
              ></v-divider>
              <v-spacer></v-spacer>
              <v-dialog
                v-model="dialog"
                max-width="500px"
              >
                <template v-slot:activator="{ on, attrs }">
                  <v-btn
                    color="primary"
                    dark
                    class="mb-2"
                    v-bind="attrs"
                    v-on="on"
                  >
                    Új felvitele
                  </v-btn>
                </template>
                <v-card>
                  <v-card-text>
                    <v-container>
                      <v-row>
                        <v-col md="12">
                          Írja be a kötvény-számát, vagy számait (amennyiben több kötvényt vásárolt, 1-5 alakban):
                        </v-col>
                        <v-col
                          cols="12"
                          sm="6"
                          md="12"
                        >
                          <v-text-field
                            v-model="inputTicketNumbers"
                            label=""
                          ></v-text-field>
                        </v-col>
                      </v-row>
                    </v-container>
                  </v-card-text>

                  <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn
                      color="blue darken-1"
                      text
                      @click="close"
                    >
                      Mégsem
                    </v-btn>
                    <v-btn
                      color="blue darken-1"
                      text
                      @click="save"
                    >
                      Mentés
                    </v-btn>
                  </v-card-actions>
                </v-card>
              </v-dialog>
              <v-dialog v-model="dialogDelete" max-width="500px">
                <v-card>
                  <v-card-title class="headline">Biztos törölni szeretné?</v-card-title>
                  <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn color="blue darken-1" text @click="closeDelete">Cancel</v-btn>
                    <v-btn color="blue darken-1" text @click="deleteItemConfirm">OK</v-btn>
                    <v-spacer></v-spacer>
                  </v-card-actions>
                </v-card>
              </v-dialog>
            </v-toolbar>
          </template>
          <template v-slot:item._t="{ item }">
            <span>{{ item._t | formatDate }}</span>
          </template>
          <template v-slot:item.actions="{ item }">
            <v-icon
              small
              @click="deleteItem(item)"
            >
              mdi-delete
            </v-icon>
          </template>
        </v-data-table>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import Vue from 'vue';
import firebase from 'firebase';

const user = firebase.auth().currentUser;
const db = firebase.firestore();
const ref = db.collection('user_data').doc(user.uid);

function rangeFromTo(f, t) {
  return [...Array(t - f + 1).keys()].map((i) => i + f);
}

function makeArrUnique(arr, comp) {
  // store the comparison  values in array
  const unique = arr.map((e) => e[comp])
    // store the indexes of the unique objects
    .map((e, i, final) => final.indexOf(e) === i && i)
    // eliminate the false indexes & return unique objects
    .filter((e) => arr[e]).map((e) => arr[e]);

  arr.splice(0, arr.length);
  arr.push(...unique);
  return unique;
}

export default Vue.extend({
  name: 'Settings',

  data: () => ({
    loading: true,
    switchLoading: false,
    data: {
      enableNonWinningEmail: true,
      tickets: [],
    },

    inputTicketNumbers: '',
    editedIndex: -1,
    dialog: false,
    dialogDelete: false,
    headers: [
      {
        text: 'Kötvény szám',
        align: 'start',
        sortable: true,
        width: 200,
        value: 'id',
      },
      {
        text: 'Hozzáadva',
        align: 'end',
        sortable: true,
        width: 200,
        value: '_t',
      },
      {
        text: 'Actions',
        value: 'actions',
        sortable: false,
        width: 50,
      },
    ],
  }),

  watch: {
    dialog(t) {
      return t || this.close();
    },
    dialogDelete(t) {
      return t || this.closeDelete();
    },
  },

  mounted() {
    ref.get().then((snapshot) => {
      if (!snapshot.exists) {
        ref.set({ tickets: [], enableEmail: true }).then(() => {
          this.loading = false;
        });
      } else {
        const d = snapshot.data();
        this.data.tickets.push(...d.tickets);
        if (typeof d.enableNonWinningEmail !== 'undefined') {
          this.data.enableNonWinningEmail = d.enableNonWinningEmail;
        } else {
          this.data.enableNonWinningEmail = true;
          this.emailChange();
        }
        this.loading = false;
      }
    });
  },

  computed: {
    isLoaded() {
      return !this.loading;
    },
  },

  methods: {
    deleteItem(item) {
      this.editedIndex = this.data.tickets.indexOf(item);
      this.dialogDelete = true;
    },

    deleteItemConfirm() {
      this.data.tickets.splice(this.editedIndex, 1);
      ref.update({ tickets: this.data.tickets }).then(() => this.closeDelete());
    },

    close() {
      this.dialog = false;
      this.$nextTick(() => {
        this.editedIndex = -1;
      });
    },

    closeDelete() {
      this.dialogDelete = false;
      this.$nextTick(() => {
        this.editedIndex = -1;
      });
    },

    save() {
      const splited = this.inputTicketNumbers.split('-');
      if (splited.length > 1) {
        const newElements = (rangeFromTo(Number(splited[0].trim()), Number(splited[1].trim())) || []).map((id) => ({ id, _t: Date.now() }));
        this.data.tickets.push(...newElements);
      } else {
        this.data.tickets.push({ id: Number(this.inputTicketNumbers), _t: Date.now() });
      }
      makeArrUnique(this.data.tickets, 'id');
      ref.update({ tickets: this.data.tickets }).then(() => this.close()).catch((err) => { console.log(err.message); });
    },
    emailChange() {
      this.switchLoading = true;
      ref.update({ enableEmail: this.data.enableNonWinningEmail }).then(() => this.switchLoading = false).catch((err) => { console.log(err.message); });
    },
  },
});
</script>
