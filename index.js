
  var express = require('express');
  var app = express();
  var server = require('http').Server(app);
  var io = require('socket.io')(server);
  var port = process.env.PORT || 80;
  var users = [];
  
  server.listen(port, function () {
    console.log('Updated : Server listening at port %d', port);
  });
  
  // Routing
  app.use('/js',  express.static(__dirname + '/public/js'));
  app.use('/css', express.static(__dirname + '/public/css'));
  app.use(express.static(__dirname + '/public'));
  
  
  // usernames which are currently connected to the chat
  var usernames = {};  
  var numUsers = 0;
  var userlist = '';
  
  io.on('connection', function (socket) {
    var addedUser = false;
    
    // when the client emits 'new message', this listens and executes
    socket.on('new message', function (data) {
    	if(data === ' '){
    // Check for specific commands
    	}else{
    	if(data === '/color' || data === '/Color'){
    		data = 'changed color';
    	}
    	if(data === '/list' || data === '/List'){
    		console.log(socket.nickname + ' called list');
    		var counter = 0;
    		var msg = '';
        	for ( counter ; counter < users.length; counter++) {
                if(counter === 0){ 
                	msg += users[counter]; 
                } else { 
                	msg += ', ' + users[counter];
                }
            }
        	console.log(msg);
        	 socket.emit('list', msg);

    	}else if(data.indexOf('@') === 0){
    		console.log('found /@');
    		var messageArray = data.split(' ');
    	    var user = messageArray[0];
    	    var privateMessage = messageArray.splice(1).join(' ');
    	    var name;
    	    if (user.charAt(0) === '@') {
    	    	name = user.slice(1);
    	    }
    		if (name in usernames){
    			privateMessage = 'private: ' + privateMessage;
    			socket.broadcast.to(usernames[name].id).emit(
       					'new message',{
    				username: socket.nickname,
					message: privateMessage,
    		        timestamp: Date.now(),
    					}
    			);
    		}
    	}else if(data.includes('/note') || data.includes('/Note')){
    		var noteArray = data.split(' ');
    	    var note = noteArray.splice(1).join(' ');
        	 socket.emit('announce', note);    
        	 } else{        		 
      // Tell the client to execute 'new message'
      socket.broadcast.emit('new message', {
        username: socket.nickname,
        message: data,
        timestamp: Date.now()
      });}
      console.log('I sent it');
    	}
    });
    
    // when the client emits 'add user', this listens and executes
    socket.on('add user', function (username) {
      // store the username in the socket session for this client
      // add the client's username to the global list
      socket.nickname=username;
      usernames[socket.nickname]=socket;
      users.push(socket.nickname);
      ++numUsers;
      addedUser = true;
      socket.emit('login', {
        numUsers: numUsers
      });
      // echo globally (all clients) that a person has connected
      socket.broadcast.emit('user joined', {
        username: socket.nickname,
        numUsers: numUsers
      });
    });
  
    // when the client emits 'typing', broadcast it to others
    socket.on('typing', function () {
      socket.broadcast.emit('typing', {
        username: socket.nickname
      });
    });
  
    // when the client emits 'stop typing', broadcast it to others
    socket.on('stop typing', function () {
      socket.broadcast.emit('stop typing', {
        username: socket.nickname
      });
    });
  
    // when the user disconnects.. perform this
    socket.on('disconnect', function () {
      // remove the username from global usernames list
      if (addedUser) {
    	users.splice(users.indexOf(socket.nickname),1);
        delete usernames[socket.nickname];
        --numUsers;
  
        // echo globally that this client has left
        socket.broadcast.emit('user left', {
          username: socket.nickname,
          numUsers: numUsers
        });
      }
    });
  });
  
  