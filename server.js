//	remember to run mongod and server.js

var mongo   = require('mongodb').MongoClient, 				//	Allows connection to mongoDB
	client 	= require('socket.io').listen(8080).sockets;	//	Handles clients connected to port 8080

//checks if connected to database chat, if so callback
mongo.connect('mongodb://127.0.0.1/chat', function(err, db){
	if(err) throw err;		//	error handling
	
	//	callback once socket connection on port 8080 is found
	client.on('connection', function(socket){
		//	messages table in the chat database
		var col = db.collection('messages'),
			//	function that emits a status event for the browser side to retrieve
			sendStatus = function(s) {
				socket.emit('status', s);
			};

		//	Emit all messages
		//	return last 100 messages from table, sort in reverse order,
		//	and store as array in callback res
		col.find().limit(100).sort({_id: 1}).toArray(function(err, res){
			if(err) throw err;
			socket.emit('output', res);	//	emit 'output' event to connected socket
		});

		//	waits for socket emitting 'input'
		socket.on('input', function(data) {
			var name = data.name,		//	pulls name from emitted data
				message = data.message,	//	pulls message from emitted data
				whiteSpacePattern = /^\s*$/;	//	regExp whitespace

			//	checks if whitespace is present in name or message
			if(whiteSpacePattern.test(name) || whiteSpacePattern.test(message)) {
				sendStatus("Name and message is required.");
			} else {
				//insert name and message into the messages table in chat database
				col.insert({name: name, message: message}, function(){
					
					//	emit latest message to all clients
					client.emit('output', [data]);

					//	send an object to sendStatus with clear value being true
					sendStatus({
						message: "Message Sent",
						clear: true
					});
				});
			}
		});
	});
});