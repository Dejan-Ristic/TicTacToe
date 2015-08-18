function ApiCalls() {
}

ApiCalls.joinGame = function(pl_1_name, is_human){
    $.ajax({
        url: 'join-game-mode/P/'+pl_1_name,
        type: "GET",
        dataType: 'json',
        contentType: 'application/json',
        success: joinGameSuccess,
        error: joinGameError
    });
    function joinGameSuccess(response) {
        BotStart.init(response, is_human);
    }
    function joinGameError(response) {
        console.log("Error: "+response);
    }
};

ApiCalls.joinSession = function(ses_id, pl_2_name, is_human){
    $.ajax({
    url: 'join-session/'+ses_id+'/'+pl_2_name,
    type: "GET",
    dataType: 'json',
    contentType: 'application/json',
    success: joinSessionSuccess,
    error: joinSessionError
    });
    function joinSessionSuccess(response) {
        BotStart.init(response, is_human, ses_id);
    }
    function joinSessionError(response) {
        console.log("Error: "+response);
    }
};

ApiCalls.sessionStatus = function(){
    $.ajax({
        url: 'get-session-state/'+bot.get_session_id(),
        type: "GET",
        dataType: 'json',
        contentType: 'application/json',
        success: sessionStatusSuccess,
        error: sessionStatusError
    });
    function sessionStatusSuccess(response) {
        bot.checkMove(response);
    }
    function sessionStatusError(response) {
        console.log("Error: "+response);
    }
};

ApiCalls.playersStatus = function(){
    $.ajax({
        url: 'get-session-state/'+bot.get_session_id(),
        type: "GET",
        dataType: 'json',
        contentType: 'application/json',
        success: playersStatusSuccess,
        error: playersStatusError
    });
    function playersStatusSuccess(response) {
        bot.waitBothPlayers(response);
    }
    function playersStatusError(response) {
        console.log("Error: "+response);
    }
};

ApiCalls.playMove = function(y, x){
    $.ajax({
        url: 'play-move/'+bot.get_session_id()+'/'+bot.get_player_id()+'/'+y+'/'+x,
        type: "GET",
        dataType: 'json',
        contentType: 'application/json',
        success: playMoveSuccess,
        error: playMoveError
    });
    function playMoveSuccess() {
        bot.pingSession();
    }
    function playMoveError(response) {
        console.log("Error: "+response);
    }
};