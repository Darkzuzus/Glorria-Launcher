

'use strict';

import { logger, database, changePanel} from '../utils.js';
const dataDirectory = process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + '/Library/Application Support' : process.env.HOME)
const { Launch, Status } = require('minecraft-java-core');
const { ipcRenderer } = require('electron');
const launch = new Launch();
const pkg = require('../package.json');

class Boutique {
    static id = "boutique";
    async init(config, news) {
        this.database = await new database().init();
        this.config = config
        this.news = await news
        this.initLaunch();
        this.initStatusServer();
        this.initBtn();
        this.bkgrole();
    }

    async bkgrole () {
        let uuid = (await this.database.get('1234', 'accounts-selected')).value;
        let account = (await this.database.get(uuid.selected, 'accounts')).value;
        
        let blockRole = document.createElement("div");
        if (this.config.role === true && account.user_info.role) {

        blockRole.innerHTML = `
        <div>Grade: ${account.user_info.role.name}</div>
        `
        document.querySelector('.player-roles').appendChild(blockRole);
        }
        if(!account.user_info.role) {
            document.querySelector(".player-roles").style.display = "none";
        }


        let blockMonnaie = document.createElement("div");
        if (this.config.money === true) {
        blockMonnaie.innerHTML = `
        <div>${account.user_info.monnaie} Crédits</div>
        `
        document.querySelector('.player-monnaies').appendChild(blockMonnaie);
        }
        if(account.user_info.monnaie === "undefined") {
            document.querySelector(".player-monnaies").style.display = "none";
        }
        if (this.config.whitelist_activate === true) {
        if (!this.config.whitelist.includes(account.name)) {
            document.querySelector(".play-btns").style.backgroundColor = "#696969"; // Couleur de fond grise
            document.querySelector(".play-btns").style.pointerEvents = "none"; // Désactiver les événements de souris
            document.querySelector(".play-btns").style.boxShadow = "none";
            document.querySelector(".play-btns").textContent = "Indisponible";        
        }
    }
        
        if (account.user_info.role.name === this.config.role_data.role1.name) {
            document.body.style.background = `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(${this.config.role_data.role1.background}) black no-repeat center center scroll`;
        }
        if (account.user_info.role.name === this.config.role_data.role2.name) {
            document.body.style.background = `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(${this.config.role_data.role2.background}) black no-repeat center center scroll`;
        }
        if (account.user_info.role.name === this.config.role_data.role3.name) {
            document.body.style.background = `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(${this.config.role_data.role3.background}) black no-repeat center center scroll`;
        }
        if (account.user_info.role.name === this.config.role_data.role4.name) {
            document.body.style.background = `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(${this.config.role_data.role4.background}) black no-repeat center center scroll`;
        }
        if (account.user_info.role.name === this.config.role_data.role5.name) {
            document.body.style.background = `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(${this.config.role_data.role5.background}) black no-repeat center center scroll`;
        }
        if (account.user_info.role.name === this.config.role_data.role6.name) {
            document.body.style.background = `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(${this.config.role_data.role6.background}) black no-repeat center center scroll`;
        }
        if (account.user_info.role.name === this.config.role_data.role7.name) {
            document.body.style.background = `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(${this.config.role_data.role7.background}) black no-repeat center center scroll`;
        }
        if (account.user_info.role.name === this.config.role_data.role8.name) {
            document.body.style.background = `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(${this.config.role_data.role8.background}) black no-repeat center center scroll`;
        }
        
       
    }

    async initLaunch() {
        document.querySelector('.play-btns').addEventListener('click', async () => {
            let urlpkg = pkg.user ? `${pkg.url}/${pkg.user}` : pkg.url;
            let uuid = (await this.database.get('1234', 'accounts-selected')).value;
            let account = (await this.database.get(uuid.selected, 'accounts')).value;
            let ram = (await this.database.get('1234', 'ram')).value;
            let javaPath = (await this.database.get('1234', 'java-path')).value;
            let javaArgs = (await this.database.get('1234', 'java-args')).value;
            let Resolution = (await this.database.get('1234', 'screen')).value;
            let launcherSettings = (await this.database.get('1234', 'launcher')).value;
            let screen;

            let playBtn = document.querySelector('.play-btns');
            let info = document.querySelector(".text-downloads")
            let progressBar = document.querySelector(".progress-bars")

            if (Resolution.screen.width == '<auto>') {
                screen = false
            } else {
                screen = {
                    width: Resolution.screen.width,
                    height: Resolution.screen.height
                }
            }

            let opts = {
                url: `${pkg.settings}/data`,
                authenticator: account,
                timeout: 10000,
                path: `${dataDirectory}/${process.platform == 'darwin' ? this.config.dataDirectory : `.${this.config.dataDirectory}`}`,
                version: this.config.game_version,
                detached: launcherSettings.launcher.close === 'close-all' ? false : true,
                downloadFileMultiple: 30,
                loader: {
                    type: this.config.loader.type,
                    build: this.config.loader.build,
                    enable: this.config.loader.enable,
                },
                verify: this.config.verify,
                ignored: this.config.ignored,

                java: this.config.java,
                memory: {
                    min: `${ram.ramMin * 1024}M`,
                    max: `${ram.ramMax * 1024}M`
                }
            }

            playBtn.style.display = "none"
            info.style.display = "block"
            launch.Launch(opts);

            launch.on('extract', extract => {
                console.log(extract);
            });

            launch.on('progress', (progress, size) => {
                progressBar.style.display = "block"
                document.querySelector(".text-downloads").innerHTML = `Téléchargement ${((progress / size) * 100).toFixed(0)}%`
                ipcRenderer.send('main-window-progress', { progress, size })
                progressBar.value = progress;
                progressBar.max = size;
            });

            launch.on('check', (progress, size) => {
                progressBar.style.display = "block"
                document.querySelector(".text-downloads").innerHTML = `Vérification ${((progress / size) * 100).toFixed(0)}%`
                progressBar.value = progress;
                progressBar.max = size;
            });

            launch.on('estimated', (time) => {
                let hours = Math.floor(time / 3600);
                let minutes = Math.floor((time - hours * 3600) / 60);
                let seconds = Math.floor(time - hours * 3600 - minutes * 60);
                console.log(`${hours}h ${minutes}m ${seconds}s`);
            })

            launch.on('speed', (speed) => {
                console.log(`${(speed / 1067008).toFixed(2)} Mb/s`)
            })

            launch.on('patch', patch => {
                console.log(patch);
                info.innerHTML = `Patch en cours...`
            });

            launch.on('data', (e) => {
                new logger('Minecraft', '#36b030');
                if (launcherSettings.launcher.close === 'close-launcher') ipcRenderer.send("main-window-hide");
                ipcRenderer.send('main-window-progress-reset')
                progressBar.style.display = "none"
                info.innerHTML = `Demarrage en cours...`
                console.log(e);
            })

            launch.on('close', code => {
                if (launcherSettings.launcher.close === 'close-launcher') ipcRenderer.send("main-window-show");
                progressBar.style.display = "none"
                info.style.display = "none"
                playBtn.style.display = "block"
                info.innerHTML = `Vérification`
                new logger('Launcher', '#7289da');
                console.log('Close');
            });

            launch.on('error', err => {
                console.log(err);
            });
        })
    }

    async initStatusServer() {
        let nameServer = document.querySelector('.server-texts .names');
        let serverMs = document.querySelector('.server-texts .descs');
        let playersConnected = document.querySelector('.etat-texts .texts');
        let online = document.querySelector(".etat-texts .onlines");
        let serverPing = await new Status(this.config.status.ip, this.config.status.port).getStatus();

        if (!serverPing.error) {
            nameServer.textContent = this.config.status.nameServer;
            serverMs.innerHTML = `<span class="green">En ligne</span> - ${serverPing.ms}ms`;
            online.classList.toggle("off");
            playersConnected.textContent = serverPing.playersConnect;
        } else if (serverPing.error) {
            nameServer.textContent = 'Serveur indisponible';
            serverMs.innerHTML = `<span class="red">Hors ligne</span>`;
        }
    }

    initBtn() {
        let home_url = pkg.user ? `${pkg.home}/${pkg.user}` : pkg.home
        document.querySelector('.home-btn').addEventListener('click', () => {
            changePanel('home');
        });

    }
}

export default Boutique;