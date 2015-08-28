function ApiCalls() {
}
ApiCalls.joinGame = function(pl_1_name){
    $.ajax({
        url: 'join-game-mode/P/'+pl_1_name,
        type: "GET",
        dataType: 'json',
        contentType: 'application/json',
        success: joinGameSuccess,
        error: joinGameError});
    function joinGameSuccess(response) {
        BotStart.init(response);}
    function joinGameError(response) {
        console.log("Error: "+response);}};

ApiCalls.joinSession = function(ses_id, pl_2_name){
    $.ajax({
    url: 'join-session/'+ses_id+'/'+pl_2_name,
    type: "GET",
    dataType: 'json',
    contentType: 'application/json',
    success: joinSessionSuccess,
    error: joinSessionError});
    function joinSessionSuccess(response) {
        BotStart.init(response, ses_id);}
    function joinSessionError(response) {
        console.log("Error: "+response);}};

ApiCalls.sessionStatus = function(){
    $.ajax({
        url: 'get-session-state/'+bot.get_session_id(),
        type: "GET",
        dataType: 'json',
        contentType: 'application/json',
        success: sessionStatusSuccess,
        error: sessionStatusError});
    function sessionStatusSuccess(response) {
        bot.checkMove(response);}
    function sessionStatusError(response) {
        console.log("Error: "+response);}};

ApiCalls.playersStatus = function(){
    $.ajax({
        url: 'get-session-state/'+bot.get_session_id(),
        type: "GET",
        dataType: 'json',
        contentType: 'application/json',
        success: playersStatusSuccess,
        error: playersStatusError});
    function playersStatusSuccess(response) {
        bot.waitBothPlayers(response);}
    function playersStatusError(response) {
        console.log("Error: "+response);}};

ApiCalls.playMove = function(y, x){
    $.ajax({
        url: 'play-move/'+bot.get_session_id()+'/'+bot.get_player_id()+'/'+y+'/'+x,
        type: "GET",
        dataType: 'json',
        contentType: 'application/json',
        success: playMoveSuccess,
        error: playMoveError});
    function playMoveSuccess() {
        bot.pingSession();}
    function playMoveError(response) {
        console.log("Error: "+response);}};


function BotStart(){

    var session_id;
    var player_id;
    var my_player;
    var my_symbol;
    var opp_symbol;
    var games_played = 0;
    var move_number = 0;
    var real_table = [];
    var transformation_type = null;
    var first_field_bot;
    var first_field_opp;
    var second_field_opp;

    var transform = {
        "00": "no_transform",
        "01": "no_transform",
        "02": "one_turn",
        "10": "three_turns",
        "11": "no_transform",
        "12": "one_turn",
        "20": "three_turns",
        "21": "two_turns",
        "22": "two_turns"};

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
            "trans_table": ["02", "12", "22", "01", "11", "21", "00", "10", "20"]}};

    this.setTransformationType = function(coords) {
        transformation_type = transform[coords];};
    this.transformToTransTable = function(coords) {
        var index = transform_methods[transformation_type]['real_table'].indexOf(coords);
        return transform_methods[transformation_type]['trans_table'][index];};
    this.transformToRealTable = function(coords) {
        var index = transform_methods[transformation_type]['trans_table'].indexOf(coords);
        return transform_methods[transformation_type]['real_table'][index];};

    var win_sets = [
        ["00", "01", "02"],
        ["10", "11", "12"],
        ["20", "21", "22"],
        ["00", "10", "20"],
        ["01", "11", "21"],
        ["02", "12", "22"],
        ["00", "11", "22"],
        ["02", "11", "20"]];

    this.set_session_id = function(ses_id){
        session_id = ses_id;
        return session_id;};
    this.get_session_id = function(){
        return session_id ? session_id : null;};
    this.set_player_id = function(pl_id){
        player_id = pl_id;
        return player_id;};
    this.get_player_id = function(){
        return player_id ? player_id : null;};

    this.pingSession = function(){
        intervalPingSession = setInterval(function(){
            ApiCalls.sessionStatus();}, 500);};

    this.waitBothPlayers = function(sess_obj){
        if(sess_obj['player_1'] !== null && sess_obj['player_2'] !== null){
            clearInterval(intervalWaitBothPlayers);
            my_player = (sess_obj['player_1']['id'] === player_id) ? 'player_1' : 'player_2';
            my_symbol = sess_obj[my_player]['symbol'];
            opp_symbol = (my_player === 'player_1') ? sess_obj['player_2']['symbol'] : sess_obj['player_1']['symbol'];
            this.pingSession();
            //***********************************************************************************
            displayBothPlayersData(sess_obj['player_1']['id'], sess_obj['player_1']['name'],
                                    sess_obj['player_2']['id'], sess_obj['player_2']['name']);
            //***********************************************************************************
        }
    };

    this.checkMove = function(sess_obj){
        if(!(sess_obj['games'].length > games_played)) {
            if (sess_obj['current_game']['next_symbol'] === my_symbol) {
                clearInterval(intervalPingSession);
                real_table = sess_obj['current_game']['fields'];
                move_number += 1;
                my_symbol === "x" ? this.playAsX() : this.playAsO();}}
        else {
            clearInterval(intervalPingSession);
            games_played = sess_obj['games'].length;
            my_symbol = sess_obj[my_player]['symbol'];
            opp_symbol = (my_player === 'player_1') ? sess_obj['player_2']['symbol'] : sess_obj['player_1']['symbol'];
            transformation_type = null;
            move_number = 0;
            this.pingSession();
            //***********************************************************************************
            displayResults(sess_obj['games'].length, sess_obj['player_1']['wins'], sess_obj['draw'],
                            sess_obj['player_2']['wins']);
            //***********************************************************************************
        }
    };

    this.playAsX = function(){
        switch (move_number){
            case 1:
                var y_play = (Math.floor(Math.random()*3)).toString();
                var x_play = (Math.floor(Math.random()*3)).toString();
                this.setTransformationType(y_play+x_play);
                first_field_bot = this.transformToTransTable(y_play+x_play);
                this.playMove(y_play+x_play);
                break;
            case 2:
                loop_1:
                for(y=0; y<3; y++){
                    for(x=0; x<3; x++){
                        if (real_table[y][x] === "o"){
                            first_field_opp = this.transformToTransTable(y.toString()+x.toString());
                            break loop_1;}}}
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
                                console.log("15 Something went very wrong.");}
                        break;
                    case "01":
                        switch (first_field_opp){
                            case "22":
                            case "12":
                                this.playMove(this.transformToRealTable("02"));
                                break;
                            case "20":
                            case "10":
                                this.playMove(this.transformToRealTable("00"));
                                break;
                            case "21":
                                var obj_3 = ["00", "02", "10", "11", "12", "20", "22"];
                                this.playMove(this.transformToRealTable(obj_3[Math.floor(Math.random()*obj_3.length)]));
                                break;
                            case "00":
                                var obj_14 = ["10", "11", "12", "20", "22"];
                                this.playMove(this.transformToRealTable(obj_14[Math.floor(Math.random()*obj_14.length)]));
                                break;
                            case "02":
                                var obj_15 = ["10", "11", "12", "20", "22"];
                                this.playMove(this.transformToRealTable(obj_15[Math.floor(Math.random()*obj_15.length)]));
                                break;
                            case "11":
                                var obj_4 = ["00", "02", "10", "11", "12", "20", "22"];
                                obj_4.splice((obj_4.indexOf(first_field_opp)), 1);
                                this.playMove(this.transformToRealTable(obj_4[Math.floor(Math.random()*obj_4.length)]));
                                break;
                            default:
                                console.log("16 Something went very wrong.");}
                        break;
                    case "11":
                        switch (first_field_opp){
                            case "01":
                            case "12":
                            case "21":
                            case "10":
                                var obj_1 = {
                                    "01": ["22", "20"],
                                    "12": ["20", "00"],
                                    "21": ["00", "02"],
                                    "10": ["02", "22"]};
                                this.playMove(this.transformToRealTable(obj_1[first_field_opp][Math.floor(Math.random()*obj_1[first_field_opp].length)]));
                                break;
                            case "00":
                            case "02":
                            case "20":
                            case "22":
                                var obj_2 = ["00", "01", "02", "10", "12", "20", "21", "22"];
                                obj_2.splice((obj_2.indexOf(first_field_opp)), 1);
                                this.playMove(this.transformToRealTable(obj_2[Math.floor(Math.random()*obj_2.length)]));
                                break;
                            default:
                                console.log("17 Something went very wrong.");}
                        break;
                    default:
                        console.log("18 Something went very wrong.");}
                break;
            case 3:
            case 4:
            case 5:
                this.autoPlayMove();
                break;
            default:
                console.log("19 Something went very wrong.");}};


    this.playAsO = function(){
        switch (move_number) {
            case 1:
                loop_3:
                for (y=0; y<3; y++) {
                    for (x=0; x<3; x++) {
                        if (real_table[y][x] === "x") {
                            this.setTransformationType(y.toString() + x.toString());
                            first_field_opp = this.transformToTransTable(y.toString() + x.toString());
                            break loop_3;}}}
                switch (first_field_opp){
                    case "00":
                        first_field_bot = "11";
                        this.playMove(this.transformToRealTable(first_field_bot));
                        break;
                    case "01":
                        var obj_6 = ["00", "02", "11", "21"];
                        first_field_bot = obj_6[Math.floor(Math.random()*obj_6.length)];
                        this.playMove(this.transformToRealTable(first_field_bot));
                        break;
                    case "11":
                        var obj_5 = ["00", "02", "20", "22"];
                        first_field_bot = obj_5[Math.floor(Math.random()*obj_5.length)];
                        this.playMove(this.transformToRealTable(first_field_bot));
                        break;
                    default:
                        console.log("1 Something went very wrong.");}
                break;
            case 2:
                loop_4:
                for (y=0; y<3; y++) {
                    for (x=0; x<3; x++) {
                        if (real_table[y][x] === "x" && this.transformToTransTable(y.toString() + x.toString()) !== first_field_opp) {
                            second_field_opp = this.transformToTransTable(y.toString() + x.toString());
                            break loop_4;}}}
                switch (first_field_opp) {
                    case "00":
                        if (second_field_opp === "22"){
                            var obj_7 = ["01", "10", "12", "21"];
                            this.playMove(this.transformToRealTable(obj_7[Math.floor(Math.random()*obj_7.length)]));}
                        else {
                            this.autoPlayMove();}
                        break;
                    case "01":
                        switch (first_field_bot){
                            case "00":
                                if (second_field_opp === "02"){
                                    this.playMove(this.transformToRealTable("20"));}
                                else {
                                    this.autoPlayMove();}
                                break;
                            case "02":
                                if (second_field_opp === "00"){
                                    this.playMove(this.transformToRealTable("22"));}
                                else {
                                    this.autoPlayMove();}
                                break;
                            case "11":
                            case "21":
                                if (second_field_opp === "21" || second_field_opp === "11"){
                                    var obj_8 = ["00", "02", "20", "22"];
                                    this.playMove(this.transformToRealTable(obj_8[Math.floor(Math.random()*obj_8.length)]));}
                                else {
                                    this.autoPlayMove();}
                                break;
                            default:
                                console.log("7 Something went very wrong.");}
                        break;
                    case "11":
                        switch (first_field_bot){
                            case "00":
                            case "22":
                                if (second_field_opp === "22" || second_field_opp === "00"){
                                    var obj_10 = ["02", "20"];
                                    this.playMove(this.transformToRealTable(obj_10[Math.floor(Math.random()*obj_10.length)]));}
                                else {
                                    this.autoPlayMove();}
                                break;
                            case "02":
                            case "20":
                                if (second_field_opp === "20" || second_field_opp === "02"){
                                    var obj_11 = ["00", "22"];
                                    this.playMove(this.transformToRealTable(obj_11[Math.floor(Math.random()*obj_11.length)]));}
                                else {
                                    this.autoPlayMove();}
                                break;
                            default:
                                console.log("12 Something went very wrong.");}
                        break;
                    default:
                        console.log("13 Something went very wrong.");}
                break;
            case 3:
            case 4:
                this.autoPlayMove();
                break;
            default:
                console.log("14 Something went very wrong.");}};


    this.autoPlayMove = function(){
        function goThroughSetsLinear(symbol) {
            var symbol_count = 0;
            var empty_count = 0;
            var empty_coords = null;
            loop_2:
            for (i=0; i<win_sets.length; i++) {
                for (j=0; j<win_sets[i].length; j++) {
                    switch (real_table[win_sets[i][j][0] ] [win_sets[i][j][1] ]){
                        case symbol:
                            symbol_count += 1;
                            break;
                        case "-":
                            empty_count += 1;
                            empty_coords = win_sets[i][j];
                            break;
                        default:
                            break;}
                    if(j === (win_sets[i].length - 1)){
                        if (symbol_count === 2 && empty_count ===1){
                            break loop_2;}
                        symbol_count = 0;
                        empty_count = 0;
                        empty_coords = null;}}}
            return empty_coords;}

        function goThroughSetsCombo(symbol){
            var symbol_count = 0;
            var empty_count = 0;
            var empty_coords_list = [];
            var empty_coords = null;
            for (i = 0; i < win_sets.length; i++) {
                for (j = 0; j < win_sets[i].length; j++) {
                    switch (real_table[win_sets[i][j][0] ] [win_sets[i][j][1] ]){
                        case symbol:
                            symbol_count += 1;
                            break;
                        case "-":
                            empty_count += 1;
                            empty_coords_list.push(win_sets[i][j]);
                            break;
                        default:
                            break;}
                    if(j === (win_sets[i].length - 1)) {
                        if (!(symbol_count === 1 && empty_count === 2)) {
                            for (count=0; count<empty_count; count++){
                                empty_coords_list.pop();}}
                        symbol_count = 0;
                        empty_count = 0;}}}
            if(empty_coords_list.length>0){
                for (count=0; count<empty_coords_list.length; count++){
                    for (inner_count=count+1; inner_count<empty_coords_list.length; inner_count++){
                        if (empty_coords_list[count] === empty_coords_list[inner_count]){
                            empty_coords = empty_coords_list[count];}}}}
            return empty_coords;}

        var my_finish_move = goThroughSetsLinear(my_symbol);
        var opp_finish_move = goThroughSetsLinear(opp_symbol);
        var my_combo_move = goThroughSetsCombo(my_symbol);
        var opp_combo_move = goThroughSetsCombo(opp_symbol);
        var random_fields = [];

        if (my_finish_move){
            this.playMove(my_finish_move);}
        else if (opp_finish_move){
            this.playMove(opp_finish_move);}
        else if (my_combo_move){
            this.playMove(my_combo_move);}
        else if (opp_combo_move){
            this.playMove(opp_combo_move);}
        else {
            for (y=0; y<3; y++) {
                for (x=0; x<3; x++) {
                    if (real_table[y][x] === "-"){
                        random_fields.push(y.toString() + x.toString());}}}
            this.playMove(random_fields[Math.floor(Math.random()*random_fields.length)]);}};

    this.playMove = function(coords){
        var y = coords[0];
        var x = coords[1];
        ApiCalls.playMove(y, x);};}

BotStart.init = function(sess_init, ses_id){
    bot = new BotStart();
    bot.set_player_id(sess_init.player_id);
    if (ses_id){
        bot.set_session_id(ses_id);
        //***********************************************************************************
        displayInitDataJoinSession(bot.get_session_id(), bot.get_player_id());
        //***********************************************************************************
    }
    else {
        bot.set_session_id(sess_init.session_id);
        //***********************************************************************************
        displayInitDataNewSession(bot.get_session_id(), bot.get_player_id());
        //***********************************************************************************
    }
    intervalWaitBothPlayers = setInterval(function(){
        ApiCalls.playersStatus();}, 500);};