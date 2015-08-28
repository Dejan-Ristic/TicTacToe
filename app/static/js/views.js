$("#join_game").on("click", function() {
    var name = $("#new-session-player1-name").val();
    if (name === ""){
        alert("You must enter a name!");
        return;}
    $(".entered-data").hide();
    $(".data-to-display").show();
    $("#player1_name").text(name);
    $(".results").show();
    ApiCalls.joinGame(name);});

$("#join_session").on("click", function() {
    var ses_id = $("#join-session-id").val();
    if (ses_id === ""){
        alert("You must enter a session ID!");
        return;}
    var name = $("#join-session-player2-name").val();
    if (name === ""){
        alert("You must enter a name!");
        return;}
    $(".entered-data").hide();
    $(".data-to-display").show();
    $("#player2_name").text(name);
    $(".results").show();
    ApiCalls.joinSession(ses_id, name);});

//*****************************************************
function displayInitDataNewSession(ses_id, pl_id){
    $("#session_id").text(ses_id);
    $("#player1_id").text(pl_id);}

function displayInitDataJoinSession(ses_id, pl_id){
    $("#session_id").text(ses_id);
    $("#player2_id").text(pl_id);}

function displayBothPlayersData(pl1_id, pl1_name, pl2_id, pl2_name){
    $("#player1_id").text(pl1_id);
    $("#player1_name").text(pl1_name);
    $("#player2_id").text(pl2_id);
    $("#player2_name").text(pl2_name);}

function displayResults(games_number, wins_p1, draw, wins_p2){
    $("#games-number").text(games_number);
    $("#wins_p1").text(wins_p1);
    $("#draw").text(draw);
    $("#wins_p2").text(wins_p2);}