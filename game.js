// ---------- SETUP ----------
const dino = document.querySelector("#dino");
const gameBox = document.querySelector("#game");
const hungerBar = document.querySelector("#hunger-bar");
const sleepBar = document.querySelector("#sleep-bar");
const sizeDisplay = document.querySelector("#size-display");
const timeIndicator = document.querySelector("#time-indicator");
const statusIndicator = document.querySelector("#status-indicator");
const message = document.querySelector("#message");

const GAME_WIDTH = 900;
const GAME_HEIGHT = 500;
const MOVE_AMOUNT = 10;
const NIGHT_SPEED_MULTIPLIER = 1.8; // how much faster you move at night
const SEGMENT_COUNT = 10; // how many blocks each bar is split into

let player = {
    x: 50,
    y: 200,
    size: 1,
    hunger: 100,
    sleep: 100
};

let otherDinos = [];
let isNight = false;
let isSleeping = false;
let gameOver = false;

// ---------- PIXEL SPRITE GENERATOR ----------
// Instead of using image files, we build simple pixel-art sprites in code.
// A "grid" is just rows of text where "1" means "draw a colored square here"
// and "0" means "leave it blank". This turns that grid into a tiny image.
function makePixelSpriteURL(layers, pixelSize) {
    const rows = layers[0].grid.length;
    const cols = layers[0].grid[0].length;
    const width = cols * pixelSize;
    const height = rows * pixelSize;

    let rects = "";
    layers.forEach(function (layer) {
        layer.grid.forEach(function (rowText, rowIndex) {
            for (let colIndex = 0; colIndex < rowText.length; colIndex++) {
                if (rowText[colIndex] === "1") {
                    const px = colIndex * pixelSize;
                    const py = rowIndex * pixelSize;
                    rects += '<rect x="' + px + '" y="' + py + '" width="' + pixelSize +
                        '" height="' + pixelSize + '" fill="' + layer.color + '" />';
                }
            }
        });
    });

    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + width + '" height="' + height +
        '" viewBox="0 0 ' + width + ' ' + height + '">' + rects + '</svg>';

    return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}

// A tree, split into two layers so the leaves and trunk can be different colors
const TREE_LEAVES_GRID = [
    "00011000",
    "00111100",
    "01111110",
    "00111100",
    "01111110",
    "00111100",
    "00011000",
    "00000000",
    "00000000",
    "00000000"
];
const TREE_TRUNK_GRID = [
    "00000000",
    "00000000",
    "00000000",
    "00000000",
    "00000000",
    "00000000",
    "00000000",
    "00011000",
    "00011000",
    "00011000"
];

// Sprite images embedded directly as base64 text, so there's no separate image files to manage
const PLAYER_SPRITE_URL = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEgAAAB9BAMAAADzdDhqAAAAIGNIUk0AAHomAACAhAAA+gAAAIDoAAB1MAAA6mAAADqYAAAXcJy6UTwAAAAbUExURf8AADghIaBDRbxNT0uaJ////9i3j//XqP///xd/1LIAAAABdFJOUwBA5thmAAAAAWJLR0QIht6VegAAAAd0SU1FB+oJGxE4IbcRRUkAAACpSURBVFjD7ZPBDQIhFETXDhy0gk8F+Csw2QbcZFvAsyfbF2TFg8uNT2Iy78o7kJk/00SIEfjBUDoATjJeKzhaSTjPmySSnottLa03rItoQP5RgKEEfKVmBN2klPh8xWCpJj5ASmwNp2oLppL73G7YG1NfKXXsJN6fmYe5VO5pnHRSvQyUSrteY4zNxPtJpeD24faX8k7C+4j9CKnOY28nvSVCCCGEkP/kBTRpi0LMJtwOAAAAAElFTkSuQmCC";
const PREY_SPRITE_URLS = [
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADwAAAB9BAMAAAAM1h2IAAAAIGNIUk0AAHomAACAhAAA+gAAAIDoAAB1MAAA6mAAADqYAAAXcJy6UTwAAAAbUExURf+uAOWrPUo7H/3HYCN56v///9i3j//XqP///yXl3F8AAAACdFJOUwAAdpPNOAAAAAFiS0dECIbelXoAAAAHdElNRQfqCRsROCG3EUVJAAAAsElEQVRIx+2UwQ3CMAxFKzaIugA1LEC8AeoCIHWFcO+l62PjKChqbvk91e/6LFn2dzIMztmgHTB9IZqCMnKBrhhN9znrEERYHVYvwitwJO0cCaZJB1vepLoxWJeWrc1Pyr2P0WVrcC3kTCQMA6XLPdkxxfqK+7UEM4X02ZQVrC3yo/SN+fHX9cq6tUUyckqpDhugLRI7IykD618k+m73fx5IN1qidLMlSDuO4zjOCfkC2BeWH2e66kIAAAAASUVORK5CYII=",
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC0AAAAwBAMAAAB3fO7sAAAAIGNIUk0AAHomAACAhAAA+gAAAIDoAAB1MAAA6mAAADqYAAAXcJy6UTwAAAAbUExURQCU/yEwOEN9oE2SvJookP///9i3j//XqP///96c5UsAAAABdFJOUwBA5thmAAAAAWJLR0QIht6VegAAAAd0SU1FB+oJGxE4ChutvAkAAACWSURBVDjLzdLBDYMwDAVQdwN+QAxgJqCeoBILtBID9BLOnLp+DaY0qrg4OdB/fJEcOT9ERPhJRRafX4DAGtSypUeGoxnUxzvGB38ORK8o8h42P8eB4/lO132HG3jNn7jGnDv5Vun1vcouKZeyXNsPHKfXkvl81/3kyvGJUq/FHh9tTPd1+/q1Fg9c4lbBVmJFhX6ADn8DoqSCeOfN994AAAAASUVORK5CYII=",
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC0AAAAwBAMAAAB3fO7sAAAAIGNIUk0AAHomAACAhAAA+gAAAIDoAAB1MAAA6mAAADqYAAAXcJy6UTwAAAAbUExURbb/ADI4IYigQ5+8TcQ/Mf///9i3j//XqP///98zmM0AAAABdFJOUwBA5thmAAAAAWJLR0QIht6VegAAAAd0SU1FB+oJGxE4ChutvAkAAACcSURBVDjLxdPBDYMwDAVQd4N+2gUwE6SZoBILgJQVwpkT69fBUYLEKS4S//iEIhz/EBHhFNrT5g+g45TBl+DZ7HiP2ZlF9AOzhwlhZu+QTnewOFD9+J+NLvOOXwTJFV7m/ccl+eLkxjQGL6vXPbpcEotLtTqOy5ay3u8yn/9c4a9US5k0xqilMvpeLe5Rl2jy4xPWx2L2ulCAyOA/1CaIe7Wk4EoAAAAASUVORK5CYII="
];

// picks a random one of the 3 prey images, used for both weak (edible) and
// dangerous (bigger) dinos - danger ones just get a red tint added instead of unique art
function randomPreySpriteURL() {
    const index = Math.floor(Math.random() * PREY_SPRITE_URLS.length);
    return PREY_SPRITE_URLS[index];
}

const treeSpriteURL = makePixelSpriteURL([
    { grid: TREE_LEAVES_GRID, color: "#2e7d32" },
    { grid: TREE_TRUNK_GRID, color: "#5d3a1a" }
], 4);

// ---------- DRAWING ----------
function applySprite(el, url) {
    el.style.backgroundImage = 'url("' + url + '")';
    el.style.backgroundSize = "contain";
    el.style.backgroundRepeat = "no-repeat";
}

function drawPlayer() {
    dino.style.left = player.x + "px";
    dino.style.top = player.y + "px";
    const width = 40 + player.size * 15;
    dino.style.width = width + "px";
    dino.style.height = (width * 1.6) + "px"; // player sprite is a tall running pose
}

// ---------- PIXEL BARS ----------
function createSegments(container) {
    container.innerHTML = "";
    for (let i = 0; i < SEGMENT_COUNT; i++) {
        const seg = document.createElement("div");
        seg.classList.add("segment");
        container.appendChild(seg);
    }
}

function setBarValue(container, value, color) {
    const filled = Math.round(Math.max(0, value) / 100 * SEGMENT_COUNT);
    const segments = container.children;
    for (let i = 0; i < segments.length; i++) {
        segments[i].style.backgroundColor = i < filled ? color : "#444";
    }
}

function updateBars() {
    setBarValue(hungerBar, player.hunger, player.hunger < 25 ? "#c0392b" : "#e67e22");
    setBarValue(sleepBar, player.sleep, player.sleep < 25 ? "#c0392b" : "#3498db");
    sizeDisplay.textContent = player.size;
}

// ---------- TREES (decoration only) ----------
function spawnTrees(count) {
    for (let i = 0; i < count; i++) {
        const tree = document.createElement("div");
        tree.classList.add("tree");
        applySprite(tree, treeSpriteURL);
        tree.style.width = "32px";
        tree.style.height = "40px";
        tree.style.left = Math.random() * (GAME_WIDTH - 40) + "px";
        tree.style.top = Math.random() * (GAME_HEIGHT - 50) + "px";
        gameBox.appendChild(tree);
    }
}

// ---------- OTHER DINOS ----------
function spawnDino() {
    const size = Math.random() < 0.6
        ? Math.max(1, player.size - 1)
        : player.size + Math.ceil(Math.random() * 2);

    const isPrey = size <= player.size;

    const el = document.createElement("div");
    el.classList.add("other-dino");
    applySprite(el, randomPreySpriteURL());

    // dangerous (bigger) dinos reuse the same art but get a red tint as a warning
    el.style.filter = isPrey ? "none" : "sepia(1) saturate(5) hue-rotate(-50deg) brightness(0.85)";

    const width = 30 + size * 12;
    el.style.width = width + "px";
    el.style.height = (width * 1.3) + "px";

    const dinoData = {
        x: Math.random() * (GAME_WIDTH - 60),
        y: Math.random() * (GAME_HEIGHT - 60),
        size: size,
        el: el
    };

    el.style.left = dinoData.x + "px";
    el.style.top = dinoData.y + "px";

    gameBox.appendChild(el);
    otherDinos.push(dinoData);
}

// ---------- COLLISION / EATING ----------
function checkCollisions() {
    for (let i = otherDinos.length - 1; i >= 0; i--) {
        const other = otherDinos[i];
        const dx = player.x - other.x;
        const dy = player.y - other.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 45) {
            if (player.size >= other.size) {
                player.hunger = Math.min(100, player.hunger + 25);
                player.size += 0.5;
                other.el.remove();
                otherDinos.splice(i, 1);
                spawnDino();
                drawPlayer();
                updateBars();
            } else {
                endGame("💀 You got eaten by a bigger dino!");
                return;
            }
        }
    }
}

// ---------- MOVEMENT ----------
function getCurrentMoveAmount() {
    return isNight ? MOVE_AMOUNT * NIGHT_SPEED_MULTIPLIER : MOVE_AMOUNT;
}

document.addEventListener("keydown", function (event) {
    if (gameOver) return;

    // "e" toggles sleeping on and off
    if (event.key === "e") {
        isSleeping = !isSleeping;
        statusIndicator.textContent = isSleeping ? "😴 Sleeping (press E to wake)" : "Awake (press E to sleep)";
        return;
    }

    if (isSleeping) return; // can't move while asleep

    const move = getCurrentMoveAmount();

    if (event.key === "w") player.y -= move;
    if (event.key === "s") player.y += move;
    if (event.key === "a") player.x -= move;
    if (event.key === "d") player.x += move;

    player.x = Math.max(0, Math.min(GAME_WIDTH - 60, player.x));
    player.y = Math.max(0, Math.min(GAME_HEIGHT - 60, player.y));

    drawPlayer();
    checkCollisions();
});

// ---------- HUNGER & SLEEP DRAIN ----------
setInterval(function () {
    if (gameOver) return;

    if (isSleeping) {
        player.sleep = Math.min(100, player.sleep + 8); // sleep fills up fast
        player.hunger -= 1; // but you still slowly get hungry while resting

        // wake up automatically once fully rested
        if (player.sleep >= 100) {
            isSleeping = false;
            statusIndicator.textContent = "Awake (press E to sleep)";
        }
    } else {
        player.hunger -= 2;
        player.sleep -= 1;
    }

    if (player.hunger <= 0) {
        endGame("💀 You starved!");
    } else if (player.sleep <= 0) {
        endGame("💤 You fell asleep and didn't wake up!");
    }

    updateBars();
}, 1000);

// ---------- DAY / NIGHT CYCLE ----------
const DAY_LENGTH = 20000;   // 20 seconds of day
const NIGHT_LENGTH = 15000; // 15 seconds of night

function toggleDayNight() {
    if (gameOver) return;

    isNight = !isNight;
    gameBox.style.backgroundColor = isNight ? "#1b263b" : "#d9f2c3";
    timeIndicator.textContent = isNight ? "🌙 Night (faster!)" : "☀️ Day";

    setTimeout(toggleDayNight, isNight ? NIGHT_LENGTH : DAY_LENGTH);
}

// ---------- INITIAL SETUP ----------
dino.textContent = ""; // clear the emoji, we're using a sprite now
applySprite(dino, PLAYER_SPRITE_URL);

createSegments(hungerBar);
createSegments(sleepBar);

spawnTrees(8);
for (let i = 0; i < 6; i++) spawnDino();

drawPlayer();
updateBars();
setTimeout(toggleDayNight, DAY_LENGTH); // starts in day mode, flips after DAY_LENGTH
