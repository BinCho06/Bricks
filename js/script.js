const score = document.getElementById("score");
const livesContainer = document.getElementById("lives");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const rows = 10;
const cols = 10;
const r = 20;
const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const brickWidth = Math.floor(WIDTH / cols);
const brickHeight = Math.floor(HEIGHT*0.6 / rows);
const updateSpeed = 20;

// just a reminder of my stupidity
/*const brickColors = [ 
    "#00c800", // green
    "#ffe400", // yellow
    "#ff6400", // orange
    "#ff0000", // red
    "#c800c8"  // purple
];
const brickImage = new Image();
brickImage.src = "img/alpha-brick.png";*/
const brickImages = [];
for (let i = 1; i <= 5; i++) {
    const img = new Image();
    img.src = `img/brick${i}.png`;
    brickImages.push(img);
}
const paddleImage = new Image();
paddleImage.src = "img/paddle.png";
const ballImage = new Image();
ballImage.src = "img/ball.png";

const powerUpDropChance = 0.4;
const powerUpDropChances = {
    "splitball.png": 0.2,
    "bigpaddle.png": 0.2,
    "slowpaddle.png": 0.2,
    "fastball.png": 0.1,
    "smallpaddle.png": 0.1,
    "loselife.png": 0.1,
    "fastpaddle.png": 0.05,
    "pluslife.png": 0.05
};

var balls = [];
var powerUps = [];
var bricks;
var pause;
var intervalId;
var lives;
var tocke;
var rightDown = false;
var leftDown = false;

var paddlex;
var paddleh;
var paddlew;
var paddleSpeed;

class Ball {
    constructor(x, y, dx, dy, r) {
        this.x = x;
        this.y = y;
        this.dx = dx;
        this.dy = dy;
        this.r = r;
        this.rotation = 0;
    }

    move() {
        this.x += this.dx;
        this.y += this.dy;
        this.rotation += 0.1;
    }

    draw(ctx) {
        ctx.save();

        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        ctx.drawImage(ballImage, -this.r, -this.r, 2 * this.r, 2 * this.r);

        ctx.restore();
    }
}

class PowerUp {
    constructor(x, y, width, height, image) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.image = new Image();
        this.image.src = image;
    }

    draw(ctx) {
        ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    }
}

initBricks();
initPaddle();
initBall();
init();

// This is dumb but it works so I won't change it 
// (also remember to change the number based on the number of images loaded)
let imagesLoaded = 0;
function onImageLoad() {
    imagesLoaded++;
    if (imagesLoaded == 7) {
        draw(); // Only call draw() when both images are loaded
    }
}
ballImage.onload = onImageLoad;
paddleImage.onload = onImageLoad;
brickImages.forEach(brickImage => {
    brickImage.onload = onImageLoad;
});

function init() {
    pause = true;

    tocke = 0;
    score.innerHTML = "Score: "+tocke;
    lives = 3;
    drawLives();

    document.getElementById("play").style.display = "block";
}

function initBall() {
    const ball = new Ball(WIDTH / 2, HEIGHT - paddleh - r, Math.random() * 2 - 1, -10, r);
    balls = [ball];
}

function initPaddle() {
    paddleh = 20;
    paddlew = 200;
    paddlex = WIDTH / 2 - paddlew / 2;
    paddleSpeed = 10;
}

function initBricks() {
    // TODO make this more dynamic and less hardcoded / add more levels
    bricks = new Array(rows);
    for (let i = 0; i < rows; i++) {
        bricks[i] = new Array(cols);
        for (let j = 0; j < cols; j++) {
            if (i + rows/2 == j || i + j + rows/2 == rows - 1 || i - rows/2 == j || i + j - rows/2 == rows - 1) bricks[i][j] = 5;
            else if (i + rows/2 <= j || i + j + rows/2 <= rows - 1) bricks[i][j] = 4;
            else if (i == j || i + j == rows - 1) bricks[i][j] = 3;
            else if(i < j && i + j > rows - 1 || i > j && i + j < rows - 1) bricks[i][j] = 2;
            else if(i < j && i + j < rows - 1) bricks[i][j] = 1;
            else bricks[i][j] = 0;
        }
    }
}

// Handle key presses
document.addEventListener("keydown", function(evt) {
    if (evt.keyCode == 39 || evt.keyCode == 68) rightDown = true;
    if (evt.keyCode == 37 || evt.keyCode == 65) leftDown = true;
    if (evt.keyCode == 80 || evt.keyCode == 27) pauseGame(); // P and ESC
    if (evt.keyCode == 73) info(); // I for instructions
});
document.addEventListener("keyup", function(evt) {
    if (evt.keyCode == 39 || evt.keyCode == 68) rightDown = false;
    if (evt.keyCode == 37 || evt.keyCode == 65) leftDown = false;
});

function drawLives() {
    livesContainer.innerHTML = "";
    for (let i = 0; i < lives; i++) {
        const img = document.createElement("img");
        img.src = "img/heart.png";
        img.style.marginLeft = "0.5vh";
        livesContainer.appendChild(img);
    }
}

function update(){
    movePaddle();

    movePowerUps();

    balls.forEach(ball => {
        if (checkCollsions(ball)) {
            balls.splice(balls.indexOf(ball), 1);
        }
    });

    if (balls.length >= 1) balls.forEach(ball => ball.move());
    else checkLose();
    checkWin();

    draw();
}

function movePaddle() {
    if (rightDown) {
        if ((paddlex + paddlew) < WIDTH) {
            paddlex += paddleSpeed;
        } else {
            paddlex = WIDTH - paddlew;
        }
    } else if (leftDown) {
        if (paddlex > 0) {
            paddlex -= paddleSpeed;
        } else {
            paddlex = 0;
        }
    }
}

function movePowerUps() {
    for (let i = 0; i < powerUps.length; i++) {
        powerUps[i].y += 4;
        if (powerUps[i].y > HEIGHT) {
            powerUps.splice(i, 1);
            i--;
        } else if (powerUps[i].y + powerUps[i].height > HEIGHT - paddleh && powerUps[i].x + powerUps[i].width > paddlex && powerUps[i].x < paddlex + paddlew) {
            const powerUpType = powerUps[i].image.src.split('/').pop();
            switch (powerUpType) {
                case "splitball.png":
                    balls.forEach(ball => {
                        balls.push(new Ball(ball.x, ball.y, -ball.dx, ball.dy, r));
                    });
                    break;
                case "bigpaddle.png":
                    if(paddlew<500){
                        paddlew += 50;
                        paddlex = Math.max(0, Math.min(paddlex - 25, WIDTH - paddlew));
                    }
                    break;
                case "smallpaddle.png":
                    if(paddlew>50){
                        paddlew -= 50;
                        paddlex += 25;
                    }
                    break;
                case "pluslife.png":
                    lives++;
                    drawLives();
                    break;
                case "loselife.png":
                    checkLose();
                    break;
                case "fastball.png":
                    balls.forEach(ball => {
                        ball.dx *= 1.5;
                        ball.dy *= 1.5;
                    });
                    break;
                case "slowpaddle.png":
                    paddleSpeed *= 0.75;
                    break;
                case "fastpaddle.png":
                    paddleSpeed *= 1.5;
                    break;
            }
            powerUps.splice(i, 1);
            i--;
        }
    }
}

function getRandomPowerUpType() {
    const totalChance = Object.values(powerUpDropChances).reduce((sum, chance) => sum + chance, 0);
    const random = Math.random() * totalChance;

    let cumulativeChance = 0;
    for (const [type, chance] of Object.entries(powerUpDropChances)) {
        cumulativeChance += chance;
        if (random <= cumulativeChance) {
            return type;
        }
    }
    return null; // Fallback in case no type is selected
}

function checkCollsions(ball) {
    row = Math.floor(ball.y / brickHeight);
    col = Math.floor(ball.x / brickWidth);
    x = ball.x;
    y = ball.y;
    dx = ball.dx;
    dy = ball.dy;

    // This code is flawed and I won't fix it beacuse "design is more important than code"
    if (y < rows * brickHeight && row >= 0 && col >= 0 && bricks[row][col] > 0) {
        ball.dy = -dy;
        bricks[row][col]--;
        tocke += 1;
        score.innerHTML = 'Score: '+tocke;
        if (bricks[row][col] == 0) {
            if (Math.random() < powerUpDropChance) {
                const powerUpType = 'img/powerups/'+getRandomPowerUpType();
                const powerUp = new PowerUp(col * brickWidth, row * brickHeight, brickHeight, brickHeight, powerUpType);
                powerUps.push(powerUp);
            }
        }
    }

    if (x + dx > WIDTH - r || x + dx < r)
        ball.dx = -dx;
    if (y + dy < 0 + r)
        ball.dy = -dy;
    else if (x > paddlex && x < paddlex + paddlew && y > canvas.height - paddleh - r) {
        const hitPosition = (x - paddlex) / paddlew; // Normalize hit position (0 to 1)
    const angle = (hitPosition - 0.5) * (Math.PI * 0.94); // Map to -85° to +85° (steeper angles)

    const speed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy); // Preserve speed
    ball.dx = speed * Math.sin(angle); // Adjust horizontal velocity
    ball.dy = -speed * Math.cos(angle);
        /*ball.dy = -dy;
        ball.dx = 8 * ((x - (paddlex + paddlew / 2)) / paddlew);*/
    } else if (!(x > paddlex && x < paddlex + paddlew) && y > canvas.height - r) {
        return true;
    }
}

function checkLose() {
    lives--;
    drawLives();

    powerUps = [];
    initPaddle();
    initBall();
    pauseGame();

    draw();
    if (lives > 0) return

    clearInterval(intervalId);
    Swal.fire({
        title: 'Game Over!',
        text: 'You scored ' + tocke + ' points.',
        icon: 'error',
        input: 'text',
        inputPlaceholder: 'Ime',
        confirmButtonText: 'Shrani',
        showDenyButton: true,
        denyButtonText: 'Prekliči',
        customClass: {
            confirmButton: 'buttoncolor'
        }
    }).then((result) => {
        if (result.isConfirmed) {
            saveScore(result.value, tocke);
            displayScores();
        }
        resetGame();
    });
}

function checkWin() {
    bool = true;
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            if (bricks[i][j] > 0) bool = false;
        }
    }
    if (bool) {
        clearInterval(intervalId);
        draw();
        Swal.fire({
            title: 'Congratulations!',
            text: 'You won and scored ' + tocke + ' points.',
            icon: 'success',
            input: 'text',
            inputPlaceholder: 'Ime',
            confirmButtonText: 'Shrani',
            customClass: {
                confirmButton: 'buttoncolor'
            }
        }).then((result) => {
            if (result.isConfirmed) {
                saveScore(result.value, tocke);
                displayScores();
            }
            resetGame();
        });
    }
}

function draw() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    powerUps.forEach(powerUp => powerUp.draw(ctx));

    balls.forEach(ball => ball.draw(ctx));

    ctx.drawImage(paddleImage, paddlex, HEIGHT - paddleh, paddlew, paddleh);

    drawBricks();
}

function drawBricks() {
    // Create an offscreen canvas for tinting 
    /*const offscreenCanvas = document.createElement("canvas");
    offscreenCanvas.width = brickWidth;
    offscreenCanvas.height = brickHeight;
    const offscreenCtx = offscreenCanvas.getContext("2d");*/

    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            if (bricks[i][j] > 0) {
                /*// Draw the brick image onto the offscreen canvas
                offscreenCtx.clearRect(0, 0, brickWidth, brickHeight);
                offscreenCtx.drawImage(brickImage, 0, 0, brickWidth, brickHeight);

                // Apply the color tint
                offscreenCtx.globalCompositeOperation = "source-in";
                offscreenCtx.fillStyle = brickColors[bricks[i][j] - 1];
                offscreenCtx.fillRect(0, 0, brickWidth, brickHeight);

                // Reset the composite operation
                offscreenCtx.globalCompositeOperation = "source-over";

                // Draw the tinted brick onto the main canvas
                ctx.drawImage(offscreenCanvas, j * brickWidth, i * brickHeight, brickWidth, brickHeight);*/
                ctx.drawImage(brickImages[bricks[i][j] - 1], j * brickWidth, i * brickHeight, brickWidth, brickHeight);
            }
        }
    }
}

function resetGame() {
    pause = true;
    clearInterval(intervalId);

    powerUps = [];
    initBricks();
    initPaddle();
    initBall();
    init();

    draw();
}

function pauseGame() {
    if(pause) {
        document.getElementById("play").style.display = "none";
        intervalId = setInterval(update, updateSpeed);
    } else {
        document.getElementById("play").style.display = "block";
        clearInterval(intervalId);
    }
    pause = !pause;
}

function freezeGame(bool) {
    if(bool) {
        clearInterval(intervalId);
    } else {
        if(!pause) {
            document.getElementById("play").style.display = "none";
            intervalId = setInterval(update, updateSpeed);
        }
    }
}

function saveScore(playerName, tocke) {
    const scores = JSON.parse(localStorage.getItem('brick-scores')) || [];
    scores.push({ playerName, tocke });
    localStorage.setItem('brick-scores', JSON.stringify(scores));
}

function displayScores() {
    freezeGame(true);
    const scores = JSON.parse(localStorage.getItem('brick-scores')) || [];
    scores.sort((a, b) => b.tocke - a.tocke);

    let scoreText = "";
    scores.forEach((score, index) => {
        scoreText += `${index + 1}. ${score.playerName || "Neznan igralec"}:  ${score.tocke}<br>`;
    });

    Swal.fire({
        title: 'Rezultati',
        html: scoreText,
        icon: 'info',
        confirmButtonText: 'OK',
        customClass: {
            htmlContainer: 'align-left',
            confirmButton: 'buttoncolor'
        }
    }).then(() => {
        freezeGame(false);
    });
}

function info(){
    freezeGame(true);
    Swal.fire({
        title: 'Navodila',
        text: 'Premikaj se z levo in desno puščico ali A in D, pritisni P ali ESC za pavzo. Zmagaš, ko uničiš vse bricke.',
        icon: 'info',
        confirmButtonText: 'OK',
        customClass: {
            htmlContainer: 'align-left',
            confirmButton: 'buttoncolor'
        }
    }).then(() => {
        freezeGame(false);
    });
}

function credits(){
    freezeGame(true);
    Swal.fire({
        title: 'Vizitka',
        text: 'Štefan Koren 4. Rb, 2025',
        icon: 'info',
        confirmButtonText: 'OK',
        customClass: {
            confirmButton: 'buttoncolor'
        }
    }).then(() => {
        freezeGame(false);
    })
}