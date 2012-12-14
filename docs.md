App (client)
	input
	rendering
	client/server

App (server)
	client/server
	run master boards

Board
	game logic
	server/client
		The board tells the server what the player is doing.
		The server keeps track of all boards, and sends them back to the clients when anything changes.
		The server forces each client to drop the pieces after a set time limit.
		The server broadcasts slave board updates to all clients.
		
		This gives us 3 board modes:
			* Server - Recieve player input via websocket (left/right/rotate/drop + timed drop) and run them as the authorative instance.
			* Player - Recieve input from the player (left/right/rotate/drop), run them and animate them, send via websocket to the server for verification.
			* Slave - Recieve player input via websocket, run them and animate them.


Human
	Reads input and manuipulates a BoardProxySender

BoardProxySender
	Communicates with a BoardProxyReciever via websocket.

BoardProxyReciever
	Manipulates a board




         Browser          socket.io  Server


         player --> Board ---------> Board

                          correction
                          <---------


When sending player input to the server and state corrections back, include a serverStateCounter. On the server, ignore any input sent to the wrong state. On the client, only read this value and send with each player input. *Never* set it after initialization, except when recieving a state correction.

A state correction includes all members of the board object, except the piece cycle that never changes.



Board {
	
	serverStateCounter = 0,

}




For the animations, never stall the player input. Treat them only as effects. The player should be able to continue droping pieces and have the game progress like if the animations didn't exist.