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
        this.lineOrder = []
    }
    pickUp(type){
        switch(type){
            case EQUIPMENT.JET:
                this.remainingTime["jet"] = 60;
                this.lineOrder.push("jet")
                if (this.jetTag == undefined){
                    this.createJetTag()
                }
                clearInterval(this.jetIntervalID)
                this.jetIntervalID = setInterval(this.updateJetTime.bind(this), 1000)
                break
            case EQUIPMENT.BOOT:
                this.remainingTime["boot"] = 10;
                this.lineOrder.push("boot")
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
            this.removeJet()
        }
        this.remainingTime["jet"] -= 1;
        this.updateJetTag()
    }
    updateBootTime(){
        if (this.remainingTime["boot"]<=0){
            let index = this.lineOrder.indexOf("boot");
            this.lineOrder.splice(index,1);
            clearInterval(this.bootIntervalID)
            this.bootTag.remove()
            this.bootTag = undefined
            this.updateOtherTag()
        }
        this.remainingTime["boot"] -= 1;
        this.updateBootTag()  
    }
    createJetTag(){
        let otherBuff = this.checkBuffNum()
        this.jetTag = document.createElement("div")
        this.jetTag.setAttribute("class", "toolInfo")
        this.jetTag.textContent = `jet time remaining: ${this.remainingTime["jet"]}`
        let index = this.lineOrder.indexOf("jet");
        this.jetTag.style["margin-top"] = `${index * 25+20}px`
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
        let index = this.lineOrder.indexOf("boot");
        this.bootTag.style["margin-top"] = `${index * 25+20}px`
        console.log(otherBuff)
        document.body.appendChild(this.bootTag)
    }
    updateBootTag(){
        this.bootTag.textContent = `boot time remaining: ${this.remainingTime["boot"]}`
    }
    removeJet(){
        this.remainingTime["jet"] = 0;
        let index = this.lineOrder.indexOf("jet");
        this.lineOrder.splice(index,1);
        clearInterval(this.jetIntervalID)
        this.jetTag.remove()
        this.jetTag = undefined
        this.updateOtherTag()
    }
    updateOtherTag(){
        if (this.remainingTime["jet"] > 0){
            let index = this.lineOrder.indexOf("jet");
            this.jetTag.style["margin-top"] = `${index * 25+20}px`
        }
        if (this.remainingTime["boot"] > 0){
            let index = this.lineOrder.indexOf("boot");
            this.bootTag.style["margin-top"] = `${index * 25+20}px`
        }
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