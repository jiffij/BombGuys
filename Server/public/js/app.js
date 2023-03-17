const socket = io();

const startingSection = document.querySelector('.starting-section');
const homeBtn = document.querySelector('.home-btn');
let crazyButton = document.getElementById('crazyButton');
let startButton = document.getElementById('startButton');

startButton.addEventListener('click', () => {
    socket.emit("startGame");
    console.log("start pressed");
    // hideStartButton();
});

function hideStartButton() {
    startButton.style.display = "none";
    crazyButton.style.display = "block";
    startingSection.style.display = "none";
};

socket.on('start', () => {
    hideStartButton();
});

crazyButton.addEventListener('click', () => {
    socket.emit('crazyIsClicked', {
        offsetLeft: Math.random() * ((window.innerWidth - crazyButton.clientWidth) - 100),
        offsetTop: Math.random() * ((window.innerHeight - crazyButton.clientHeight) - 50)
    });
})

function goCrazy(offLeft, offTop) {
    let top, left;

    left = offLeft;
    top = offTop;

    crazyButton.style.top = top + 'px';
    crazyButton.style.left = left + 'px';
    crazyButton.style.animation = "none";
}

socket.on('crazyIsClicked', (data) => {
    goCrazy(data.offsetLeft, data.offsetTop);
});