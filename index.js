var canvas = document.querySelector('canvas');
var socket = new WebSocket("ws://99.241.147.138:1345");

canvas.width = 600;
canvas.height = 600;

var c = canvas.getContext('2d');

const name = prompt("What is your username?");
const username = Math.random().toString();
const grid = 10;
const BOARDWIDTH = canvas.width;
const BOARDHEIGHT = canvas.height;
const PIXELWIDTH = BOARDWIDTH / grid;
const PIXELHEIGHT = BOARDHEIGHT / grid;
const LADDERDIST = 20;
const VEL = 5;
const QUESTIONS = ["What is the opposite of conjunct music? (Luka);disjunct;antijunct;unjunct;dejunct",
				   "What does Mezzo Forte (mf) mean? (Luka);Moderately loud;Moderately quiet;Very loud;Very quiet",
				   "Which element of music best describes how 'high' or 'low' notes sound? (Luka);Pitch;Rhythm;Texture;Timbre",
				   "How fast is 60 bpm? (Luka);1 beat per second;2 beats per second;half a beat per second;4 beats per second",
				   "What is a polyphonic song? (Luka);A song with two or more melodic lines;A song with one melodic line;A melody supported by harmony;A harmony with no melody",

				   "What is timbre? (Luca);The pitch quality of a note.;How loud you play.;How long you hold a note.;The name of a note.",
				   "What is the order of the treble clef notes? (Luca);E,F,G,A,B,C,D,E,F;E,E,G,A,B,C,D,E,F;E,F,G,A,B,C,D,E,E;E,G,F,A,B,D,C,E,F",
				   "What does a Tie do? (Luca);Connects two notes of the same pitch;Make’s a note be longer by half its value.;Connects a bar of notes.;Connects three notes.",
				   "How long do you hold a dotted quarter note for? (Luca);1.5 beats.;Three beats.;Two beats.;0.5 beats",
				   "What does a dot beside a note do? (Luca);Adds half the length of the note to the total length.;Doubles the note length.;Adds quarter the length of the note to the total length.;Makes the note half the length.",

				   "_____ is the sound when 2 or more notes are played at the same time (David);Harmony;Melody;Rhythm;Meter",
				   "How many different elements of music are there (David);7;10;5;3",
				   "_____ is the first string instrument ever made that’s recorded;Lyres of Ur;Zeusaphone;Pikasso guitar;Cello horn",
				   "What is this sign called 𝄻 (David);Whole Rest;Half Rest;Staff;Measure",
				   "How many different notes are there in music (David);12;10;7;15",

				   "What is the smallest note (Gabriel);256th note;128th note;eight note;1  6th note",
				   "How many beats does a whole note last (Gabriel);4 beats;2 beats;1 beat;half a beat",

				   "What is another word for melody? (Louis);Tune;Rhythm;Dictation;Melody's just melody, duh",
				   "What is the word that conveys the length of a note? (Louis);Note value;Overtone;Form;Rhythm",
				   "If you were to portray soft, sad music, what would you use? (Louis);Mezzo Piano;Mezzo Forte;Fortissimo;Fortississimo"
				   ];

var localPlayer = "";
var users = {};

var rawQuestion;
var question;
var correctIndex;
var roll;
var turn = false;
var rolled = false;

const pawns = ["Data/pawn_blue.png", "Data/pawn_green.png", "Data/pawn_orange.png",
			 "Data/pawn_pink.png", "Data/pawn_purple.png", "Data/pawn_red.png",
			 "Data/pawn_yellow.png"];

function User(colour, x, y) {
	this.username = username;
	this.name = name;
	this.colour = colour;
	this.x = x;
	this.y = y;
}

socket.onopen = function(e) {
	console.log("Connection established.");
	if (name == undefined) {
		name = "guest";
	}
	socket.send("COLR" + username);
};

socket.onmessage = function(event) {
	var category = event.data.slice(0,4);
	var data = event.data.slice(4);

	if (category == "COLR") {
		localPlayer = new User(data, 0, 540);
		socket.send("JOIN" + JSON.stringify(localPlayer));
	}

	else if (category == "DATA") {
		users = JSON.parse(data);
		resetPlayer();
		document.getElementById("users").innerHTML = "";
		Object.entries(users).forEach(([key, value]) => {
			document.getElementById("users").innerHTML += "<br><img src=\"Data/" + value.colour + ".png\" alt=\"User pawn\" height=\"42\" width=\"42\">\n" + value.name;
		});
	}

	else if (category == "NPLR") {
		var player = JSON.parse(data);
		users[player["username"]] = player;
		document.getElementById("users").innerHTML += "<br><img src=\"Data/" + player.colour + ".png\" alt=\"User pawn\" height=\"42\" width=\"42\">\n" + player.name;
	}

	else if (category == "MOVE") {
		var player = JSON.parse(data);
		users[player["username"]] = player;
	}

	else if (category == "PTUR") {
		var player = JSON.parse(data);
		if (player.username == username) {
			turn = true;
			document.getElementById("alert1").innerHTML = "It's your turn! Roll to begin.";

			resetQuestions();
			document.getElementById('answer1').innerHTML = '';
			document.getElementById('answer2').innerHTML = '';
			document.getElementById('answer3').innerHTML = '';
			document.getElementById('answer4').innerHTML = '';
			document.getElementById('question').innerHTML = 'Roll to get a question!';

		} else {
			document.getElementById("alert1").innerHTML = "It's " + player.name + "'s turn!";
		}
	}

	else if (category == "WINR") {
		var plyr = JSON.parse(data);
		if (plyr.username == username) {
			document.getElementById("alert1").innerHTML = "You won the game! Starting new game in 10 seconds...";
		} else {
			document.getElementById("alert1").innerHTML = plyr.name + " won the game! Starting new game in 10 seconds...";
		}

		setTimeout(() => {
			resetPlayer();
			if (turn) {
				document.getElementById("alert1").innerHTML = "It's your turn! Roll to begin.";
			}
		}, 10000);

	}
};

socket.onclose = function(event) {
	if (event.wasClean) {
		console.log(`[close] Connection closed cleanly, code=${event.code} reason=${event.reason}`);
	} else {
		// e.g. server process killed or network down
		// event.code is usually 1006 in this case
		console.log('[close] Connection died');
	}
};

socket.onerror = function(error) {
	alert('[Error] Could not connect to the server. Please try again later.');
};

function movement() {
	socket.send("MOVE" + JSON.stringify(new User(localPlayer.colour, player.x, player.y)));
}

function endTurn() {
	socket.send("DONE_");
	turn = false;
	rolled = false;
}

function win() {
	socket.send("WINR" + username);
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }

    return array;
}

function ask_question() {
	resetQuestions();

	rawQuestion = choice(QUESTIONS).split(";");
	question = rawQuestion[0];
	var shuffled = shuffleArray([rawQuestion[1], rawQuestion[2], rawQuestion[3], rawQuestion[4]]);

	correctIndex = shuffled.indexOf(rawQuestion[1]) + 1;

	document.getElementById("question").innerHTML = question;
	document.getElementById("answer1").innerHTML = shuffled[0];
	document.getElementById("answer2").innerHTML = shuffled[1];
	document.getElementById("answer3").innerHTML = shuffled[2];
	document.getElementById("answer4").innerHTML = shuffled[3];
}

function optionClicked(option) {
	resetQuestions();
	if (turn && rolled) {
		document.getElementById('option-' + option).checked = true;

		if (correctIndex == option) {
			player.move(roll);
		} else {
	      	document.getElementById('answer' + option).style.color = 'red';
		}
	  	document.getElementById('answer' + correctIndex).style.color = 'lime';

	  	endTurn();
	}
}

function resetQuestions() {
	document.getElementById('option-1').checked = false;
	document.getElementById('option-2').checked = false;
	document.getElementById('option-3').checked = false;
	document.getElementById('option-4').checked = false;

	document.getElementById('answer1').style.color = 'white';
	document.getElementById('answer2').style.color = 'white';
	document.getElementById('answer3').style.color = 'white';
	document.getElementById('answer4').style.color = 'white';
}

function notify(notification) {
	document.getElementById("alert1").innerHTML = notification;
}

function randint(min, max) {
	return Math.floor(Math.random() * Math.floor(max - min)) + min;
}

function choice(iterable) {
	return iterable[randint(0, iterable.length)];
}

function get_floor(square) {
	return Math.floor(square / grid) + 1;
}

function degToRad(d)  {
    return d * 0.01745;
}

function rollDice() {
	if (turn && !rolled) {
		roll = randint(1, 7);
		notify("You rolled a " + roll.toString() + "!\nGet the question correct to move!");
		ask_question();
		rolled = true;
	}
}

function draw_line(x1, y1, x2, y2, colour, thickness) {
	c.strokeStyle = colour;
	c.lineWidth = thickness;
	c.beginPath();
	c.moveTo(x1, y1);
	c.lineTo(x2, y2);
	c.stroke();
	c.lineWidth = 1;
}

function find_angle(pos, vertex) {
    var sX = vertex[0];
    var sY = vertex[1];
    try {
        var angle = Math.atan((sY - pos[1]) / (sX - pos[0]))
    } catch (err) {
        var angle = (Math.pi / 2)
    }

    if (pos[1] <= sY && pos[0] >= sX) {
        angle = Math.abs(angle);
    } else if (pos[1] <= sY && pos[0] <= sX) {
        angle = Math.PI - angle;
    } else if (pos[1] >= sY && pos[0] <= sX) {
        angle = Math.PI + Math.abs(angle);
    } else if (pos[1] >= sY && pos[0] >= sX) {
        angle = (Math.PI * 2) - angle;
    }

    angle -= 90 * Math.PI / 180;
    return angle
}

// unused, but its too good to delete
function drawRotated(x, y, degrees, sprite, width, height) {
    c.save();
    c.translate(x, y);
    c.rotate(degrees);
    c.translate(-x, -y);
    c.drawImage(sprite.image, sprite.src_x, sprite.src_y, sprite.src_width, sprite.src_height, x, y, width, height);
    c.restore();
}


function Pixel(x, y, width, height, number) {
	this.x = x;
	this.y = y;
	this.width = width;
	this.height = height;
	this.number = number;

	this.draw = function() {
		if (this.number % 2 == 0) {
			c.fillStyle = "red";
			c.fillRect(this.x, this.y, this.width, this.height);
		}
		c.fillStyle = "black";
		c.strokeStyle = "black";
		c.strokeRect(this.x, this.y, this.width, this.height);
		c.font = "30px Arial";
		var textwidth = c.measureText(this.number.toString()).width
		c.fillText(this.number.toString(), (this.x + width / 2) - (textwidth / 2), this.y + this.width / 2 + 15);
	}
}

function Sprite(image, width, height, src_x, src_y, src_width, src_height) {
	// x, y, width, height is used to resize the image
	// for src things you put the actual size of the image

	this.image = new Image();
	this.image.src = image;
	this.width = width;
	this.height = height;
	this.src_x = src_x;
	this.src_y = src_y;
	this.src_width = src_width;
	this.src_height = src_height;

	this.draw = function(x, y) {
		c.drawImage(this.image, this.src_x, this.src_y, this.src_width, this.src_height, x, y, this.width, this.height);
	}

}

function Player(sprite) {
	this.x = pixels[0].x;
	this.y = pixels[0].y;
	this.moved = false;
	this.square = 1;
	this.floor = 1;
	this.perm_goal = 1;
	this.temp_goal = 1;
	this.sprite = sprite;
	this.incline = undefined;

	this.move = function(boardloc) {
		if (this.moved || boardloc == 1) {
			this.perm_goal = this.square + boardloc;
		} else {
			this.perm_goal = this.square + boardloc - 1;
		}
		this.temp_goal = this.square + 1;
		this.moved = true;
	}

	this.update = function() {
		this.floor = get_floor(this.square);
		var temp_goal_floor = get_floor(this.temp_floor);

		if (this.perm_goal != this.square) {

			if (this.square >= 99) {
				win();
			} else {

				if (this.floor % 2 == 1) {
					if (this.x <= pixels[this.temp_goal].x || this.y <= pixels[this.temp_goal].y) {
						if ((this.square + 1) % 10 == 0) {
							this.y -= VEL;
							movement();
						} else {
							this.x += VEL;
							movement();
						}
					}

					if (this.x >= pixels[this.temp_goal].x) {
						if ((this.square + 1) % 10 != 0 || this.y <= pixels[this.temp_goal].y) {
							this.square++;
							this.temp_goal = this.square + 1;
							this.x = pixels[this.temp_goal - 1].x;
							this.y = pixels[this.temp_goal - 1].y;
						}
					}
				}

				else if (this.floor % 2 == 0) {

					try {
						if (this.x >= pixels[this.temp_goal].x || this.y <= pixels[this.temp_goal].y) {
							if ((this.square + 1) % 10 == 0) {
								this.y -= VEL;
								movement();
							} else {
								this.x -= VEL;
								movement();
							}
						}

						if (this.x <= pixels[this.temp_goal].x) {
							if ((this.square + 1) % 10 != 0 || this.y <= pixels[this.temp_goal].y) {
								this.square++;
								this.temp_goal = this.square + 1;
								this.x = pixels[this.temp_goal - 1].x;
								this.y = pixels[this.temp_goal - 1].y;
							}
						}
					} catch (err) {
						win();
					}
				}
			}

		} else {

			for (var i = 0; i < inclines.length; i++) {
				if (inclines[i].start == this.square + 1) {
					this.incline = inclines[i];
				}
			}

		}

		if (this.incline != undefined) {
			var y2 = pixels[this.incline.end - 1].y;
			var y1 = pixels[this.incline.start - 1].y;
			var x2 = pixels[this.incline.end - 1].x;
			var x1 = pixels[this.incline.start - 1].x;

			var angle = find_angle([x1, y1], [x2, y2]);

			this.x += Math.sin(angle) * VEL;
			this.y += Math.cos(angle) * VEL;
			movement()

			if (this.incline.type == 0 && this.y <= y2) {
				this.square = this.incline.end - 1;
				this.perm_goal = this.square;
				this.incline = undefined;
				this.x = x2;
				this.y = y2;
			}

			if (this.incline.type == 1 && this.y >= y2) {
				this.square = this.incline.end - 1;
				this.perm_goal = this.square;
				this.incline = undefined;
				this.x = x2;
				this.y = y2;
			}
		}
	}

	this.draw = function() {
		this.sprite.draw(this.x + 9, this.y);
	}

}

function Incline(start, end, sprite, type) {
	this.start = start;
	this.end = end;
	this.type = type;
	this.floor_difference = get_floor(this.end) - get_floor(this.start);
	this.sprite = sprite;
	this.x = Math.min([pixels[this.start - 1].x], pixels[this.end - 1].x);
	this.y = Math.min([pixels[this.start - 1].y], pixels[this.end - 1].y);


	this.draw = function() {

		// bar 1

		var x1 = pixels[this.start - 1].x + PIXELWIDTH / 2;
		var y1 = pixels[this.start - 1].y + PIXELHEIGHT / 2 + LADDERDIST / 2;
		var x2 = pixels[this.end - 1].x + PIXELWIDTH / 2;
		var y2 = pixels[this.end - 1].y + PIXELHEIGHT / 2 + LADDERDIST / 2;

		//draw_line(x1, y1, x2, y2, "blue", 5);

		// bar 2

		x1 = pixels[this.start - 1].x + PIXELWIDTH / 2;
		y1 = pixels[this.start - 1].y + PIXELHEIGHT / 2 - LADDERDIST / 2;
		x2 = pixels[this.end - 1].x + PIXELWIDTH / 2;
		y2 = pixels[this.end - 1].y + PIXELHEIGHT / 2 - LADDERDIST / 2;

		//draw_line(x1, y1, x2, y2, "blue", 5);

		sprite.draw(this.x + PIXELWIDTH / 2, this.y + PIXELWIDTH / 2);
	}
}

function resetPlayer() {
	player = new Player(new Sprite("Data/" + localPlayer.colour + ".png", PIXELWIDTH, PIXELHEIGHT, 0, 0, 128, 128));
	movement();
}


var pixels = [];

var counter = 0;
var direction = true;
for (var y = 10; y > 0; y--) {
	if (direction) {
		for (var x = 0; x < 10; x++) {
			counter++;
			pixels.push(new Pixel(x * PIXELWIDTH, y * PIXELHEIGHT - PIXELHEIGHT, PIXELWIDTH, PIXELHEIGHT, counter));
		}
	} else {
		for (var x = 10; x > 0; x--) {
			counter++;
			pixels.push(new Pixel(x * PIXELWIDTH - PIXELWIDTH, y * PIXELHEIGHT - PIXELHEIGHT, PIXELWIDTH, PIXELHEIGHT, counter));
		}
	}
	direction = !direction;
}

var inclines = [new Incline(83, 99, new Sprite("Data/ladder-2x2.png", 60, 60, 0, 0, 60, 60), 0),
			   new Incline(21, 42, new Sprite("Data/ladder-2x3.png", 60, 120, 0, 0, 60, 120), 0),
			   new Incline(28, 76, new Sprite("Data/ladder-4x6.png", 180, 600, 0, 0, 180, 600), 0),
			   new Incline(4, 14, new Sprite("Data/ladder-4x2.png", 180, 60, 0, 0, 180, 60), 0),

			   new Incline(29, 8, new Sprite("Data/snake-2x3.png", 60, 180, 0, 0, 60, 180), 1),
			   new Incline(77, 42, new Sprite("Data/snake-3x4.png", 120, 180, 0, 0, 120, 180), 1),
			   new Incline(44, 15, new Sprite("Data/snake-3x4-2.png", 180, 240, 0, 0, 180, 240), 1),
			   new Incline(92, 73, new Sprite("Data/snake-2x3-2.png", 60, 120, 0, 0, 60, 120), 1),
			   new Incline(86, 68, new Sprite("Data/snake-3x3.png", 180, 180, 0, 0, 180, 180), 1)];

var player = new Player(new Sprite("Data/pawn_blue.png", PIXELWIDTH, PIXELHEIGHT, 0, 0, 128, 128));
var connected = false;

function animate() {
	requestAnimationFrame(animate);
	c.clearRect(0, 0, innerWidth, innerHeight);

	if (localPlayer != "" && !connected) {
		connected = true;
		player.sprite = new Sprite("Data/" + localPlayer.colour + ".png", PIXELWIDTH, PIXELHEIGHT, 0, 0, 128, 128)
	}

	for (var i = 0; i < pixels.length; i++) {
		pixels[i].draw();
	}

	Object.entries(users).forEach(([key, value]) => {
		var img = new Sprite("Data/" + value.colour + ".png", PIXELWIDTH, PIXELHEIGHT, 0, 0, 128, 128)
		img.draw(value.x + 9, value.y);
	});

	player.update();

	for (var i = 0; i < inclines.length; i++) {
		inclines[i].draw();
	}

}
animate();
