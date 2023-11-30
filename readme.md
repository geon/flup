flup
====
Puzzle game written in Javascript with Canvas.

What?
-----

Way back in 1998 or so, I played a game called *Super Bub Contest* on the original Play Station. It was a rather traditional puzzle game à la Tetris, Columns, Super Puzzle Fighter 2X, etc. You drop colored pieces into a grid, where you need to line up matching colors to remove them. You play against an opponent, and pieces are added to your grid when the opponent scores, and vice versa. Wholesome fun for the whole family.

* https://www.youtube.com/watch?v=7g_1861gSYs
* https://www.caveofmonsters.co.uk/super-bub

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

* Some events should not be queued up.
	* Dropper charge shuld only wait for itself.
	* Dropper movements should only wait for itself and the dropper charge.
	* Eveything else should wait for everything.
* Inputs should not be accepted while previous inputs are animated.
* A held-down move-key (A/D, left/right) should continously trigger move inputs.
* Add a menu system. To begin with, just "Start". Then "Select Game Mode" and "Select Character" as they get implemented. DOM-based?
* Add a start and game over/winner screen.
* Add a time limit to the piece-dropping. 5 seconds initially, and shrinking by a second per minute? After that, the piece will drop automatically whereever the dropper is at the moment.
* Add input for touch.
* The visual queue of pieces feeding the dropper feels weird when the dropper is vertical. The pieces und up upside-down compared to how they sat in the queue. Feed the queue from above, move the pieces straight to the side, or flip them in the opposite direction at the end.
* Pieces in the column above an exploding piece should fall immediately, not after the whole chain is gone.
* Try how it feels if the droppedd pieces can never land on top of each-other, but will disappear immediately when they land, making room for the piece above. That makes it possible to make the pieces shatter immediately when a chain is made, instead of waiting for everything to settle.
* Add characters to choose from when starting the game.
	* Complete animation.
		* One pic for menu/gameplay + one broken for losers. When losing, shake the sprite .5 seconds, then switch sprite and play break sound effect.
	* Small, simple animations by switching/moving body part sprites.
		* Blinking eyes.
		* Bobbing head to the beat of the music.
* Add sound effects.
* Add music with varying stress levels depending on how close you are to losing.
* Add alternative game styles; Single player (for points) with and without piece-dropping time limit. Implement as multiple "Game" objects that takes care of the gameplay mechanics and layout differences?

Server/Client
-------------

It could be done.

Just send all input to the server, and broadcast to all players. The input don't affect the local board until they are echoed back. That way we can't get inconsitencies. Nice! If lag becomes a problem, do speculative anmations in parallell with an actual board and overwrite if they diverge.
