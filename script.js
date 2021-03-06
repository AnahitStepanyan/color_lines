"use strict";

// matrix and table size
const size = 9;

/* ------------- FUNCTIONS ------------- */

function random_int (min, max) {
  // random integer from min to max+1
  let rand = min + Math.random() * (max + 1 - min);
  return Math.floor(rand);
}

// for array callback
function for_each (array, callback) {
  for(let i = 0; i < array.length; i++){
    callback(array[i], i);
  }
}

// idk if this would help
function matrix_index_to_vector_index (i, j) {
  return i * size + j; 
}
function vector_index_to_matrix_index (index) {
  let index_object = {};
  index_object.j = index % size;
  index_object.i = (index - index_object.j) / size;

  return index_object;
}

// get elems by selector
function get_cells(selector){
  return grid.querySelectorAll(selector);
}

// for right filling
function matrix_is_full(){
  let emptySells = 0;
  for(let i = 0; i < size; i++){
    for(let j = 0; j < size; j++){
      if(matrix[i][j] == 0){
        emptySells++;
      }
      if(emptySells >= 3) return emptySells;
    }
  }
  return emptySells;
}

// random balls showing
function add_balls () {
  let emptySells = matrix_is_full();
  // base case
  if(!emptySells) return;

  // not base case
  let tds = document.querySelectorAll("td");
  
  let cells = [];
  for(let i = 0; i < emptySells; i++){
    let randColor = random_int(0, colorsSize-1);
    let randX = random_int(0, size-1);
    let randY = random_int(0, size-1);
    while(matrix[randX][randY] !== 0){
      randX = random_int(0, size-1);
      randY = random_int(0, size-1);
    }
    matrix[randX][randY] = randColor+1;
    
    let tdIndex = matrix_index_to_vector_index(randX, randY);
    cells.push(tds[tdIndex]);
    let ball = document.createElement("div");
    ball.classList.add("ball");
    ball.style.background = colors[randColor];
    tds[tdIndex].appendChild(ball);
  }

  let lineSets = [];

  for (let i = 0; i < cells.length; i++) {
    let lines = get_lines(cells[i]);
    if (lines) {
      lineSets.push(lines);
    }
  }

  // Checks if five-ball lines are found after adding balls				
  if (lineSets.length > 0) {
    remove_line(lineSets);
  } else {
    // Checks if the grid is completely filled with balls
    if (no_empty_cells()) {
      // Ends the game
      setTimeout(function (){
        game_over();
      }, 1000);
    }
  }

}

function game_over () {
  alert("Game Over :(");
  let bool = confirm("Wanna play again?");
  if(bool) {
    initialize(size);
  } else {
    alert("Okay :) Thank You!");
  }
}

function no_empty_cells () {
  for (let i = 0; i < size; i++)
    for(let j = 0; j < size; j++)
      if (matrix[i][j] === 0) 
        return false;
  
  return true;
}


/* ------------------------------------ */
/* --------------- MAIN --------------- */
/* ------------------------------------ */

// all the nessesary variables
let grid = document.querySelector("#grid");
let scoreElem = document.querySelector("#score");
let recordElem = document.querySelector("#record");
let table = document.createElement("table");
let colors = ["rgb(33, 224, 200)", "rgb(33, 66, 224)", "rgb(254, 226, 0)", "rgb(254, 130, 0)", "rgb(254, 4, 0)", "rgb(40, 221, 14)", "rgb(190, 14, 221)"];
const colorsSize = colors.length;
let selected = false;


/* --------- creating table and matrix --------- */
let matrix = [];


function initialize (size) {

  table.innerHTML = "";
  scoreElem.innerHTML = 0;
  recordElem.innerHTML = localStorage.getItem('lines-record') || 0;
  // rows
  for(let i = 0; i < size; i++){
    matrix[i] = [];
    
    let tr = document.createElement('tr');
    // columns
    for(let j = 0; j < size; j++){
      matrix[i][j] = 0; // fill zeros

      // cells
      let td = document.createElement('td');
      td.id = 'cell-' + i + '-' + j;
      td.dataset.x = i;
      td.dataset.y = j;
      tr.appendChild(td);

      // events on clicks
      td.addEventListener('click', function(e){
        if(matrix[i][j]) {
          on_ball_click(e);
        } else {
          on_empty_cell_click(e);
        }
      });
    }
    table.appendChild(tr);
  }
  grid.appendChild(table);
  // first 3 random balls
  add_balls();
}

initialize(size);



/* ----------------------------------------------------------- */
/* - other functions that can't be in the header (or can, idk) - */
/* ----------------------------------------------------------- */

// when click was on the ball
// object event as parameter
function on_ball_click(e) {
  // console.log(e.currentTarget.dataset.x + " " + e.currentTarget.dataset.y);

  for_each(get_cells(".ball"), function(td){
    if(td.classList.contains('selected')){
      td.classList.remove('selected');
      return;
      // returning from callback, not from on_ball_click!
    }
  });

  e.currentTarget.firstElementChild.classList.add("selected");
  selected = e.currentTarget;
}


// when click was on an empty cell
// object event as parameter
function on_empty_cell_click(e) {
  // console.log(e.currentTarget.dataset.x + " " + e.currentTarget.dataset.y);

  if(!selected) return;

  let startPos = selected;
  let endPos = e.currentTarget;
  let currentBall = selected.firstElementChild;
  let bg = getComputedStyle(currentBall).backgroundColor;
  let colorIndex = colors.indexOf(bg);
  // for matrix
  let startx = startPos.dataset.x;
  let starty = startPos.dataset.y;
  let endx = endPos.dataset.x;
  let endy = endPos.dataset.y;

  // imagine path is real
  // upd: no more need to imagine
  if(is_found(startx, starty, endx, endy)){
    // ball is moved
    endPos.appendChild(currentBall);
    currentBall.classList.remove("selected");
    selected = false;
  
    matrix[startx][starty] = 0;
    matrix[endx][endy] = colorIndex+1;

    // now check for lines
    let there_are_lines = get_lines(endPos);
    if(there_are_lines) {
      console.log("there_are_lines");
      remove_line([there_are_lines]);
    } else {
      setTimeout(add_balls, 50);
    }
  }
}

/* ------------ WAVE ALGORIHM -------------- */
// we need queue
function is_found (startx, starty, endx, endy){
  // if(1) return true;
  let matrix2 = [];
  for(let i = 0; i < size; i++){
    matrix2[i] = [];
    for(let j = 0; j < size; j++){
      matrix2[i][j] = -1;
    }
  }

  endx = Number(endx);
  endy = Number(endy);
  startx = Number(startx);
  starty = Number(starty);
  
  let q = [];

  q.push(startx);
  q.push(starty);

  while (1) {
    if(q.length === 0) {
      return false;
    }

    // when ball reaches his destination
    // return value = true
    if((startx == endx && starty == endy-1) ||
       (startx == endx-1 && starty == endy) ||
       (startx == endx && starty == endy+1) ||
       (startx == endx+1 && starty == endy))
    {
      return true;
    }

    // waving
    startx = q.shift();
    starty = q.shift();
    startx++; // bottom 1 step from position
    if(startx >= 0 && startx < size && starty >= 0 && starty < size) {
      if(matrix[startx][starty] == 0 && matrix2[startx][starty] == -1){
        q.push(startx);
        q.push(starty);
        matrix2[startx][starty] = 1;
      }
    }
    
    startx -= 2; // top 1 step from position
    if(startx >= 0 && startx < size && starty >= 0 && starty < size) {
      if(matrix[startx][starty] == 0 && matrix2[startx][starty] == -1){
        q.push(startx);
        q.push(starty);
        matrix2[startx][starty] = 1;
      }
    }
    
    startx++; // back to position
    starty++; // right 1 step
    if(startx >= 0 && startx < size && starty >= 0 && starty < size) {
      if(matrix[startx][starty] == 0 && matrix2[startx][starty] == -1){
        q.push(startx);
        q.push(starty);
        matrix2[startx][starty] = 1;
      }
    }
    
    starty -= 2; // left 1 step
    if(startx >= 0 && startx < size && starty >= 0 && starty < size) {
      if(matrix[startx][starty] == 0 && matrix2[startx][starty] == -1){
        q.push(startx);
        q.push(starty);
        matrix2[startx][starty] = 1;
      }
    }
    starty++; // back to position
  }
}

/* ---------- GETTING LINES ---------- */

function get_lines (cell) {
  let bg = getComputedStyle(cell.firstElementChild).backgroundColor;
  let ball = colors.indexOf(bg)+1;

  let x = Number(cell.dataset.y);
  let y = Number(cell.dataset.x);
  
  let lines = [[[x, y]], [[x, y]], [[x, y]], [[x, y]]];

  let l, r, u, d, lu, ru, ld, rd;
  l = r = u = d = lu = ru = ld = rd = ball;
  let i = 1;

  while ([l, r, u, d, lu, ru, ld, rd].indexOf(ball) !== -1) {

    // Horizontal lines
    if (l == matrix[y][x - i]) { lines[0].push([x - i, y]); } else { l = -1; }
    if (r == matrix[y][x + i]) { lines[0].push([x + i, y]); } else { r = -1; }

    // Vertical lines
    if (y - i >= 0 && u == matrix[y - i][x]) { lines[1].push([x, y - i]); } else { u = -1; }
    if (y + i <= size-1 && d == matrix[y + i][x]) { lines[1].push([x, y + i]); } else { d = -1; }

    // Diagonal lines
    if (y - i >= 0 && lu == matrix[y - i][x - i]) { lines[2].push([x - i, y - i]); } else { lu = -1; }
    if (y + i <= size-1 && rd == matrix[y + i][x + i]) { lines[2].push([x + i, y + i]); } else { rd = -1; }
    if (y + i <= size-1 && ld == matrix[y + i][x - i]) { lines[3].push([x - i, y + i]); } else { ld = -1; }
    if (y - i >= 0 && ru == matrix[y - i][x + i]) { lines[3].push([x + i, y - i]); } else { ru = -1; }

    i++;
  }

  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].length < 5) {
      lines.splice(i, 1);
    }
  }

  // Returns five-ball lines or false
  return (lines.length > 0) ? lines : false;
}


/* -------------- REMOVE LINES ---------------- */
function remove_line (lines_arr) {
  let score = Number(scoreElem.innerHTML);
  let scoreToPlus;
  for (let k in lines_arr) {
    let lines = lines_arr[k];
    scoreToPlus = 0;

    for(let i = 0; i < lines.length; i++) {
      for (let j = 0; j < lines[i].length; j++) {
        let x = lines[i][j][0];
        let y = lines[i][j][1];
        let cell = document.getElementById("cell-" + y + '-' + x);
        // 'cell-' + i + '-' + j;
        console.log(cell);
        cell.firstElementChild.classList.add("fadeout");
        setTimeout(function(){
          cell.removeChild(cell.firstElementChild);
        }, 500);
        
        matrix[y][x] = 0;
        scoreToPlus += 2;
      }
    }
  }

  score += scoreToPlus;
  if(score > Number(recordElem.innerHTML)){
    localStorage.setItem('lines-record', score);
    recordElem.innerHTML = score;
  }
  scoreElem.innerHTML = score;
}


document.querySelector("#new-game").addEventListener('click', function(){
  initialize(size);
});


// document.querySelector("#add").addEventListener('click', add_balls);
// document.querySelector("#show_mat").addEventListener('click', function(){
//   console.log(matrix);
// });
