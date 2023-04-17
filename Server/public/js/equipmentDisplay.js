import { EQUIPMENT } from './config.js';

export class EquipmentDisplayManager{
    constructor(){
        this.remainingTime = {
            "jet":0,
            "boot":0
        }
        this.jetTag;
        this.jetIntervalID
        this.bootTag;
        this.bootIntervalID
    }
    pickUp(type){
        switch(type){
            case EQUIPMENT.JET:
                this.remainingTime["jet"] = 10;
                if (this.jetTag == undefined){
                    this.createJetTag()
                }
                clearInterval(this.jetIntervalID)
                this.jetIntervalID = setInterval(this.updateJetTime.bind(this), 1000)
                break
            case EQUIPMENT.BOOT:
                this.remainingTime["boot"] = 10;
                if (this.bootTag == undefined){
                    this.createBootTag()
                }
                clearInterval(this.bootIntervalID)
                this.bootIntervalID = setInterval(this.updateBootTime.bind(this), 1000)
                break
        }

    }
    updateJetTime(){
        if (this.remainingTime["jet"]<=0){
            clearInterval(this.jetIntervalID)
            this.jetTag.remove()
            this.jetTag = undefined
        }
        this.remainingTime["jet"] -= 1;
        this.updateJetTag()
    }
    updateBootTime(){
        if (this.remainingTime["boot"]<=0){
            clearInterval(this.bootIntervalID)
            this.bootTag.remove()
            this.jetTag = undefined
        }
        this.remainingTime["boot"] -= 1;
        this.updateBootTag()  
    }
    createJetTag(){
        let otherBuff = this.checkBuffNum()
        this.jetTag = document.createElement("div")
        this.jetTag.setAttribute("class", "toolInfo")
        this.jetTag.textContent = `jet time remaining: ${this.remainingTime["jet"]}`
        this.jetTag.style["margin-top"] = `${otherBuff * 25+20}px`
        console.log(otherBuff)
        document.body.appendChild(this.jetTag)
    }
    updateJetTag(){
        this.jetTag.textContent = `jet time remaining: ${this.remainingTime["jet"]}`
    }
    createBootTag(){
        let otherBuff = this.checkBuffNum()
        this.bootTag = document.createElement("div")
        this.bootTag.setAttribute("class", "toolInfo")
        this.bootTag.textContent = `boot time remaining: ${this.remainingTime["boot"]}`
        this.bootTag.style["margin-top"] = `${otherBuff * 25+20}px`
        console.log(otherBuff)
        document.body.appendChild(this.bootTag)
    }
    updateBootTag(){
        this.bootTag.textContent = `boot time remaining: ${this.remainingTime["boot"]}`
    }
    checkBuffNum(){
        let keys = Object.keys(this.remainingTime)
        let num = 0;
        for (let key of keys){
            if (this.remainingTime[key] > 0){
                num += 1;
            }
        }
        return num - 1;
    }


}