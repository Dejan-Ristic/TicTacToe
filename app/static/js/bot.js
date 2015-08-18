function BotStart(){

    var session_id;
    var player_id;

    var is_human = false;
    var my_player;

    var my_symbol;
    var games_played = 0;
    var move_number = 0;
    var real_table = [];
    var transformation_type = null;
    var first_field_bot;
    var first_field_opp;

    var transform = {
        "00": "no_transform",
        "01": "no_transform",
        "02": "one_turn",
        "10": "three_turns",
        "11": "no_transform",
        "12": "one_turn",
        "20": "three_turns",
        "21": "two_turns",
        "22": "two_turns"
    };

    var transform_methods = {
        "no_transform": {
            "real_table": ["00", "01", "02", "10", "11", "12", "20", "21", "22"],
            "trans_table": ["00", "01", "02", "10", "11", "12", "20", "21", "22"]},

        "one_turn": {
            "real_table": ["00", "01", "02", "10", "11", "12", "20", "21", "22"],
            "trans_table": ["20", "10", "00", "21", "11", "01", "22", "12", "02"]},

        "two_turns": {
            "real_table": ["00", "01", "02", "10", "11", "12", "20", "21", "22"],
            "trans_table": ["22", "21", "20", "12", "11", "10", "02", "01", "00"]},

        "three_turns": {
            "real_table": ["00", "01", "02", "10", "11", "12", "20", "21", "22"],
            "trans_table": ["02", "12", "22", "01", "11", "21", "00", "10", "20"]}
    };

    this.set_session_id = function(ses_id){
        session_id = ses_id;
        return session_id;
    };
    this.get_session_id = function(){
        return session_id ? session_id : null;
    };
    this.set_player_id = function(pl_id){
        player_id = pl_id;
        return player_id;
    };
    this.get_player_id = function(){
        return player_id ? player_id : null;
    };
    this.set_is_human = function(status){
        is_human = status;
        return is_human;
    };

    this.pingSession = function(){
        intervalPingSession = setInterval(function(){
            ApiCalls.sessionStatus();
        }, 50);
    };

    this.waitBothPlayers = function(sess_obj){
        if(sess_obj['player_1'] !== null && sess_obj['player_2'] !== null){
            clearInterval(intervalWaitBothPlayers);
            my_player = (sess_obj['player_1']['id'] === player_id) ? 'player_1' : 'player_2';
            my_symbol = sess_obj[my_player]['symbol'];
            this.pingSession();

            //***********************************************************************************
            real_table = sess_obj['current_game']['fields'];
            displayBothPlayersData(sess_obj['player_1']['id'], sess_obj['player_1']['name'],
                                    sess_obj['player_2']['id'], sess_obj['player_2']['name']);
            displayTable(real_table);
            //***********************************************************************************
        }
    };

    this.checkMove = function(sess_obj){

        //***********************************************************************************
        real_table = sess_obj['current_game']['fields'];
        displayTable(real_table);
        //***********************************************************************************

        if(!(sess_obj['games'].length > games_played)) {
            if (sess_obj['current_game']['next_symbol'] === my_symbol) {
                clearInterval(intervalPingSession);
                real_table = sess_obj['current_game']['fields'];
                move_number += 1;
                my_symbol === "x" ? this.playAsX() : this.playAsO();
            }
        }
        else {
            clearInterval(intervalPingSession);
            games_played = sess_obj['games'].length;
            my_symbol = sess_obj[my_player]['symbol'];
            transformation_type = null;
            move_number = 0;
            this.pingSession();

            //***********************************************************************************
            real_table = sess_obj['current_game']['fields'];
            displayTable(real_table);
            displayResults(sess_obj['games'].length, sess_obj['player_1']['wins'], sess_obj['draw'],
                            sess_obj['player_2']['wins']);
            //***********************************************************************************

        }
    };

    this.setTransformationType = function(coords){
        transformation_type = transform[coords];
    };
    this.transformToTransTable = function(coords) {
        var index = transform_methods[transformation_type]['real_table'].indexOf(coords);
        return transform_methods[transformation_type]['trans_table'][index];
    };
    this.transformToRealTable = function(coords) {
        var index = transform_methods[transformation_type]['trans_table'].indexOf(coords);
        return transform_methods[transformation_type]['real_table'][index];
    };



    this.playAsX = function(){

        //***********************************************************************************
        if (is_human) return;
        //***********************************************************************************

        switch (move_number){
            case 1:
                var y_play = (Math.floor(Math.random()*3)).toString();
                var x_play = (Math.floor(Math.random()*3)).toString();
                this.setTransformationType(y_play+x_play);
                first_field_bot = this.transformToTransTable(y_play+x_play);
                this.playMove(y_play+x_play);
                break;
            case 2:
                for(y=0; y<3; y++){
                    for(x=0; x<3; x++){
                        if (real_table[y][x] === "o"){
                            first_field_opp = this.transformToTransTable(y.toString()+x.toString());
                        }
                    }
                }
                switch (first_field_bot){
                    case "00":
                        switch (first_field_opp){
                            case "02":
                            case "01":
                            case "21":
                                this.playMove(this.transformToRealTable("20"));
                                break;
                            case "20":
                            case "10":
                            case "12":
                                this.playMove(this.transformToRealTable("02"));
                                break;
                            case "22":
                                var ar_1 = ["02", "20"];
                                this.playMove(this.transformToRealTable(ar_1[Math.floor(Math.random()*ar_1.length)]));
                                break;
                            case "11":
                                var ar_2 = ["01", "02", "10", "12", "20", "21", "22"];
                                this.playMove(this.transformToRealTable(ar_2[Math.floor(Math.random()*ar_2.length)]));
                                break;
                            default:
                                console.log("Something went very wrong.");
                        }
                        break;
                    case "01":
                        break;
                    case "11":
                        switch (first_field_opp){
                            case "01":
                            case "12":
                            case "21":
                            case "10":
                                var obj = {
                                    "01": ["22", "20"],
                                    "12": ["20", "00"],
                                    "21": ["00", "02"],
                                    "10": ["02", "22"]
                                };
                                this.playMove(this.transformToRealTable(obj[first_field_opp][Math.floor(Math.random()*2)]));
                        }
                        break;
                    default:
                        console.log("Something went very wrong.");
                }
                break;
            case 3:
            case 4:
            case 5:
                this.autoPlayMove();
                break;
            default:
                console.log("Something went very wrong.");
        }
    };




    this.playAsO = function(){

        //***********************************************************************************
        if (is_human) return;
        //***********************************************************************************

    };

    this.autoPlayMove = function(){
        console_log("FUCK YEAH!");
    };

    this.playMove = function(coords){
        var y = coords[0];
        var x = coords[1];
        ApiCalls.playMove(y, x);

        //***********************************************************************************
        displayTable(real_table);
        //***********************************************************************************

    };
}

BotStart.init = function(sess_init, is_human, ses_id){
    bot = new BotStart();
    bot.set_player_id(sess_init.player_id);
    bot.set_is_human(is_human);
    if(ses_id){
        bot.set_session_id(ses_id);

        //***********************************************************************************
        displayInitDataJoinSession(bot.get_session_id(), bot.get_player_id());
        //***********************************************************************************

    }
    else{
        bot.set_session_id(sess_init.session_id);

        //***********************************************************************************
        displayInitDataNewSession(bot.get_session_id(), bot.get_player_id());
        //***********************************************************************************

    }
    intervalWaitBothPlayers = setInterval(function(){
        ApiCalls.playersStatus();
    }, 50);
};