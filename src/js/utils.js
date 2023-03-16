export const W = 'w'
export const A = 'a'
export const S = 's'
export const D = 'd'
export const SPACE = " "
export const SHIFT = 'shift'
export const DIRECTIONS = [W, A, S, D]

export class KeyDisplay {

    map = new Map()

    constructor() {
        const w = document.createElement("div")
        const a = document.createElement("div")
        const s = document.createElement("div")
        const d = document.createElement("div")
        const shift = document.createElement("div")

        this.map.set(W, w)
        this.map.set(A, a)
        this.map.set(S, s)
        this.map.set(D, d)
        this.map.set(SHIFT, shift)

        this.map.forEach( (v, k) => {
            v.style.color = 'blue'
            v.style.fontSize = '50px'
            v.style.fontWeight = '800'
            v.style.position = 'absolute'
            v.textContent = k
        })

        this.updatePosition()

        this.map.forEach( (v, _) => {
            document.body.append(v)
        })
    }

    updatePosition() {
        this.map.get(W).style.top = `${window.innerHeight - 150}px`
        this.map.get(A).style.top = `${window.innerHeight - 100}px`
        this.map.get(S).style.top = `${window.innerHeight - 100}px`
        this.map.get(D).style.top = `${window.innerHeight - 100}px`
        this.map.get(SHIFT).style.top = `${window.innerHeight - 100}px`

        this.map.get(W).style.left = `${300}px`
        this.map.get(A).style.left = `${200}px`
        this.map.get(S).style.left = `${300}px`
        this.map.get(D).style.left = `${400}px`
        this.map.get(SHIFT).style.left = `${50}px`
    }

    down (key) {
        if (this.map.get(key.toLowerCase())) {
            this.map.get(key.toLowerCase()).style.color = 'red'
        }
    }

    up (key) {
        if (this.map.get(key.toLowerCase())) {
            this.map.get(key.toLowerCase()).style.color = 'blue'
        }
    }

}

export function generateUUID() { // Public Domain/MIT
    var d = new Date().getTime();//Timestamp
    var d2 = ((typeof performance !== 'undefined') && performance.now && (performance.now()*1000)) || 0;//Time in microseconds since page-load or 0 if unsupported
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16;//random number between 0 and 16
        if(d > 0){//Use timestamp until depleted
            r = (d + r)%16 | 0;
            d = Math.floor(d/16);
        } else {//Use microseconds since page-load if supported
            r = (d2 + r)%16 | 0;
            d2 = Math.floor(d2/16);
        }
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}