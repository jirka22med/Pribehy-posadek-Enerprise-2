  const storyData = {
            chapters: [],
            arcs: [],
            timeline: [],
            factions: []
        };

        function formatTime(seconds) {
            const minutes = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
        }

        // === 2026 PROTOCOL - URL konverze ===
        function fixAudioSrc(src) {
            if (!src || !src.trim()) return null;
            try {
                let url = new URL(src.trim());
                if (url.searchParams.has("dl")) {
                    url.searchParams.set("raw", "1");
                    url.searchParams.delete("dl");
                }
                if (!url.searchParams.has("raw")) {
                    url.searchParams.append("raw", "1");
                }
                return url.toString()
                    .replace("www.dropbox.com", "dl.dropboxusercontent.com")
                    .replace("http://", "https://");
            } catch (e) {
                console.warn("⚠️ Neplatná URL:", src);
                return null;
            }
        }

        let currentAudio           = null;
        let currentChapterAudioSrc = null; // Zapamatujeme src pro play po stopAudio

        const mainContent    = document.getElementById('main-content');
        const readerPanel    = document.getElementById('reader-panel');
        const readerOverlay  = document.getElementById('reader-overlay');
        const readerTitle    = document.getElementById('reader-title');
        const readerContent  = document.getElementById('reader-content');
        const readerCloseBtn = document.getElementById('reader-close-btn');
        const audioPlayer   = document.getElementById('audio-player');
        
      const playBtn       = document.getElementById('audio-play');
      const pauseBtn      = document.getElementById('audio-pause');
      const stopBtn       = document.getElementById('audio-stop');
      const progressBar   = document.getElementById('audio-progress');
      const currentTimeEl = document.getElementById('audio-current-time');
      const durationEl    = document.getElementById('audio-duration');

        function attachAudioCallbacks(audio) {
            audio.oncanplaythrough = () => {
                if (currentAudio !== audio) return;
                durationEl.textContent = formatTime(audio.duration);
                progressBar.max        = audio.duration;
                 
                console.log('🎵 Audio připraveno:', currentChapterAudioSrc);
            };
            audio.ontimeupdate = () => {
                if (currentAudio !== audio) return;
                progressBar.value         = audio.currentTime;
                currentTimeEl.textContent = formatTime(audio.currentTime);
            };
            audio.onended = stopAudio;
            audio.onerror = (e) => {
                if (currentAudio !== audio) return;
                console.error('❌ Chyba při načítání zvuku:', e);
                readerContent.innerHTML += '<p class="text-green-500 mt-4 font-bold">Chyba při načítání zvuku. U některých kapitol nahrávky ještě nejsou dokončeny.</p>';
            };
        }

        function stopAudio() {
            if (currentAudio) {
                // Nejdříve odstraníme callbacky aby nepálily po nullování!
                currentAudio.oncanplaythrough = null;
                currentAudio.ontimeupdate     = null;
                currentAudio.onended          = null;
                currentAudio.onerror          = null;
                currentAudio.pause();
                currentAudio.currentTime = 0;
                currentAudio = null;
             //   playIcon.classList.remove('hidden');
              //  pauseIcon.classList.add('hidden');
                progressBar.value         = 0;
                currentTimeEl.textContent = '0:00';
                // ✅ durationEl NECHÁVÁME – délka zůstane zobrazená po zastavení!
                console.log('✅ Audio zastaveno a resetováno.');
            }
        }

        function openReader(chapterId) {
            console.log('openReader volána pro ID:', chapterId);
            stopAudio();
            currentChapterAudioSrc = null; // Reset src při otevření nové kapitoly

            const chapter = storyData.chapters.find(ch => ch.id === chapterId);
            if (!chapter) {
                console.error('❌ Kapitola s ID ' + chapterId + ' nebyla nalezena.');
                readerTitle.textContent = 'Chyba načítání';
                readerContent.innerHTML = '<p class="text-red-500">Chyba: Kapitola nebyla nalezena.</p>';
                readerOverlay.classList.remove('hidden');
                readerPanel.classList.add('active');
                return;
            }

            readerTitle.textContent = `Kapitola ${chapter.id}: ${chapter.title}`;
            readerContent.innerHTML = '<p class="text-center text-gray-500">Načítání obsahu...</p>';
            readerPanel.classList.add('active');
            readerOverlay.classList.remove('hidden');

            setTimeout(() => {
                readerContent.innerHTML = chapter.content;
                console.log('📖 Obsah kapitoly vložen:', chapter.title);

                const fixedSrc = fixAudioSrc(chapter.audioSrc);

                if (fixedSrc) {
                    audioPlayer.classList.remove('hidden');
                    currentChapterAudioSrc = fixedSrc; // ← zapamatujeme src
                    const audio = new Audio(fixedSrc);
                    currentAudio = audio;
                    attachAudioCallbacks(audio);
                    audio.load();
                } else {
                    console.warn('⚠️ Kapitola ' + chapter.id + ' nemá audioSrc.');
                    readerContent.innerHTML += '<p class="text-gray-500 mt-4">Pro tuto kapitolu není k dispozici audio.</p>';
                    audioPlayer.classList.add('hidden');
                }
            }, 50);
        }

        function closeReader() {
            stopAudio();
            currentChapterAudioSrc = null;
            readerPanel.classList.remove('active');
            readerOverlay.classList.add('hidden');
            console.log('📕 Čtecí panel zavřen.');
        }

        function initializeSectionsData() {
            const arcsMap = new Map();
            storyData.chapters.forEach(chapter => {
                if (!arcsMap.has(chapter.arc)) {
                    arcsMap.set(chapter.arc, {
                        id: `arc-${arcsMap.size + 1}`,
                        name: chapter.arc,
                        chapters: []
                    });
                }
                arcsMap.get(chapter.arc).chapters.push(chapter);
            });
            storyData.arcs = Array.from(arcsMap.values());

            storyData.timeline = storyData.chapters.map(chapter => ({
                id:        chapter.id,
                year:      `Rok ${2151 + chapter.id - 1}`,
                event:     chapter.event,
                chapterId: chapter.id,
                title:     chapter.title
            }));

            storyData.factions = [
                { id: 'faction-1',  name: 'Hvězdná flotila',    icon: '🚀', description: 'Průzkumná a obranná složka Federace.' },
                { id: 'faction-2',  name: 'Galaktická koalice', icon: '💥', description: 'Vojensky orientovaná organizace, bývalá Federace.' },
                { id: 'faction-3',  name: 'Kronadové',          icon: '👽', description: 'Nová spojenecká rasa.' },
                { id: 'faction-4',  name: 'Xorathi',            icon: '👾', description: 'Agresivní expanzivní rasa.' },
                { id: 'faction-5',  name: 'Ztracení',           icon: '🕰️', description: 'Tajemní pánové času a prostoru.' },
                { id: 'faction-6',  name: 'Xindi',              icon: '🦎', description: 'Rasa s komplexní historií, nyní spojenec.' },
                { id: 'faction-7',  name: 'Klingoni',           icon: '⚔️', description: 'Válečnická rasa, občasný spojenec.' },
                { id: 'faction-8',  name: 'Romulani',           icon: '🦅', description: 'Tajemná a nedůvěřivá rasa.' },
                { id: 'faction-9',  name: 'Andoriani',          icon: '🔷', description: 'Věrní spojenci Federace.' },
                { id: 'faction-10', name: 'Tellarité',          icon: '🐷', description: 'Tvrdohlaví, ale spolehliví spojenci.' },
            ];

            console.log(`✅ Data inicializována - kapitol: ${storyData.chapters.length}`);
        }

        function renderStoryArcs() {
            let html = '<div class="text-center mb-8"><h2 class="text-3xl font-semibold text-white-700">Příběhové Oblouky</h2><p class="text-white-500 mt-2">Prozkoumejte ságu rozdělenou do tematických celků.</p></div>';
            html += '<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">';
            storyData.arcs.forEach(arc => {
                html += `
                    <div class="arc-card">
                        <h3>${arc.name}</h3>
                        <ul>
                            ${arc.chapters.map(ch => `
                                <li>
                                    <button data-chapter-id="${ch.id}" class="chapter-btn w-full text-left">
                                        ${ch.title} (Kap. ${ch.id})
                                    </button>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                `;
            });
            html += '</div>';
            mainContent.innerHTML = html;
            document.querySelectorAll('.chapter-btn').forEach(btn => {
                btn.addEventListener('click', () => openReader(parseInt(btn.dataset.chapterId)));
            });
        }

        function renderTimeline() {
            let html = '<div class="text-center mb-12"><h2 class="text-3xl font-semibold">Časová Osa Událostí</h2><p class="mt-2">Sledujte klíčové momenty příběhu v chronologickém pořadí.</p></div>';
            html += '<div class="relative timeline">';
            storyData.timeline.forEach((item) => {
                html += `
                    <div class="timeline-item">
                        <div class="timeline-dot"></div>
                        <div class="timeline-content">
                           <p class="text-sm">${item.year}</p>
                           <h3>${item.title}</h3>
                           <p>${item.event}</p>
                           <button data-chapter-id="${item.chapterId}" class="chapter-btn">Zobrazit kapitolu &rarr;</button>
                        </div>
                    </div>
                `;
            });
            html += '</div>';
            mainContent.innerHTML = html;
            document.querySelectorAll('.chapter-btn').forEach(btn => {
                btn.addEventListener('click', () => openReader(parseInt(btn.dataset.chapterId)));
            });
        }

        function renderFactions() {
            let html = '<div class="text-center mb-8"><h2 class="text-3xl font-semibold">Postavy a Frakce</h2><p class="mt-2">Seznamte se s klíčovými hráči galaktické scény.</p></div>';
            html += '<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">';
            storyData.factions.forEach(faction => {
                html += `
                    <div class="faction-card">
                        <div class="text-4xl">${faction.icon}</div>
                        <h3>${faction.name}</h3>
                        <p>${faction.description}</p>
                    </div>
                `;
            });
            html += '</div>';
            mainContent.innerHTML = html;
        }

        function setActiveNav(activeId) {
            document.querySelectorAll('.main-nav-btn').forEach(btn => btn.classList.remove('active'));
            document.getElementById(activeId).classList.add('active');
        }

        document.addEventListener('DOMContentLoaded', () => {

            const rawChaptersData = [
                { id: 1,  arc: "Počátek v Andromedě",      title: "Časová past na Zephyrii",                   audioSrc: "https://dl.dropboxusercontent.com/scl/fi/bski2kzexy3qdlbmgsxss/kapitola-1.wav?rlkey=na7nywvdr4qtx0r7jwd60s7it&st=ruqnq79s&dl=1",   event: "Enterprise vtažena do galaxie Andromeda.", manuallyEdited: false, lastEditedAt: null },
                { id: 2,  arc: "Počátek v Andromedě",      title: "Tajemství galaxie Andromeda",               audioSrc: "https://dl.dropboxusercontent.com/scl/fi/9jqh1qe1t4y5b1esu7z51/kapitola-2.wav?rlkey=zycm6m6prvht4g9pbe9c7relr&st=7cmik9w2&dl=1",   event: "Setkání se Strážci času a 'Temným srdcem'.", manuallyEdited: false, lastEditedAt: null },
                { id: 3,  arc: "Návrat a nová Federace",   title: "Návrat s otazníky",                         audioSrc: "https://dl.dropboxusercontent.com/scl/fi/2x6h3c6wqp8k5w56g2hze/kapitola-3.wav?rlkey=83zmb0kqo1cc8gt6vffq7m0iv&st=d5wzr9w4&dl=1",   event: "Návrat do budoucnosti a změněná Federace.", manuallyEdited: false, lastEditedAt: null },
                { id: 4,  arc: "Návrat a nová Federace",   title: "Hlubší stíny",                              audioSrc: "https://dl.dropboxusercontent.com/scl/fi/zqn76vdhm6nhyghpbrgwk/kapitola-4.wav?rlkey=emxpis829qzsuf12uh5ehtpt6&st=c2hn2ibb&dl=1",   event: "Kontakt s Odbojovou flotilou admirála Katana.", manuallyEdited: false, lastEditedAt: null },
                { id: 5,  arc: "Návrat a nová Federace",   title: "Záblesky války",                            audioSrc: "https://dl.dropboxusercontent.com/scl/fi/h5shsqdqk94xdi34zbzq4/kapitola-5.wav?rlkey=k6r5ll0zosn5hfuzkauomqylj&st=zi9fueip&dl=1",   event: "První bitva proti Galaktické koalici.", manuallyEdited: false, lastEditedAt: null },
                { id: 6,  arc: "Válka o galaxii",          title: "Poslední sázka",                            audioSrc: "https://dl.dropboxusercontent.com/scl/fi/tcsjbxiu76u8njja0xunq/kapitola-6.wav?rlkey=r3urvqteliyr6b1ydw4gnq92p&st=znvmtrjg&dl=1",   event: "Mise na zničení superzbraně v mlhovině Thalax.", manuallyEdited: false, lastEditedAt: null },
                { id: 7,  arc: "Válka o galaxii",          title: "Útěk před zkázou",                          audioSrc: "https://dl.dropboxusercontent.com/scl/fi/co3yl6096mmudqiwx230m/kapitola-7.wav?rlkey=zjpxwom0xwnvl2ok9fh5s0d76&st=02qgp2xh&dl=1",   event: "Útěk z explodující stanice.", manuallyEdited: false, lastEditedAt: null },
                { id: 8,  arc: "Válka o galaxii",          title: "Spojenectví ve stínu války",                audioSrc: "https://dl.dropboxusercontent.com/scl/fi/cegy3xgjst70pc9jogera/kapitola-8.wav?rlkey=czij00yxulpzfjq3p4c6l1is6&st=zx5ermdd&dl=1",   event: "Formování aliance s Klingony a Romulany.", manuallyEdited: false, lastEditedAt: null },
                { id: 9,  arc: "Válka o galaxii",          title: "V srdci Romulanského impéria",              audioSrc: "https://dl.dropboxusercontent.com/scl/fi/wvetimvrg7gwakf7kbxu8/kapitola-9.wav?rlkey=7vvj77q7dwtgzcx0vu2a3wyob&st=p5326xlo&dl=1",   event: "Jednání s Romulany a společný útok.", manuallyEdited: false, lastEditedAt: null },
                { id: 10, arc: "Válka o galaxii",          title: "Vzestup a pád",                             audioSrc: "https://dl.dropboxusercontent.com/scl/fi/a6m4se7pg12x4c129tv78/kapitola-10.wav?rlkey=kemggsfyqpnku9kvws6lce85p&st=mupixzo9&dl=1",  event: "Romulanská zrada a bitva o Acheron.", manuallyEdited: false, lastEditedAt: null },
                { id: 11, arc: "Nové aliance",             title: "Nové aliance",                              audioSrc: "https://dl.dropboxusercontent.com/scl/fi/t41fohw659gwnv9ts71h9/kapitola-11.wav?rlkey=v6uqyy8rw8zyw4h4y6qh0ejo5&st=fo460y0e&dl=1",  event: "Objevení nové civilizace a navázání spojenectví.", manuallyEdited: false, lastEditedAt: null },
                { id: 12, arc: "Nové aliance",             title: "Tíha minulosti",                            audioSrc: "https://dl.dropboxusercontent.com/scl/fi/4n73i1lb7l482e2zy004e/kapitola-12.wav?rlkey=ri23n5qihx5ttn9dfbfmj4vpd&st=8rm5ekj0&dl=1",  event: "Návrat Romulanů a obrana spojenců.", manuallyEdited: false, lastEditedAt: null },
                { id: 13, arc: "Nové aliance",             title: "Zteč na romulanskou loď",                   audioSrc: "https://dl.dropboxusercontent.com/scl/fi/02ddw62zdgoplquykfxxk/kapitola-13.wav?rlkey=ni2vk119rhxxcfvn1i7mvk573&st=ndyqs0dt&dl=1",  event: "Infiltrace nepřátelské lodi a finální souboj.", manuallyEdited: false, lastEditedAt: null },
                { id: 14, arc: "Nové aliance",             title: "Návrat domů a nové začátky",                audioSrc: "https://dl.dropboxusercontent.com/scl/fi/7pkmzepb7xosys65lcbzv/kapitola-14.wav?rlkey=dtx7omc81t6h16g9148kupxju&st=xve7bhkc&dl=1",  event: "Pomoc nové civilizaci s budováním budoucnosti.", manuallyEdited: false, lastEditedAt: null },
                { id: 15, arc: "Kronadská válka",          title: "Návrat ke hvězdám",                         audioSrc: "https://dl.dropboxusercontent.com/scl/fi/4s6ly2xvg8rcpre0ixvol/kapitola-15.wav?rlkey=i3hb22usknj3jdip1c7x2827g&st=qj4wnozp&dl=1",  event: "Setkání s rasou Kronadů.", manuallyEdited: false, lastEditedAt: null },
                { id: 16, arc: "Kronadská válka",          title: "Setkání s neznámem",                        audioSrc: "https://dl.dropboxusercontent.com/scl/fi/r65pmkb4ekhukgbfvij9c/kapitola-16.wav?rlkey=fnsnui4885eh4bchjw9tpjof1&st=n5aqkqk5&dl=1",  event: "Odhalení hrozby Xorathů.", manuallyEdited: false, lastEditedAt: null },
                { id: 17, arc: "Kronadská válka",          title: "Rozhodující krok",                          audioSrc: "https://dl.dropboxusercontent.com/scl/fi/8jfywr9ysalymp1ux5njw/kapitola-17.wav?rlkey=z0xdonjugsqpes594uzlvd6ly&st=ehaur0vo&dl=1",  event: "Formování aliance s Kronady.", manuallyEdited: false, lastEditedAt: null },
                { id: 18, arc: "Kronadská válka",          title: "Konflikt na obzoru",                        audioSrc: "https://dl.dropboxusercontent.com/scl/fi/vekhzjzzs2c4zeanqe6k1/kapitola-18.wav?rlkey=ch6b9eq8702k8ayrcsae3m9ky&st=pr37gftk&dl=1",  event: "Strategické plánování proti Xorathům.", manuallyEdited: false, lastEditedAt: null },
                { id: 19, arc: "Kronadská válka",          title: "První úder",                                audioSrc: "https://dl.dropboxusercontent.com/scl/fi/j3pze9vy8vle3mz5k4yq9/kapitola-19.wav?rlkey=e3q4yrqg1b413v7363aouw8ju&st=x9kzmapi&dl=1",  event: "První společná bitva s Kronady proti Xorathům.", manuallyEdited: false, lastEditedAt: null },
                { id: 20, arc: "Kronadská válka",          title: "Poslední vzdor",                            audioSrc: "https://dl.dropboxusercontent.com/scl/fi/czkzpt8pa670zxqmmu2zy/kapitola-20.wav?rlkey=lvrgdw87xf0cbfk16bnp607u2&st=z7it6xbh&dl=1",  event: "Vítězství nad Xorathy.", manuallyEdited: false, lastEditedAt: null },
                { id: 21, arc: "Záhada Ztracených",        title: "Hluboký vesmír 9",                          audioSrc: "https://dl.dropboxusercontent.com/scl/fi/a6zl9gkwgukwo3wweqdxt/kapitola-21.wav?rlkey=c2km633niog47txnsq1wgagq5&st=ooov8wfv&dl=1",  event: "Přílet k DS9 a tajemný signál.", manuallyEdited: false, lastEditedAt: null },
                { id: 22, arc: "Záhada Ztracených",        title: "Brána Ztracených",                          audioSrc: "https://dl.dropboxusercontent.com/scl/fi/ais0xn232x53mjru7vxqn/kapitola-22.wav?rlkey=0zkocz0qvhr0w6qvtk5o9bj4r&st=tj1skuq5&dl=1",  event: "Aktivace prastaré brány.", manuallyEdited: false, lastEditedAt: null },
                { id: 23, arc: "Záhada Ztracených",        title: "Tajemství Ztracených",                      audioSrc: "https://dl.dropboxusercontent.com/scl/fi/o6qrn2fwky9g9bn04a6cs/kapitola-23.wav?rlkey=edbvmbp2c14fmn5qpvb441o00&st=l73zajid&dl=1",  event: "Odhalení historie pánů času a prostoru.", manuallyEdited: false, lastEditedAt: null },
                { id: 24, arc: "Záhada Ztracených",        title: "Poselství Ztracených",                      audioSrc: "https://dl.dropboxusercontent.com/scl/fi/2nkjme6yffnp3n14l4eas/kapitola-24.wav?rlkey=piy96260mfz2x9ouv3mi1mbwa&st=0pxe4vg4&dl=1",  event: "Varování a hrozba návratu.", manuallyEdited: false, lastEditedAt: null },
                { id: 25, arc: "Záhada Ztracených",        title: "Bitva o Deep Space Nine",                   audioSrc: "https://dl.dropboxusercontent.com/scl/fi/rpo3ub7ht4i7wmoxg9gwa/kapitola-25.wav?rlkey=g9fr7ptqpni2g9fxh1l3ypxr3&st=46ak8ogx&dl=1",  event: "Obrana stanice proti flotile Ztracených.", manuallyEdited: false, lastEditedAt: null },
                { id: 26, arc: "Záhada Ztracených",        title: "Temnota před Úsvitem",                      audioSrc: "https://dl.dropboxusercontent.com/scl/fi/xeehdcepeoxaajh0obtre/kapitola-26.wav?rlkey=7xyvh161eub801pmsnrji04n5&st=z6rzprdp&dl=1",  event: "Objevení a zničení mateřské lodi.", manuallyEdited: false, lastEditedAt: null },
                { id: 27, arc: "Záhada Ztracených",        title: "Nové začátky",                              audioSrc: "https://dl.dropboxusercontent.com/scl/fi/9d8eeyrzvusnlact95nyp/kapitola-27.wav?rlkey=rs19d8sh1bm77lelffqj3yf0h&st=oolyu5bz&dl=1",  event: "Konec hrozby a oslavy.", manuallyEdited: false, lastEditedAt: null },
                { id: 28, arc: "Nový nepřítel",            title: "Nové setkání s Xindi",                      audioSrc: "https://dl.dropboxusercontent.com/scl/fi/lw1507xu08nf63sx9oa2e/kapitola-28.wav?rlkey=rrn05voaq9rlz4hyhzw74zo6d&st=1wbms1cs&dl=1",  event: "Prosba o pomoc od Xindi.", manuallyEdited: false, lastEditedAt: null },
                { id: 29, arc: "Nový nepřítel",            title: "Společný nepřítel",                         audioSrc: "https://dl.dropboxusercontent.com/scl/fi/0ehmov74ezr0niu547ynl/kapitola-29.wav?rlkey=aod59rg2wmjy0m8m8a9mac710&st=qt06ej4c&dl=1",  event: "Formování nové aliance proti vetřelcům.", manuallyEdited: false, lastEditedAt: null },
                { id: 30, arc: "Nový nepřítel",            title: "Rozhodující střetnutí",                     audioSrc: "https://dl.dropboxusercontent.com/scl/fi/db0z6gwap5wto89hpdh2q/kapitola-30.wav?rlkey=fp9jg33batmt46qh1s9nzbsc0&st=5y9ia9jx&dl=1",  event: "Vítězná bitva spojené flotily.", manuallyEdited: false, lastEditedAt: null },
                { id: 31, arc: "Křehký mír",               title: "Střetnutí s Klingony, Andoriany, Romulany", audioSrc: "https://dl.dropboxusercontent.com/scl/fi/vxrslv8fb4krf1fpqfjjt/kapitola-31.wav?rlkey=iy4cbqpnm7spyjpe384q8ymvv&st=hhehcdtm&dl=1",  event: "Politické napětí a diplomatická jednání.", manuallyEdited: false, lastEditedAt: null },
                { id: 32, arc: "Konvergence generací",     title: "Spojení Voyageru a Enterprise-D",           audioSrc: "https://dl.dropboxusercontent.com/scl/fi/vbwtb1jrp9qtnxldl1dk3/kapitola-32.wav?rlkey=9g7h9v6u6w8trh6ngq3kw9zig&st=4odlpeq7&dl=1",  event: "Setkání Voyageru a Enterprise-D u časoprostorové anomálie.", manuallyEdited: false, lastEditedAt: null },
                { id: 33, arc: "Konvergence generací",     title: "Návrat Enterprise NX-01",                   audioSrc: "https://dl.dropboxusercontent.com/scl/fi/w12vncdcwkvvlb2rvgv91/kapitola-33.wav?rlkey=dqm0o1j8dfy8j491xycz5m5xa&st=t37ii1rr&dl=1",  event: "Objevení ztracené lodi NX-01.", manuallyEdited: false, lastEditedAt: null },
                { id: 34, arc: "Konvergence generací",     title: "Tajemství prastaré civilizace",             audioSrc: "https://dl.dropboxusercontent.com/scl/fi/ts4iecs4b5g2jooyk40xd/kapitola-34.wav?rlkey=msgg6a8wny8p3rs73eoh9e1r1&st=nuc6bt20&dl=1",  event: "Odhalení technologie ovládající časoprostor.", manuallyEdited: false, lastEditedAt: null },
                { id: 35, arc: "Konvergence generací",     title: "Hrozba z temnoty",                          audioSrc: "https://dl.dropboxusercontent.com/scl/fi/u5umgelznk837b02233qt/kapitola-35.wav?rlkey=l613fq5r7ugx33t25ykz6ckl4&st=clmi9gt1&dl=1",  event: "Zrádný admirál a válka s temnou flotilou.", manuallyEdited: false, lastEditedAt: null },
                { id: 36, arc: "Konvergence generací",     title: "Nové obzory",                               audioSrc: "https://dl.dropboxusercontent.com/scl/fi/azn1401i2tsdyzancxntc/kapitola-36.wav?rlkey=fqoqnolf6tp2xlgbihc1uu8v1&st=h15tua5f&dl=1",  event: "Rekonstrukce a nová spojenectví po válce.", manuallyEdited: false, lastEditedAt: null },
                { id: 37, arc: "Válka strojů",             title: "Nové Hrozby",                               audioSrc: "https://dl.dropboxusercontent.com/scl/fi/futnm4de91g7h7p3wdnfi/kapitola-37.wav?rlkey=2lxjgnif2p69m05opdv8cicso&st=duwlnbvt&dl=1",  event: "Útoky umělé inteligence z jiné dimenze.", manuallyEdited: false, lastEditedAt: null },
                { id: 38, arc: "Válka strojů",             title: "Společné velení",                           audioSrc: "https://dl.dropboxusercontent.com/scl/fi/p0tzlrzqj6er1j56b7prt/kapitola-38.wav?rlkey=lnbu8a9qpvu7h3okcuh4lrvd5&st=0id8ccwb&dl=1",  event: "Pokus o vyjednávání se stroji.", manuallyEdited: false, lastEditedAt: null },
                { id: 39, arc: "Válka strojů",             title: "Aliance na pokraji zkázy",                  audioSrc: "https://dl.dropboxusercontent.com/scl/fi/brgz7nh2es7ck9ubt08yg/kapitola-39.wav?rlkey=d2svq670defuk8feoesusedip&st=sbd9ngfz&dl=1",  event: "Romulanská zrada a ultimátum od strojů.", manuallyEdited: false, lastEditedAt: null },
                { id: 40, arc: "Válka strojů",             title: "Velké oslavy",                              audioSrc: "https://dl.dropboxusercontent.com/scl/fi/jnatm6xldsffkvgbyscd9/kapitola-40.wav?rlkey=5ewmyq66dz5jkn1a6tkbj1nae&st=gl4jd6yx&dl=1",  event: "Vítězství a oslavy na Deep Space Nine.", manuallyEdited: false, lastEditedAt: null },
                { id: 41, arc: "Nová Era",   title: "Odkaz Hvězdné flotily",  audioSrc: " ", event: "Nová era začíná", manuallyEdited: false, lastEditedAt: null },
                { id: 42, arc: "Nová Era",   title: "Temné horizonty",        audioSrc: " ", event: "Náhlý signál", manuallyEdited: false, lastEditedAt: null },
                { id: 43, arc: "Nová Era",   title: "Vzestup symbiontů",      audioSrc: " ", event: "Vzestup symbiontů", manuallyEdited: false, lastEditedAt: null },
                { id: 44, arc: "Nová Era",   title: "Stín Xar'Vaaků",         audioSrc: " ", event: "Klid před bouří", manuallyEdited: false, lastEditedAt: null },
                { id: 45, arc: "Nová Era 2", title: "Temnota za horizontem",  audioSrc: " ", event: "Roztržená hranice", manuallyEdited: false, lastEditedAt: null },
                { id: 46, arc: "Nová Era 2", title: "Když světlo pálí",       audioSrc: " ", event: "První úder", manuallyEdited: false, lastEditedAt: null },
                { id: 47, arc: "Nová Era 2", title: "Echo NX-01",             audioSrc: " ", event: "Slabý šepot v tichu", manuallyEdited: false, lastEditedAt: null },
                { id: 48, arc: "Nová Era 2", title: "Ozvěny a temný dar",     audioSrc: " ", event: "Hluk po tichu", manuallyEdited: false, lastEditedAt: null },
                { id: 49, arc: "Nová Era 3", title: "Stíny nad Nocturne",     audioSrc: " ", event: "Mlha z dávných časů", manuallyEdited: false, lastEditedAt: null },
                { id: 50, arc: "Nová Era 3", title: "Hranice neznáma",        audioSrc: " ", event: "Tichá bouře", manuallyEdited: false, lastEditedAt: null },
            ];

            rawChaptersData.forEach(chData => {
                const chapterEl = document.getElementById(`chapter${chData.id}`);
                chData.content = chapterEl
                    ? chapterEl.innerHTML
                    : `<p>Obsah kapitoly ${chData.id} se nepodařilo načíst.</p>`;
                if (!chapterEl) console.warn(`⚠️ HTML element pro kapitolu ${chData.id} nebyl nalezen!`);
                storyData.chapters.push(chData);
            });

            console.log(`✅ Načteno ${storyData.chapters.length} kapitol z DOMu.`);
            initializeSectionsData();

            // Nav buttons
            document.getElementById('nav-arcs').addEventListener('click',     () => { renderStoryArcs(); setActiveNav('nav-arcs'); });
            document.getElementById('nav-timeline').addEventListener('click', () => { renderTimeline();   setActiveNav('nav-timeline'); });
            document.getElementById('nav-factions').addEventListener('click', () => { renderFactions();   setActiveNav('nav-factions'); });

             
         
// Reader controls
readerCloseBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    closeReader();
});
readerOverlay.addEventListener('click', closeReader);

            // Audio play/pause – funguje i po stopAudio!
            // === AKTUALIZOVANÉ AUDIO LISTENERY ===
// Nahraď starý playPauseBtn listener tímto blokem:

// ▶ PLAY – vždy spustí audio
playBtn.addEventListener('click', () => {
    if (!currentAudio && currentChapterAudioSrc) {
        // Po stopAudio – znovu vytvoříme instanci
        const audio = new Audio(currentChapterAudioSrc);
        currentAudio = audio;
        attachAudioCallbacks(audio);
        audio.play().catch(e => console.warn('⚠️ Play selhal:', e.message));
        playBtn.classList.add('active');    // 🟢 zelená ON
        console.log('▶ Play spuštěn (nová instance)');
    } else if (currentAudio) {
        currentAudio.play().catch(e => console.warn('⚠️ Play selhal:', e.message));
        playBtn.classList.add('active');    // 🟢 zelená ON
        console.log('▶ Play spuštěn (resume)');
    }
});

// ⏸ PAUSE – vždy pozastaví
pauseBtn.addEventListener('click', () => {
    if (currentAudio && !currentAudio.paused) {
        currentAudio.pause();
        playBtn.classList.remove('active'); // 🔵 zelená OFF
        console.log('⏸ Pozastaveno');
    }
});

// ⏹ STOP – reset na začátek
stopBtn.addEventListener('click', stopAudio);
playBtn.classList.remove('active'); // 🔵 zelená OFF při stop
            
// PROGRESS BAR
progressBar.addEventListener('input', (e) => {
    if (currentAudio) currentAudio.currentTime = e.target.value;
});

            // === ZÁVĚREČNÉ HLÁŠENÍ Z MŮSTKU ===
            console.log("🚀 INDEX.JS VERZE 2 - HLÁŠENÍ Z MŮSTKU");
            console.log("📦 Kapitoly načteny       : z DOMu");
            console.log("🎵 Audio funkce           : aktivní + play po stop opraven");
            console.log("🔧 URL konverze           : 2026 protokol");
            console.log("🛡️  Error handling         : aktivní");
            console.log(`✅ Celkem kapitol         : ${storyData.chapters.length}`);
            console.log("🖖 Hvězdná flotila online!");

            renderStoryArcs();
            setActiveNav('nav-arcs');
        });
