title = "INFI-JUMP";

description = `
[Hold] Jump\n[Release] Fall
`;

characters = [
  `
   gL
 ccg
cccgg
bb g
   g
  g g
  `
];

const G = {
  WIDTH: 200,
  HEIGHT: 150,
  STAR_SPEED_MIN: 0.5,
  STAR_SPEED_MAX: 1.0
};

/**
* @typedef {{
* pos: Vector,
* speed: number,
* vel: Vector
* }} Star
*/

/**
* @typedef { Star[] }
*/
let stars;

/**
 * @typedef {{
 * pos: Vector,
 * vel: Vector,
 * onPad: boolean,
 * fuel: number,
 * fuelSize: number
 * }} Player
 */

/**
 * @typedef { Player }
 */
let player;

/**
 * @typedef {{
 * pos: Vector,
 * vel: Vector,
 * active: boolean
 * }} Platform
 */

/**
 * @typedef { Platform }
 */
let platforms;

let globalVel;
let tickElapsed;
let multiplier;
let fuelScaled;

options = {
  theme: "pixel",
  viewSize: {x:G.WIDTH, y:G.HEIGHT},
  isPlayingBgm:true,
  isReplayEnabled: true,
  seed: 8 
};

function update() {
  //init()
  if (!ticks) {
    //star setup begin
    stars = times(20, () => {
      const posX = rnd(0, G.WIDTH);
      const posY = rnd(0, G.HEIGHT);

      return{
        pos: vec(posX, posY),
        speed: rnd(G.STAR_SPEED_MIN, G.STAR_SPEED_MAX),
        vel: vec()
      };
    });
    //star setup end

    player = {
      pos: vec(30, G.HEIGHT * 0.5),
      vel: vec(),
      fuel: 100,
      fuelSize: 100,
      onPad: false
    };
    
    globalVel = 0;
    tickElapsed = 0;
    multiplier = 1;

    text("MUL x" + multiplier.toFixed(1), G.WIDTH * 0.5 - 10, 10);

    //initial platform
    platforms = [];
    platforms.push({ pos: vec(22, G.HEIGHT * 0.5 + 3), vel: vec(globalVel, 0), active: false});
    platforms.push({ pos: vec(190, rnd(120) + 20), vel: vec(globalVel, 0), active: true});
    platforms.push({ pos: vec(platforms[1].pos.x + 171, rnd(120) + 20), vel: vec(globalVel, 0), active: true});
  
    //calculate fuel
    let a = Math.abs(platforms[1].pos.x - platforms[0].pos.x); 
    let b = Math.abs(platforms[1].pos.y - platforms[0].pos.y);
    let c = Math.sqrt(Math.pow(a, 2) + Math.pow(b, 2));

    player.fuelSize = c * 0.6;
    player.fuel = player.fuelSize;
  
  }

  //render stars\
  color("light_black");
  stars.forEach((s) => {
    box(s.pos, 1);
  });

  //draw current platforms
  color("yellow");
  platforms.forEach((p) => {
    rect(p.pos, 20, 2);
  });

  if(player.fuel >= 60)
    color("green");
  else if(player.fuel >= 25 && player.fuel < 60)
    color("light_yellow");
  else
    color("red");
  
  fuelScaled = (player.fuel / player.fuelSize) * 100;
  rect(2, 30 + (100 - fuelScaled), 5, fuelScaled);

  color("black");
  text("MUL x" + multiplier.toFixed(1), G.WIDTH * 0.5 - 22, 10);

  //draw player
  char("a", player.pos);

  if(player.pos.y > 150){
    play("select");
    end();
  }

  //Jetpack use on input
  if(input.isPressed && ticks > 10 && player.fuel > 0){
    play("jump");
    player.fuel--;
    player.vel.y -= 0.04;
    globalVel += -0.02;
    tickElapsed *= 0.95;

    //jetpack particles
    color("red");
    particle(
      player.pos.x - .6,
      player.pos.y + .4,
      2,
      1,
      -(5*PI)/4,
      PI/4
    );
  }else{ //if jetpack not being used

    player.onPad = char("a", player.pos).isColliding.rect.yellow;

    //if not on pad, descend with acceleration
    if(!player.onPad){
      tickElapsed++;
      player.vel.y += 0.04 * tickElapsed/75;
      globalVel *= 0.99;
    }else{
      player.vel.y = 0;
      globalVel = 0;

      if(platforms[0].active){
        play("coin");
        platforms[0].active = false;
        multiplier += 0.1;
        addScore((100 + fuelScaled) * multiplier, G.WIDTH * 0.5, G.HEIGHT * 0.5);
        
        //calculate fuel
        let a = Math.abs(platforms[1].pos.x - platforms[0].pos.x); 
        let b = Math.abs(platforms[1].pos.y - platforms[0].pos.y);
        let c = Math.sqrt(Math.pow(a, 2) + Math.pow(b, 2));

        player.fuelSize = c * (0.6 - 0.05 * difficulty > 4 ? 4 : difficulty);
        player.fuel = player.fuelSize;

        

        color("black");
        particle(
          G.WIDTH * 0.5,
          G.HEIGHT * 0.5 - 10,
          30,
          3,
          0,
          2*PI
        );

        color("yellow");
        particle(
          platforms[0].pos.x + 10,
          platforms[0].pos.y -1,
          30,
          2,
          PI/3,
          PI
        );

        color("green");
        particle(
          5,
          30,
          10,
          1,
          -PI/2,
          PI
        );
      }
    }
  }

  //platform removal
  if(platforms[0].pos.x < -50){
    platforms.shift();
    platforms.push({ pos: vec(platforms[1].pos.x + 171, rnd(120) + 20), vel: vec(globalVel, 0), active: true});
  }

  platforms.forEach((p) => {
    p.vel.x = globalVel;
    p.pos.add(p.vel);
  });
  //star parallax
  stars.forEach((s) => {
    s.vel.x = globalVel * s.speed;
    s.pos.add(s.vel);
    s.pos.wrap(0, G.WIDTH, 0, G.HEIGHT);
    s.vel.mul(0.95);
  });
  //player physics + drag + clamp
  player.vel.mul(0.95);
  player.pos.add(player.vel);
  player.pos.clamp(0, G.WIDTH, -100, G.HEIGHT + 10);
}
