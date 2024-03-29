/**
 * @author Luuxis
 * @license CC-BY-NC 4.0 - https://creativecommons.org/licenses/by-nc/4.0/
 */

'use strict';

// libs 
const fs = require('fs');
const { Microsoft, Mojang, AZauth } = require('minecraft-java-core');
const pkg = require('../package.json');
const { ipcRenderer } = require('electron');
const DiscordRPC = require('discord-rpc');

import { config, logger, changePanel, database, addAccount, accountSelect } from './utils.js';
import Login from './panels/login.js';
import Home from './panels/home.js';
import Settings from './panels/settings.js';

class Launcher {
    async init() {
        this.initLog();
        console.log("Initializing Launcher...");
        if (process.platform == "win32") this.initFrame();
        this.config = await config.GetConfig().then(res => res);
        this.news = await config.GetNews().then(res => res);
        this.database = await new database().init();
        this.createPanels(Login, Home, Settings);
        this.getaccounts();
        this.initDiscordRPC();
    }
    

    initLog() {
        document.addEventListener("keydown", (e) => {
            if (e.ctrlKey && e.shiftKey && e.keyCode == 73 || e.keyCode == 123) {
                ipcRenderer.send("main-window-dev-tools");
            }
        })
        new logger('Launcher', '#7289da')
    }
    
    initDiscordRPC() {
        if (this.config.rpc_activation === true) {
        const rpc = new DiscordRPC.Client({ transport: 'ipc' });
        rpc.on('ready', () => {
            const presence = {
                details: this.config.rpc_details,
                state: this.config.rpc_state,
                
                largeImageKey: 'pain',
                largeImageText: this.config.rpc_large_text,
                smallImageKey: 'small',
                smallImageText: this.config.rpc_small_text,

                buttons: [
                    { label: this.config.rpc_button1, url: this.config.rpc_button1_url },
                    { label: this.config.rpc_button2, url: this.config.rpc_button2_url }
                ]
            };
            rpc.setActivity(presence);
        });
        rpc.login({ clientId: this.config.rpc_id }).catch(console.error);
    }
}


    initFrame() {
        console.log("Initializing Frame...")
        document.querySelector(".frame").classList.toggle("hide")
        document.querySelector(".dragbar").classList.toggle("hide")

        document.querySelector("#minimize").addEventListener("click", () => {
            ipcRenderer.send("main-window-minimize");
        });

        let maximized = false;
        let maximize = document.querySelector("#maximize")
        maximize.addEventListener("click", () => {
            if (maximized) ipcRenderer.send("main-window-maximize")
            else ipcRenderer.send("main-window-maximize");
            maximized = !maximized
            maximize.classList.toggle("icon-maximize")
            maximize.classList.toggle("icon-restore-down")
        });

        document.querySelector("#close").addEventListener("click", () => {
            ipcRenderer.send("main-window-close");
        })
    }

    createPanels(...panels) {
        let panelsElem = document.querySelector(".panels")
        for (let panel of panels) {
            console.log(`Initializing ${panel.name} Panel...`);
            let div = document.createElement("div");
            div.classList.add("panel", panel.id)
            div.innerHTML = fs.readFileSync(`${__dirname}/panels/${panel.id}.html`, "utf8");
            panelsElem.appendChild(div);
            new panel().init(this.config, this.news);
        }
    }

    async getaccounts() {
        let azauth = this.config.azauth
        const AZAuth = new AZauth(azauth);
        let accounts = await this.database.getAll('accounts');
        let selectaccount = (await this.database.get('1234', 'accounts-selected'))?.value?.selected;

        if (!accounts.length) {
            changePanel("login");
        } else {
            for (let account of accounts) {
                account = account.value;
                if (account.meta.type === 'AZauth') {
                    let refresh = await AZAuth.verify(account);
                    console.log(refresh);
                    console.log(`Initializing Mojang account ${account.name}...`);
                    let refresh_accounts;

                    if (refresh.error) {
                        this.database.delete(account.uuid, 'accounts');
                        if (account.uuid === selectaccount) this.database.update({ uuid: "1234" }, 'accounts-selected')
                        console.error(`[Account] ${account.uuid}: ${refresh.errorMessage}`);
                        continue;
                    }

                    refresh_accounts = {
                        access_token: refresh.access_token,
                        client_token: refresh.uuid,
                        uuid: refresh.uuid,
                        name: refresh.name,
                        user_properties: refresh.user_properties,
                        meta: {
                            type: refresh.meta.type,
                            offline: refresh.meta.offline
                        },
                        user_info: {
                            role: refresh.user_info.role,
                            monnaie: refresh.user_info.money,
                        },
                    }

                    this.database.update(refresh_accounts, 'accounts');
                    addAccount(refresh_accounts);
                    if (account.uuid === selectaccount) accountSelect(refresh.uuid)
                } else {
                    this.database.delete(account.uuid, 'accounts');
                    if (account.uuid === selectaccount) this.database.update({ uuid: "1234" }, 'accounts-selected')
                }
            }
            if (!(await this.database.get('1234', 'accounts-selected')).value.selected) {
                let uuid = (await this.database.getAll('accounts'))[0]?.value?.uuid
                if (uuid) {
                    this.database.update({ uuid: "1234", selected: uuid }, 'accounts-selected')
                    accountSelect(uuid)
                }
            }

            if ((await this.database.getAll('accounts')).length == 0) {
                changePanel("login");
                document.querySelector(".preload-content").style.display = "none";
                return
            }
            changePanel("home");
        }
        document.querySelector(".preload-content").style.display = "none";
    }
    
    
}

new Launcher().init();


