/**
 * LMS-Material
 *
 * Copyright (c) 2018-2019 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */

Vue.use(VueLazyload);

var app = new Vue({
    el: '#app',
    data() {
        return { dialogs: { uisettings: false, playersettings: false, info: false, sync: false, group: false,
                            volume: false, manage: false, rndmix: false, favorite: false, rating: false, sleep: false } }
    },
    created() {
        var uiMode = parseQueryParams();
        if (undefined==uiMode) {
            uiMode = getLocalStorageVal("uiMode", "mobile");
        }
        this.$store.commit('initUiSettings');

        bus.$on('dlg.open', function(name, a, b) {
            this.dialogs[name] = true; // Mount
            this.$nextTick(function () {
                bus.$emit(name+".open", a, b);
            });
        }.bind(this));

        this.splitterPercent = parseInt(getLocalStorageVal("splitter", "50"));
        this.splitter = this.splitterPercent;
        document.documentElement.style.setProperty('--splitter-pc', this.splitter);

        initApp(this);
        this.openDialogs = 0;

        bus.$on('dialogOpen', function(name, open) {
            if (open) {
                this.openDialogs++;
            } else if (this.openDialogs>0) {
                this.openDialogs--;
            }
        }.bind(this));

        this.$nextTick(function () {
           this.$store.commit('setUiMode', uiMode);
        });
        bus.$on('setDesktopLayout', function(desktopLayout) {
            this.$store.commit('setDesktopLayout', desktopLayout);
        }.bind(this));
    },
    computed: {
        darkUi() {
            return this.$store.state.darkUi;
        },
        lang() {
            return this.$store.state.lang;
        },
        page() {
            return this.$store.state.page;
        },
        desktop() {
            return this.$store.state.desktop;
        }
    },
    components: {
        VueSplitter
    },
    methods: {
        swipe(ev, direction) {
            if (this.$store.state.desktop || this.openDialogs>0) {
                return;
            }
            if (this.$store.state.page=='now-playing') {
                // Ignore swipes on position slider...
                var elem = document.getElementById("pos-slider");
                if (elem) {
                    var rect = elem.getBoundingClientRect();
                    if ((rect.x-4)<=ev.touchstartX && (rect.x+rect.width+8)>=ev.touchstartX &&
                        (rect.y-4)<=ev.touchstartY && (rect.y+rect.height+8)>=ev.touchstartY) {
                        return;
                    }
                }
            }
            if ('l'==direction) {
                if (this.$store.state.page=='browse') {
                    this.$store.commit('setPage', 'now-playing');
                } else if (this.$store.state.page=='now-playing') {
                    this.$store.commit('setPage', 'queue');
                } else if (this.$store.state.page=='queue') {
                    this.$store.commit('setPage', 'browse');
                }
            } else if ('r'==direction) {
                if (this.$store.state.page=='browse') {
                    this.$store.commit('setPage', 'queue');
                } else if (this.$store.state.page=='now-playing') {
                    this.$store.commit('setPage', 'browse');
                } else if (this.$store.state.page=='queue') {
                    this.$store.commit('setPage', 'now-playing');
                }
            }
        },
        splitterResized(val) {
            if (!this.$store.state.desktop) {
                return;
            }
            var f = Math.floor(val/2)*2;
            if (f!=this.splitter) {
                setLocalStorageVal("splitter", f);
                document.documentElement.style.setProperty('--splitter-pc', f);
                this.splitter=f;
                if (!this.splitterChangedAnimationFrameReq) {
                    this.scrollAnimationFrameReq = window.requestAnimationFrame(() => {
                        bus.$emit('splitterChanged');
                        this.scrollAnimationFrameReq = undefined;
                    });
                }
            }
        }

    },
    store,
    lmsServer
})

