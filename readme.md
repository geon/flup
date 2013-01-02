flup
====
Puzzle game written in Javascript with Canvas.

What?
-----

Way back in 1998 or so, I played a game on the original Play Station. It was a rather traditional puzzle game à la Tetris, Columns, Super Puzzle Fighter 2X, etc. You drop colored pieces into a grid, where you need to line up matching colors to remove them. You play against an opponent, and pieces are added to your grid when the opponent scores, and vice versa. Wholesome fun for the whole family.

Why?
----

I just love puzzle games like this. The simplicity of the game rules, and the deep gameplay that emerges is really special.

I halfway wrote a clone in VB6, but I wasn't a very good programmer back then, and I never managed to implement multiplayer gaming properly. I started over again a few years later in C++, but nothing came of it. I blame over thinking it and the stupid linker.

The idea stayed with me ever since, so I just recently decided I would give it a go in Javascript this time.

It is also a great excuse to exercise my Javascript application programming skills. I't a lot different from just adding some jQuery click handlers and AJAX...


How?
----

I had a quick look at a few js game engines, most notably Cocos 2D. They didn't really seem like they would offer me much, since I don't do any physics, or a have a tile based world map. And the documentation just sucks.

Instead I decided to do it with plain Canvas. 

I have made a few notable design decisions. The animations never stall the player input. Instead, they are treated only as effects. The player should be able to continue dropping pieces and have the game progress like if the animations didn't exist.

This makes it easier to add client/server multiplayer later on, since I have to run the game logic on booth the client (for responsiveness) and on the server (to prevent cheating). Only player input needs to be sent, and the game will progress identically on booth ends. Whenever there is a timing issue (like if the client think it dropped a piece first, but the server thinks the opponent scored before that, making you lose), the server will just send the correct board and the client will have to accept its ruling.

To achieve this decoupling, I use an animation queue, where you can just add animations with a interpolation, duration and optional delay. The animation of each piece is set to play something in the future, so the visual are nicely choreographed, while the logic happens instantly.


TODO
----

The next few issues on the map:

* The visual queue of pieces feeding the dropper feels weird when the dropper is vertical. The pieces und up upside-down compared to how they sat in the queue. Feed the queue from above, move the pieces straight to the side, or flip them in the opposite direction at the end.
* Add a piece-grid background image.
* Improve the layout and size of the canvas. Full-browser + portrait layout?
* Add input for touch.
* Switch makePiecesFall to use breadth-first.
* Pieces in the column above an exploding piece should fall immediately, not after the whole chain is gone.
* Add the game over condition.
* Add a time limit to the piece-dropping. 5 seconds initially, and shrinking by a second per minute? After that, the piece will drop automatically whereever the dropper is at the moment.
* Make the pieces start wiggling nervously as they get close to the upper limit (game over).
* Add actual multiplayer. keyboard sharing is enough as a first step.
* Add punishments (extra pieces added from below) to opponents when the player scores multiple chains.
* Add a start and game over/winner screen.
* Add music with varying stress levels depending on how close you are to losing.
* Add sound effects.
* Sync all visuals and sound effects to the music. Lock the most significant effects to whole beats, and smaller effects to 1/2, 1/4, 1/8, 1/16 of a beat and so on. (The game Rez did this, and it was awesome.) With the existing animation queue system, it should be relatively easy to implement.
* Switch all new Date().getTime() to passing a current time and limit the delta time. As it is now, it is sometimes problematic to debug stuff where the animation won't care that you have paused the code at a breakpoint in the debugger.
* Add characters to choose from when starting the game. The character could determine the pattern of the pieces added when someone scores.
	* Cute robots?
	* One pic for menu/gameplay + one broken (exploded robot head) for losers. When losing, shake the sprite .5 seconds, then switch sprite and play break sound effect.
	* Small, simple animations by switching/moving body part sprites.
		* Blinking eyes/blinkenlights
		* Bobbing head to the beat of the music.
		* Simple disco dance steps.
		* Hold pieces in the hand and drop them.
* Add alternative game styles; Single player (for ppoints) with and without piece-dropping time limit.
* Animation timing is tedious and tricky to get it all just right. Possibly switch to some other method.

Server/Client
-------------

I plan to build a websocket based server for multiplayer. MMO Puzzler anyone? Some notes about it:

server/client

The board tells the server what the player is doing.
The server keeps track of all boards, and sends them back to the clients when anything changes.
The server forces each client to drop the pieces after a set time limit.
The server broadcasts slave board updates to all clients.

This gives us 3 board modes:
* Server - Receive player input via websocket (left/right/rotate/drop + timed drop) and run them as the authoritative instance.
* Player - Receive input from the player (left/right/rotate/drop), run them and animate them, send via websocket to the server for verification.
* Slave - Receive player input via websocket, run them and animate them.




         Browser          socket.io  Server


         player --> Board ---------> Board

                          correction
                          <---------


When sending player input to the server and state corrections back, include a serverStateCounter. On the server, ignore any input sent to the wrong state. On the client, only read this value and send with each player input. *Never* set it after initialization, except when recieving a state correction.

A state correction includes all members of the board object, except the piece cycle that never changes.

