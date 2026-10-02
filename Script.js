const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const minimap = document.getElementById("minimap");
const miniCtx = minimap.getContext("2d");

const healthText = document.getElementById("health");
const waveText = document.getElementById("wave");
const zombiesText = document.getElementById("zombies");
const weaponText = document.getElementById("weapon");
const message = document.getElementById("message");

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();


// ============================================================
// WORLD
// ============================================================

const world = {
    width: 3000,
    height: 2200
};

const player = {
    x: 1500,
    y: 1100,
    radius: 15,
    speed: 4,
    health: 100,
    maxHealth: 100
};


// ============================================================
// CAMERA
// ============================================================

const camera = {
    x: 0,
    y: 0
};


// ============================================================
// INPUT
// ============================================================

const keys = {};

let mouse = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    down: false
};

window.addEventListener("keydown", (e) => {

    keys[e.key.toLowerCase()] = true;

    if (["1", "2", "3", "4"].includes(e.key)) {
        const index = Number(e.key) - 1;

        if (guns[index]) {
            currentGun = index;
        }
    }

    if (e.key.toLowerCase() === "e") {
        interactWithHouse();
    }

    if (
        e.key.toLowerCase() === "r" &&
        (gameOver || victory)
    ) {
        location.reload();
    }
});

window.addEventListener("keyup", (e) => {
    keys[e.key.toLowerCase()] = false;
});

canvas.addEventListener("mousemove", (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

canvas.addEventListener("mousedown", (e) => {
    if (e.button === 0) {
        mouse.down = true;
    }
});

window.addEventListener("mouseup", (e) => {
    if (e.button === 0) {
        mouse.down = false;
    }
});


// ============================================================
// WEAPONS
// ============================================================

const guns = [

    {
        name: "Pistol",
        damage: 34,
        fireRate: 230,
        spread: 0.025,
        pellets: 1,
        bulletSpeed: 15
    },

    {
        name: "Shotgun",
        damage: 20,
        fireRate: 650,
        spread: 0.34,
        pellets: 7,
        bulletSpeed: 13
    },

    {
        name: "Machine Gun",
        damage: 11,
        fireRate: 75,
        spread: 0.13,
        pellets: 1,
        bulletSpeed: 18
    },

    {
        name: "Rifle",
        damage: 125,
        fireRate: 900,
        spread: 0.008,
        pellets: 1,
        bulletSpeed: 25
    }

];

let currentGun = 0;
let lastShot = 0;


// ============================================================
// BULLETS
// ============================================================

const bullets = [];

function shoot() {

    const now = performance.now();
    const gun = guns[currentGun];

    if (now - lastShot < gun.fireRate) {
        return;
    }

    lastShot = now;

    const worldMouseX = mouse.x + camera.x;
    const worldMouseY = mouse.y + camera.y;

    const baseAngle = Math.atan2(
        worldMouseY - player.y,
        worldMouseX - player.x
    );

    for (let i = 0; i < gun.pellets; i++) {

        const angle =
            baseAngle +
            (Math.random() - 0.5) * gun.spread;

        bullets.push({
            x: player.x,
            y: player.y,
            vx: Math.cos(angle) * gun.bulletSpeed,
            vy: Math.sin(angle) * gun.bulletSpeed,
            damage: gun.damage,
            life: 100
        });
    }
}


// ============================================================
// HOUSES
// ============================================================

const houses = [];

function createHouses() {

    const positions = [
        [350, 350],
        [800, 500],
        [1250, 300],
        [1900, 400],
        [2400, 350],

        [400, 900],
        [900, 850],
        [2050, 850],
        [2550, 900],

        [350, 1500],
        [850, 1450],
        [1800, 1500],
        [2400, 1550],

        [700, 1950],
        [1400, 1850],
        [2100, 1950]
    ];

    for (const [x, y] of positions) {

        houses.push({
            x,
            y,
            width: 170,
            height: 130,

            // 0 = intact
            // 1 = damaged
            // 2 = broken
            state: 0,

            health: 250,
            maxHealth: 250,

            open: false
        });
    }
}

createHouses();


// ============================================================
// ROADS
// ============================================================

const roads = [

    {
        x: 0,
        y: 1030,
        width: 3000,
        height: 100
    },

    {
        x: 1450,
        y: 0,
        width: 100,
        height: 2200
    },

    {
        x: 0,
        y: 620,
        width: 3000,
        height: 75
    },

    {
        x: 2150,
        y: 0,
        width: 75,
        height: 2200
    }
];


// ============================================================
// TREES
// ============================================================

const trees = [];

function createTrees() {

    const random = (min, max) =>
        Math.random() * (max - min) + min;

    for (let i = 0; i < 170; i++) {

        let x = random(60, world.width - 60);
        let y = random(60, world.height - 60);

        // Keep trees away from the player's starting area.
        if (
            Math.abs(x - player.x) < 250 &&
            Math.abs(y - player.y) < 250
        ) {
            i--;
            continue;
        }

        // Avoid putting too many trees directly on roads.
        let onRoad = false;

        for (const road of roads) {

            if (
                x > road.x &&
                x < road.x + road.width &&
                y > road.y &&
                y < road.y + road.height
            ) {
                onRoad = true;
                break;
            }
        }

        if (onRoad) {
            i--;
            continue;
        }

        trees.push({
            x,
            y,
            radius: 20 + Math.random() * 8
        });
    }
}


// ============================================================
// BUSHES
// ============================================================

const bushes = [];

function createBushes() {

    const random = (min, max) =>
        Math.random() * (max - min) + min;

    for (let i = 0; i < 220; i++) {

        const x = random(30, world.width - 30);
        const y = random(30, world.height - 30);

        let onRoad = false;

        for (const road of roads) {

            if (
                x > road.x - 10 &&
                x < road.x + road.width + 10 &&
                y > road.y - 10 &&
                y < road.y + road.height + 10
            ) {
                onRoad = true;
                break;
            }
        }

        if (onRoad) {
            i--;
            continue;
        }

        bushes.push({
            x,
            y,
            radius: 9 + Math.random() * 7
        });
    }
}

createTrees();
createBushes();


// ============================================================
// LAKES
// ============================================================

const lakes = [

    {
        x: 600,
        y: 1200,
        rx: 270,
        ry: 170
    },

    {
        x: 1450,
        y: 450,
        rx: 300,
        ry: 190
    },

    {
        x: 2250,
        y: 1250,
        rx: 350,
        ry: 210
    },

    {
        x: 1500,
        y: 1750,
        rx: 250,
        ry: 150
    }
];


// ============================================================
// WATER CHECK
// ============================================================

function isInWater(x, y) {

    for (const lake of lakes) {

        const dx = x - lake.x;
        const dy = y - lake.y;

        const value =
            (dx * dx) / (lake.rx * lake.rx) +
            (dy * dy) / (lake.ry * lake.ry);

        if (value <= 1) {
            return true;
        }
    }

    return false;
}


// ============================================================
// ZOMBIES
// ============================================================

const zombies = [];

const zombieTypes = {

    weakSlow: {
        health: 35,
        speed: 0.75,
        damage: 5,
        radius: 14,
        color: "#5d8b4a"
    },

    tankSlow: {
        health: 150,
        speed: 0.5,
        damage: 13,
        radius: 21,
        color: "#59684e",
        tank: true
    },

    fastWeak: {
        health: 28,
        speed: 1.65,
        damage: 5,
        radius: 12,
        color: "#3f7847"
    },

    tankFast: {
        health: 115,
        speed: 1.15,
        damage: 12,
        radius: 19,
        color: "#4c5c43",
        tank: true
    }
};


// ============================================================
// WAVE SYSTEM
// ============================================================

let wave = 1;
let waveStarted = false;
let waveDelay = 0;

const totalWaves = 100;

function zombiesForWave(w) {

    return Math.min(
        8 + Math.floor(w * 2.2),
        180
    );
}

function chooseZombieType(w) {

    const roll = Math.random();

    if (w < 5) {
        return zombieTypes.weakSlow;
    }

    if (roll < 0.35) {
        return zombieTypes.weakSlow;
    }

    if (roll < 0.60) {
        return zombieTypes.fastWeak;
    }

    if (roll < 0.82) {
        return zombieTypes.tankSlow;
    }

    return zombieTypes.tankFast;
}


function spawnZombie(type) {

    let side = Math.floor(Math.random() * 4);

    let x;
    let y;

    if (side === 0) {
        x = Math.random() * world.width;
        y = -40;
    }

    else if (side === 1) {
        x = world.width + 40;
        y = Math.random() * world.height;
    }

    else if (side === 2) {
        x = Math.random() * world.width;
        y = world.height + 40;
    }

    else {
        x = -40;
        y = Math.random() * world.height;
    }

    zombies.push({

        x,
        y,

        radius: type.radius,

        health: type.health,
        maxHealth: type.health,

        speed: type.speed,
        damage: type.damage,

        color: type.color,

        tank: type.tank || false,

        attackCooldown: 0,

        houseAttackCooldown: 0
    });
}


function spawnBoss() {

    zombies.push({

        x: world.width / 2,
        y: 100,

        radius: 65,

        health: 6000,
        maxHealth: 6000,

        speed: 0.75,
        damage: 35,

        color: "#632020",

        tank: true,

        boss: true,

        attackCooldown: 0,

        houseAttackCooldown: 0
    });
}


function startWave() {

    waveStarted = true;

    message.textContent =
        wave === 100
            ? "WAVE 100 — BOSS!"
            : "WAVE " + wave;

    setTimeout(() => {

        message.textContent = "";

    }, 2000);

    if (wave === 100) {

        spawnBoss();

        return;
    }

    const amount = zombiesForWave(wave);

    for (let i = 0; i < amount; i++) {

        spawnZombie(
            chooseZombieType(wave)
        );
    }
}


// ============================================================
// HOUSE INTERACTION
// ============================================================

function interactWithHouse() {

    for (const house of houses) {

        if (house.state === 2) {
            continue;
        }

        const centerX =
            house.x + house.width / 2;

        const centerY =
            house.y + house.height / 2;

        const dx = player.x - centerX;
        const dy = player.y - centerY;

        const distance =
            Math.sqrt(dx * dx + dy * dy);

        if (distance < 130) {

            house.open = !house.open;

            return;
        }
    }
}


// ============================================================
// HOUSE COLLISION
// ============================================================

function circleRectCollision(circle, rect) {

    const closestX = Math.max(
        rect.x,
        Math.min(
            circle.x,
            rect.x + rect.width
        )
    );

    const closestY = Math.max(
        rect.y,
        Math.min(
            circle.y,
            rect.y + rect.height
        )
    );

    const dx = circle.x - closestX;
    const dy = circle.y - closestY;

    return (
        dx * dx + dy * dy <
        circle.radius * circle.radius
    );
}


// ============================================================
// TREE COLLISION
// ============================================================

function collidesWithTree(x, y, radius) {

    for (const tree of trees) {

        const dx = x - tree.x;
        const dy = y - tree.y;

        const distance =
            Math.sqrt(dx * dx + dy * dy);

        if (
            distance <
            radius + tree.radius * 0.65
        ) {
            return true;
        }
    }

    return false;
}


// ============================================================
// PLAYER COLLISION
// ============================================================

function blocked(x, y, radius) {

    // Houses

    for (const house of houses) {

        if (
            house.state !== 2 &&
            !house.open &&
            circleRectCollision(
                {
                    x,
                    y,
                    radius
                },
                house
            )
        ) {
            return true;
        }
    }

    // Trees

    if (
        collidesWithTree(
            x,
            y,
            radius
        )
    ) {
        return true;
    }

    return false;
}


// ============================================================
// PLAYER MOVEMENT
// ============================================================

function movePlayer() {

    let dx = 0;
    let dy = 0;

    if (keys["w"] || keys["arrowup"]) {
        dy -= 1;
    }

    if (keys["s"] || keys["arrowdown"]) {
        dy += 1;
    }

    if (keys["a"] || keys["arrowleft"]) {
        dx -= 1;
    }

    if (keys["d"] || keys["arrowright"]) {
        dx += 1;
    }

    if (dx !== 0 || dy !== 0) {

        const length =
            Math.sqrt(dx * dx + dy * dy);

        dx /= length;
        dy /= length;

        // WATER SLOWS PLAYER

        let currentSpeed = player.speed;

        if (
            isInWater(
                player.x,
                player.y
            )
        ) {
            currentSpeed *= 0.45;
        }

        const newX =
            player.x +
            dx * currentSpeed;

        const newY =
            player.y +
            dy * currentSpeed;

        if (
            !blocked(
                newX,
                player.y,
                player.radius
            )
        ) {
            player.x = newX;
        }

        if (
            !blocked(
                player.x,
                newY,
                player.radius
            )
        ) {
            player.y = newY;
        }
    }

    player.x = Math.max(
        player.radius,
        Math.min(
            world.width - player.radius,
            player.x
        )
    );

    player.y = Math.max(
        player.radius,
        Math.min(
            world.height - player.radius,
            player.y
        )
    );
}


// ============================================================
// ZOMBIE HOUSE COLLISION
// ============================================================

function getBlockingHouse(zombie) {

    for (const house of houses) {

        if (
            house.state !== 2 &&
            !house.open &&
            circleRectCollision(
                zombie,
                house
            )
        ) {
            return house;
        }
    }

    return null;
}


// ============================================================
// DAMAGE HOUSE
// ============================================================

function damageHouse(house, amount) {

    if (house.state === 2) {
        return;
    }

    house.health -= amount;

    if (
        house.health <
        house.maxHealth * 0.5
    ) {
        house.state = 1;
    }

    if (house.health <= 0) {

        house.health = 0;

        // The house is now broken.
        // Zombies can enter it.

        house.state = 2;
        house.open = true;
    }
}


// ============================================================
// ZOMBIE MOVEMENT
// ============================================================

function updateZombies() {

    for (const zombie of zombies) {

        const dx = player.x - zombie.x;
        const dy = player.y - zombie.y;

        const distance =
            Math.sqrt(dx * dx + dy * dy);

        // WATER SLOWS ZOMBIES

        let currentSpeed =
            zombie.speed;

        if (
            isInWater(
                zombie.x,
                zombie.y
            )
        ) {
            currentSpeed *= 0.45;
        }


        // Check if a house is blocking the zombie.

        const blockingHouse =
            getBlockingHouse(zombie);

        if (blockingHouse) {

            // Zombie attacks the house.

            if (
                zombie.houseAttackCooldown <= 0
            ) {

                damageHouse(
                    blockingHouse,
                    zombie.boss ? 15 : 5
                );

                zombie.houseAttackCooldown = 30;
            }

            else {

                zombie.houseAttackCooldown--;
            }

            // Push zombie slightly away
            // from the house instead of
            // letting it enter.

            const centerX =
                blockingHouse.x +
                blockingHouse.width / 2;

            const centerY =
                blockingHouse.y +
                blockingHouse.height / 2;

            const hx =
                zombie.x - centerX;

            const hy =
                zombie.y - centerY;

            const hDistance =
                Math.sqrt(
                    hx * hx +
                    hy * hy
                ) || 1;

            zombie.x +=
                (hx / hDistance) *
                0.35;

            zombie.y +=
                (hy / hDistance) *
                0.35;

        }

        else {

            if (distance > 1) {

                const vx =
                    dx / distance;

                const vy =
                    dy / distance;

                zombie.x +=
                    vx * currentSpeed;

                zombie.y +=
                    vy * currentSpeed;
            }
        }


        // Player damage

        if (zombie.attackCooldown > 0) {
            zombie.attackCooldown--;
        }

        if (
            distance <
            player.radius +
            zombie.radius +
            5
        ) {

            if (
                zombie.attackCooldown <= 0
            ) {

                player.health -=
                    zombie.damage;

                zombie.attackCooldown = 45;

                if (player.health <= 0) {

                    player.health = 0;

                    gameOver = true;

                    message.textContent =
                        "YOU DIED — PRESS R TO RESTART";
                }
            }
        }
    }
}


// ============================================================
// BULLET UPDATE
// ============================================================

function updateBullets() {

    for (
        let i = bullets.length - 1;
        i >= 0;
        i--
    ) {

        const bullet = bullets[i];

        bullet.x += bullet.vx;
        bullet.y += bullet.vy;

        bullet.life--;

        let removeBullet = false;


        // Zombies

        for (
            let j = zombies.length - 1;
            j >= 0;
            j--
        ) {

            const zombie = zombies[j];

            const dx =
                bullet.x - zombie.x;

            const dy =
                bullet.y - zombie.y;

            const distance =
                Math.sqrt(
                    dx * dx +
                    dy * dy
                );

            if (
                distance <
                zombie.radius + 4
            ) {

                zombie.health -=
                    bullet.damage;

                removeBullet = true;

                if (zombie.health <= 0) {

                    zombies.splice(j, 1);
                }

                break;
            }
        }


        // Houses can also be damaged by bullets.

        if (!removeBullet) {

            for (const house of houses) {

                if (
                    house.state !== 2 &&
                    circleRectCollision(
                        {
                            x: bullet.x,
                            y: bullet.y,
                            radius: 3
                        },
                        house
                    )
                ) {

                    damageHouse(
                        house,
                        10
                    );

                    removeBullet = true;

                    break;
                }
            }
        }


        if (
            bullet.life <= 0 ||
            bullet.x < 0 ||
            bullet.x > world.width ||
            bullet.y < 0 ||
            bullet.y > world.height ||
            removeBullet
        ) {

            bullets.splice(i, 1);
        }
    }
}


// ============================================================
// WAVE PROGRESSION
// ============================================================

function updateWave() {

    if (!waveStarted) {

        startWave();

        return;
    }

    if (zombies.length === 0) {

        if (wave >= totalWaves) {

            victory = true;

            message.textContent =
                "YOU SURVIVED ALL 100 WAVES!";

            return;
        }

        waveDelay++;

        if (waveDelay > 120) {

            wave++;

            waveDelay = 0;

            waveStarted = false;
        }
    }
}


// ============================================================
// CAMERA
// ============================================================

function updateCamera() {

    camera.x =
        player.x -
        canvas.width / 2;

    camera.y =
        player.y -
        canvas.height / 2;

    camera.x = Math.max(
        0,
        Math.min(
            world.width -
            canvas.width,
            camera.x
        )
    );

    camera.y = Math.max(
        0,
        Math.min(
            world.height -
            canvas.height,
            camera.y
        )
    );
}


// ============================================================
// DRAW WORLD
// ============================================================

function drawWorld() {

    ctx.fillStyle = "#3e4a36";

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    ctx.save();

    ctx.translate(
        -camera.x,
        -camera.y
    );


    // ========================================================
    // GROUND
    // ========================================================

    ctx.fillStyle = "#536047";

    ctx.fillRect(
        0,
        0,
        world.width,
        world.height
    );


    // Grass variation

    ctx.fillStyle =
        "rgba(20,30,20,0.18)";

    for (
        let x = 0;
        x < world.width;
        x += 60
    ) {

        for (
            let y = 0;
            y < world.height;
            y += 60
        ) {

            if (
                ((x * 7 + y * 3) % 11) < 4
            ) {

                ctx.fillRect(
                    x,
                    y,
                    2,
                    2
                );
            }
        }
    }


    // ========================================================
    // ROADS
    // ========================================================

    drawRoads();


    // ========================================================
    // LAKES
    // ========================================================

    for (const lake of lakes) {

        ctx.beginPath();

        ctx.ellipse(
            lake.x,
            lake.y,
            lake.rx + 12,
            lake.ry + 12,
            0,
            0,
            Math.PI * 2
        );

        ctx.fillStyle = "#26382e";

        ctx.fill();


        ctx.beginPath();

        ctx.ellipse(
            lake.x,
            lake.y,
            lake.rx,
            lake.ry,
            0,
            0,
            Math.PI * 2
        );

        ctx.fillStyle = "#416f78";

        ctx.fill();


        // Water ripples

        ctx.strokeStyle =
            "rgba(180,220,220,0.18)";

        ctx.lineWidth = 2;

        for (
            let i = -2;
            i <= 2;
            i++
        ) {

            ctx.beginPath();

            ctx.ellipse(
                lake.x + i * 20,
                lake.y + i * 8,
                lake.rx * 0.65,
                lake.ry * 0.08,
                0,
                0,
                Math.PI * 2
            );

            ctx.stroke();
        }
    }


    // ========================================================
    // BUSHES
    // ========================================================

    drawBushes();


    // ========================================================
    // TREES
    // ========================================================

    drawTrees();


    // ========================================================
    // HOUSES
    // ========================================================

    for (const house of houses) {

        drawHouse(house);
    }


    // ========================================================
    // BULLETS
    // ========================================================

    for (const bullet of bullets) {

        ctx.beginPath();

        ctx.arc(
            bullet.x,
            bullet.y,
            3,
            0,
            Math.PI * 2
        );

        ctx.fillStyle = "#ffe18a";

        ctx.fill();
    }


    // ========================================================
    // ZOMBIES
    // ========================================================

    for (const zombie of zombies) {

        drawZombie(zombie);
    }


    // ========================================================
    // PLAYER
    // ========================================================

    drawPlayer();

    ctx.restore();
}


// ============================================================
// DRAW ROADS
// ============================================================

function drawRoads() {

    for (const road of roads) {

        // Road surface

        ctx.fillStyle = "#3c3b37";

        ctx.fillRect(
            road.x,
            road.y,
            road.width,
            road.height
        );


        // Road edges

        ctx.strokeStyle = "#292824";

        ctx.lineWidth = 5;

        ctx.strokeRect(
            road.x,
            road.y,
            road.width,
            road.height
        );


        // Center line

        ctx.strokeStyle = "#b7a95e";

        ctx.lineWidth = 3;

        ctx.setLineDash([25, 22]);

        if (road.width > road.height) {

            ctx.beginPath();

            ctx.moveTo(
                road.x,
                road.y + road.height / 2
            );

            ctx.lineTo(
                road.x + road.width,
                road.y + road.height / 2
            );

            ctx.stroke();

        } else {

            ctx.beginPath();

            ctx.moveTo(
                road.x + road.width / 2,
                road.y
            );

            ctx.lineTo(
                road.x + road.width / 2,
                road.y + road.height
            );

            ctx.stroke();
        }

        ctx.setLineDash([]);
    }
}


// ============================================================
// DRAW TREES
// ============================================================

function drawTrees() {

    for (const tree of trees) {

        // Shadow

        ctx.beginPath();

        ctx.ellipse(
            tree.x,
            tree.y + 12,
            tree.radius * 1.1,
            tree.radius * 0.55,
            0,
            0,
            Math.PI * 2
        );

        ctx.fillStyle =
            "rgba(0,0,0,0.25)";

        ctx.fill();


        // Trunk

        ctx.fillStyle = "#59412d";

        ctx.fillRect(
            tree.x - 5,
            tree.y,
            10,
            25
        );


        // Main foliage

        ctx.beginPath();

        ctx.arc(
            tree.x,
            tree.y - 5,
            tree.radius,
            0,
            Math.PI * 2
        );

        ctx.fillStyle = "#304d2c";

        ctx.fill();


        // Second foliage layer

        ctx.beginPath();

        ctx.arc(
            tree.x - 10,
            tree.y + 3,
            tree.radius * 0.7,
            0,
            Math.PI * 2
        );

        ctx.fillStyle = "#3d6135";

        ctx.fill();


        ctx.beginPath();

        ctx.arc(
            tree.x + 10,
            tree.y + 2,
            tree.radius * 0.7,
            0,
            Math.PI * 2
        );

        ctx.fillStyle = "#35562f";

        ctx.fill();
    }
}


// ============================================================
// DRAW BUSHES
// ============================================================

function drawBushes() {

    for (const bush of bushes) {

        ctx.beginPath();

        ctx.arc(
            bush.x,
            bush.y,
            bush.radius,
            0,
            Math.PI * 2
        );

        ctx.fillStyle = "#31552d";

        ctx.fill();


        ctx.beginPath();

        ctx.arc(
            bush.x - bush.radius * 0.45,
            bush.y + 2,
            bush.radius * 0.7,
            0,
            Math.PI * 2
        );

        ctx.fillStyle = "#3d6636";

        ctx.fill();


        ctx.beginPath();

        ctx.arc(
            bush.x + bush.radius * 0.45,
            bush.y + 2,
            bush.radius * 0.7,
            0,
            Math.PI * 2
        );

        ctx.fillStyle = "#355b30";

        ctx.fill();
    }
}


// ============================================================
// DRAW HOUSE
// ============================================================

function drawHouse(house) {

    // Shadow

    ctx.fillStyle =
        "rgba(0,0,0,0.3)";

    ctx.fillRect(
        house.x + 8,
        house.y + 8,
        house.width,
        house.height
    );


    // Broken house

    if (house.state === 2) {

        ctx.fillStyle = "#62584b";

        ctx.fillRect(
            house.x,
            house.y,
            house.width,
            house.height
        );

        // Broken holes

        ctx.fillStyle = "#27231f";

        ctx.fillRect(
            house.x + 15,
            house.y + 20,
            45,
            35
        );

        ctx.fillRect(
            house.x + 95,
            house.y + 15,
            50,
            40
        );

        ctx.fillRect(
            house.x + 45,
            house.y + 75,
            75,
            45
        );

        // Rubble

        ctx.fillStyle = "#49433c";

        for (let i = 0; i < 12; i++) {

            const rx =
                house.x +
                Math.random() *
                house.width;

            const ry =
                house.y +
                Math.random() *
                house.height;

            ctx.fillRect(
                rx,
                ry,
                7,
                5
            );
        }

        return;
    }


    // Walls

    ctx.fillStyle =
        house.state === 1
            ? "#877967"
            : "#a9987b";

    ctx.fillRect(
        house.x,
        house.y,
        house.width,
        house.height
    );


    // Roof

    ctx.beginPath();

    ctx.moveTo(
        house.x - 15,
        house.y
    );

    ctx.lineTo(
        house.x + house.width / 2,
        house.y - 55
    );

    ctx.lineTo(
        house.x + house.width + 15,
        house.y
    );

    ctx.closePath();

    ctx.fillStyle = "#4a3b35";

    ctx.fill();


    // Windows

    ctx.fillStyle = "#6b9ba3";

    ctx.fillRect(
        house.x + 20,
        house.y + 30,
        35,
        30
    );

    ctx.fillRect(
        house.x + house.width - 55,
        house.y + 30,
        35,
        30
    );


    // Door

    if (house.open) {

        ctx.fillStyle = "#161616";

    } else {

        ctx.fillStyle = "#49372c";
    }

    ctx.fillRect(
        house.x + house.width / 2 - 20,
        house.y + house.height - 55,
        40,
        55
    );


    // House health bar

    if (house.health < house.maxHealth) {

        const width = house.width;

        ctx.fillStyle = "#222";

        ctx.fillRect(
            house.x,
            house.y - 14,
            width,
            6
        );

        ctx.fillStyle =
            house.state === 1
                ? "#d58a39"
                : "#66b95c";

        ctx.fillRect(
            house.x,
            house.y - 14,
            width *
                (house.health /
                    house.maxHealth),
            6
        );
    }
}


// ============================================================
// DRAW ZOMBIE
// ============================================================

function drawZombie(zombie) {

    ctx.save();

    ctx.translate(
        zombie.x,
        zombie.y
    );


    // Boss

    if (zombie.boss) {

        ctx.beginPath();

        ctx.arc(
            0,
            0,
            zombie.radius,
            0,
            Math.PI * 2
        );

        ctx.fillStyle = "#571b1b";

        ctx.fill();

        ctx.strokeStyle = "#1c0808";

        ctx.lineWidth = 5;

        ctx.stroke();


        ctx.fillStyle = "#ffbd45";

        ctx.beginPath();

        ctx.arc(
            -20,
            -12,
            7,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.beginPath();

        ctx.arc(
            20,
            -12,
            7,
            0,
            Math.PI * 2
        );

        ctx.fill();


        // Boss health

        const barWidth = 130;

        ctx.fillStyle = "#111";

        ctx.fillRect(
            -barWidth / 2,
            -zombie.radius - 25,
            barWidth,
            10
        );

        ctx.fillStyle = "#c83c3c";

        ctx.fillRect(
            -barWidth / 2,
            -zombie.radius - 25,
            barWidth *
                (zombie.health /
                    zombie.maxHealth),
            10
        );

        ctx.restore();

        return;
    }


    // Body

    ctx.beginPath();

    ctx.arc(
        0,
        0,
        zombie.radius,
        0,
        Math.PI * 2
    );

    ctx.fillStyle =
        zombie.color;

    ctx.fill();

    ctx.strokeStyle = "#20251c";

    ctx.lineWidth = 2;

    ctx.stroke();


    // Eyes

    ctx.fillStyle = "#d9e0c2";

    ctx.beginPath();

    ctx.arc(
        -zombie.radius * 0.35,
        -zombie.radius * 0.25,
        zombie.radius * 0.18,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.beginPath();

    ctx.arc(
        zombie.radius * 0.35,
        -zombie.radius * 0.25,
        zombie.radius * 0.18,
        0,
        Math.PI * 2
    );

    ctx.fill();


    // Bucket

    if (zombie.tank) {

        ctx.fillStyle = "#777";

        ctx.beginPath();

        ctx.arc(
            0,
            -zombie.radius * 0.5,
            zombie.radius * 0.8,
            Math.PI,
            Math.PI * 2
        );

        ctx.fill();

        ctx.strokeStyle = "#333";

        ctx.stroke();

        ctx.fillStyle = "#444";

        ctx.fillRect(
            -zombie.radius * 0.65,
            -zombie.radius * 0.55,
            zombie.radius * 1.3,
            5
        );
    }


    // Health bar

    const width =
        zombie.radius * 2.2;

    ctx.fillStyle = "#222";

    ctx.fillRect(
        -width / 2,
        -zombie.radius - 12,
        width,
        4
    );

    ctx.fillStyle = "#75c15d";

    ctx.fillRect(
        -width / 2,
        -zombie.radius - 12,
        width *
            Math.max(
                0,
                zombie.health /
                zombie.maxHealth
            ),
        4
    );

    ctx.restore();
}


// ============================================================
// DRAW PLAYER
// ============================================================

function drawPlayer() {

    ctx.save();

    ctx.translate(
        player.x,
        player.y
    );


    // Shadow

    ctx.beginPath();

    ctx.ellipse(
        0,
        8,
        18,
        8,
        0,
        0,
        Math.PI * 2
    );

    ctx.fillStyle =
        "rgba(0,0,0,0.35)";

    ctx.fill();


    // Body

    ctx.beginPath();

    ctx.arc(
        0,
        0,
        player.radius,
        0,
        Math.PI * 2
    );

    ctx.fillStyle = "#2c5b86";

    ctx.fill();

    ctx.strokeStyle = "#101820";

    ctx.lineWidth = 3;

    ctx.stroke();


    // Gun direction

    const worldMouseX =
        mouse.x + camera.x;

    const worldMouseY =
        mouse.y + camera.y;

    const angle =
        Math.atan2(
            worldMouseY - player.y,
            worldMouseX - player.x
        );

    ctx.rotate(angle);

    ctx.fillStyle = "#222";

    ctx.fillRect(
        8,
        -4,
        23,
        8
    );

    ctx.restore();
}


// ============================================================
// MINIMAP
// ============================================================

function drawMinimap() {

    const w = minimap.width;
    const h = minimap.height;

    miniCtx.clearRect(
        0,
        0,
        w,
        h
    );

    miniCtx.fillStyle = "#263026";

    miniCtx.fillRect(
        0,
        0,
        w,
        h
    );

    const sx =
        w / world.width;

    const sy =
        h / world.height;


    // Roads

    for (const road of roads) {

        miniCtx.fillStyle = "#4b4a46";

        miniCtx.fillRect(
            road.x * sx,
            road.y * sy,
            road.width * sx,
            road.height * sy
        );
    }


    // Lakes

    for (const lake of lakes) {

        miniCtx.beginPath();

        miniCtx.ellipse(
            lake.x * sx,
            lake.y * sy,
            lake.rx * sx,
            lake.ry * sy,
            0,
            0,
            Math.PI * 2
        );

        miniCtx.fillStyle = "#355c66";

        miniCtx.fill();
    }


    // Houses

    for (const house of houses) {

        miniCtx.fillStyle =
            house.state === 2
                ? "#665d53"
                : "#b6a485";

        miniCtx.fillRect(
            house.x * sx,
            house.y * sy,
            house.width * sx,
            house.height * sy
        );
    }


    // Trees

    for (const tree of trees) {

        miniCtx.beginPath();

        miniCtx.arc(
            tree.x * sx,
            tree.y * sy,
            1.5,
            0,
            Math.PI * 2
        );

        miniCtx.fillStyle = "#244326";

        miniCtx.fill();
    }


    // Zombies

    for (const zombie of zombies) {

        miniCtx.beginPath();

        miniCtx.arc(
            zombie.x * sx,
            zombie.y * sy,
            zombie.boss ? 5 : 2.5,
            0,
            Math.PI * 2
        );

        miniCtx.fillStyle =
            zombie.boss
                ? "#ff8a00"
                : "#e23939";

        miniCtx.fill();
    }


    // Player

    miniCtx.beginPath();

    miniCtx.arc(
        player.x * sx,
        player.y * sy,
        4,
        0,
        Math.PI * 2
    );

    miniCtx.fillStyle = "#4aa7ff";

    miniCtx.fill();
}


// ============================================================
// HUD
// ============================================================

function updateHUD() {

    healthText.textContent =
        Math.ceil(player.health);

    waveText.textContent =
        wave;

    zombiesText.textContent =
        zombies.length;

    weaponText.textContent =
        guns[currentGun].name;
}


// ============================================================
// GAME STATE
// ============================================================

let gameOver = false;
let victory = false;


// ============================================================
// MAIN UPDATE
// ============================================================

function update() {

    if (gameOver || victory) {
        return;
    }

    movePlayer();

    if (mouse.down) {
        shoot();
    }

    updateBullets();

    updateZombies();

    updateWave();

    updateCamera();

    updateHUD();
}


// ============================================================
// MAIN DRAW
// ============================================================

function draw() {

    drawWorld();

    drawMinimap();
}


// ============================================================
// GAME LOOP
// ============================================================

function gameLoop() {

    update();

    draw();

    requestAnimationFrame(gameLoop);
}


// ============================================================
// START
// ============================================================

gameLoop();// ============================================================
// SAVE / LOAD SYSTEM
// ============================================================

const SAVE_KEY = "zombie_survival_save_v1";

function saveGame() {

    const saveData = {
        player: {
            x: player.x,
            y: player.y,
            health: player.health
        },

        wave: wave,
        currentGun: currentGun,

        houses: houses.map(house => ({
            x: house.x,
            y: house.y,
            width: house.width,
            height: house.height,
            state: house.state,
            health: house.health,
            maxHealth: house.maxHealth,
            open: house.open
        })),

        zombies: zombies.map(zombie => ({
            x: zombie.x,
            y: zombie.y,
            radius: zombie.radius,
            health: zombie.health,
            maxHealth: zombie.maxHealth,
            speed: zombie.speed,
            damage: zombie.damage,
            color: zombie.color,
            tank: zombie.tank,
            boss: zombie.boss,
            attackCooldown: zombie.attackCooldown,
            houseAttackCooldown: zombie.houseAttackCooldown
        }))
    };

    localStorage.setItem(
        SAVE_KEY,
        JSON.stringify(saveData)
    );
}


function loadGame() {

    const saved = localStorage.getItem(SAVE_KEY);

    if (!saved) {
        return false;
    }

    try {

        const saveData =
            JSON.parse(saved);


        // Player

        if (saveData.player) {

            player.x =
                saveData.player.x;

            player.y =
                saveData.player.y;

            player.health =
                saveData.player.health;
        }


        // Wave

        if (
            typeof saveData.wave ===
            "number"
        ) {
            wave = saveData.wave;
        }


        // Weapon

        if (
            typeof saveData.currentGun ===
            "number"
        ) {

            currentGun =
                Math.max(
                    0,
                    Math.min(
                        guns.length - 1,
                        saveData.currentGun
                    )
                );
        }


        // Houses

        if (
            Array.isArray(
                saveData.houses
            )
        ) {

            for (
                let i = 0;
                i < houses.length;
                i++
            ) {

                const savedHouse =
                    saveData.houses[i];

                if (!savedHouse) {
                    continue;
                }

                houses[i].state =
                    savedHouse.state;

                houses[i].health =
                    savedHouse.health;

                houses[i].maxHealth =
                    savedHouse.maxHealth;

                houses[i].open =
                    savedHouse.open;
            }
        }


        // Zombies

        zombies.length = 0;

        if (
            Array.isArray(
                saveData.zombies
            )
        ) {

            for (
                const savedZombie
                of saveData.zombies
            ) {

                zombies.push({
                    x: savedZombie.x,
                    y: savedZombie.y,

                    radius:
                        savedZombie.radius,

                    health:
                        savedZombie.health,

                    maxHealth:
                        savedZombie.maxHealth,

                    speed:
                        savedZombie.speed,

                    damage:
                        savedZombie.damage,

                    color:
                        savedZombie.color,

                    tank:
                        savedZombie.tank || false,

                    boss:
                        savedZombie.boss || false,

                    attackCooldown:
                        savedZombie.attackCooldown || 0,

                    houseAttackCooldown:
                        savedZombie.houseAttackCooldown || 0
                });
            }
        }


        // Make sure the game doesn't immediately
        // start a brand-new wave after loading.

        waveStarted = true;
        waveDelay = 0;

        updateCamera();
        updateHUD();

        return true;

    } catch (error) {

        console.error(
            "Could not load save:",
            error
        );

        return false;
    }
}


// ============================================================
// AUTO SAVE
// ============================================================

// Save every 10 seconds.

setInterval(() => {

    if (!gameOver && !victory) {
        saveGame();
    }

}, 10000);


// ============================================================
// SAVE WHEN LEAVING PAGE
// ============================================================

window.addEventListener(
    "beforeunload",
    () => {

        if (!gameOver && !victory) {
            saveGame();
        }
    }
);


// ============================================================
// LOAD PREVIOUS GAME
// ============================================================

loadGame();
