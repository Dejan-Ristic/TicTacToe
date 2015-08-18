"""
Tic tac toe game server
"""
from flask import Flask, Response
from datetime import datetime
import hashlib
import os
import json
from flask import render_template
basedir = os.path.abspath(os.path.dirname(__file__))

app = Flask(__name__)
app.debug = True
app.config['count'] = 1


# MODEL
class Player:
    """
    Class representing player
    :param name: name of player
    :param symbol: player symbol
    :param pid: id of player - can be None, so machine will create new one
    :param wins: number of player wins in current game session
    """

    def __init__(self, name, symbol, pid=None, wins=0):
        self.name = name
        if not pid:
            self.id = self.id = hashlib.sha512("player-{}".format(datetime.utcnow()).encode()).hexdigest()[0:8]
        else:
            self.id = pid
        self.symbol = symbol
        self.wins = wins

    def __repr__(self):
        return json.dumps(self.__dict__)

    @classmethod
    def from_json(cls, jsn):
        """
        Method used to create object of type Player from json dict
        :param jsn - json dict
        """
        if jsn == 'bot':
            return 'bot'
        if jsn:
            return cls(jsn['name'], jsn['symbol'], jsn['id'], jsn['wins'])
        return None


class Game:
    """
    Class representing game
    :param fields: 3x3 matrix representing board
    :param next_symbol: next symbol to be played
    :param player_1: first player
    :param player_2: second player
    """

    def __init__(self, fields=None, next_symbol=None, player_1=None, player_2=None):
        if not fields:
            self.fields = [['-', '-', '-'],
                           ['-', '-', '-'],
                           ['-', '-', '-']]
        else:
            self.fields = fields
        if not next_symbol:
            self.next_symbol = 'x'
        else:
            self.next_symbol = next_symbol
        self.winner = '-'
        self.player_1 = player_1
        self.player_2 = player_2

    def to_json_object(self):
        """
        Used to transform game to json
        :return: json representation of game
        """
        self.player_1 = json.loads(self.player_1.__repr__().replace('\'', '\"'))
        if self.player_2 and self.player_2 != "bot":
            self.player_2 = json.loads(self.player_2.__repr__().replace('\'', '\"'))
        if self.winner not in ['-', 'bot']:
            self.winner = json.loads(self.winner.__repr__().replace('\'', '\"'))
        return json.dumps(self.__dict__)

    @classmethod
    def from_json(cls, jsn_rep):
        """
        Creates game object from json
        :param jsn_rep: json dict
        :return: game object
        """
        game = cls()
        game.fields = jsn_rep['fields']
        game.next_symbol = jsn_rep['next_symbol']
        game.player_1 = Player.from_json(jsn_rep['player_1'])
        game.player_2 = Player.from_json(jsn_rep['player_2'])
        return game

    def play_move(self, x, y, symbol):
        """
        Used to play move for symbol sent
        :param x: column
        :param y: row
        :param symbol: symbol to be played
        :return: either game object or error message
        """
        if self.fields[y][x] == '-':
            if self.next_symbol == symbol:
                self.fields[y][x] = symbol
                if self.next_symbol == 'x':
                    self.next_symbol = 'o'
                else:
                    self.next_symbol = 'x'
                return self
            else:
                return "ERR_NOT_YOUR_TURN"
        else:
            return "ERR_FIELD_TAKEN"

    def check_win(self, symbol):
        """
        checks if symbol has won the game
        :param symbol: symbol to be checked
        :return: True if game is ended, False if there are more moves
        """
        if (self.fields[0][0] == symbol and self.fields[1][1] == symbol and self.fields[2][2] == symbol) or \
            (self.fields[0][0] == symbol and self.fields[0][1] == symbol and self.fields[0][2] == symbol) or \
            (self.fields[1][0] == symbol and self.fields[1][1] == symbol and self.fields[1][2] == symbol) or \
            (self.fields[2][0] == symbol and self.fields[2][1] == symbol and self.fields[2][2] == symbol) or \
            (self.fields[0][0] == symbol and self.fields[1][0] == symbol and self.fields[2][0] == symbol) or \
            (self.fields[0][1] == symbol and self.fields[1][1] == symbol and self.fields[2][1] == symbol) or \
            (self.fields[0][2] == symbol and self.fields[1][2] == symbol and self.fields[2][2] == symbol) or \
                (self.fields[0][2] == symbol and self.fields[1][1] == symbol and self.fields[2][0] == symbol):
            if symbol == self.player_1.symbol:
                self.winner = self.player_1
                self.player_1.wins += 1
            elif self.player_2 and self.player_2 != "bot" and symbol == self.player_2.symbol:
                self.winner = self.player_2
                self.player_2.wins += 1
            else:
                self.winner = "bot"
            return True
        return False

    def check_draw(self):
        """
        checks if game is draw
        :return: True if draw, False otherwise
        """
        for k in range(len(self.fields)):
            for i in range(len(self.fields[k])):
                if self.fields[k][i] == '-':
                    return False
        return True

    def bot_play(self):
        """
        AI when playing against bot - for now it is really stupid - just playing random free move
        """
        empty_fields = []
        for k in range(len(self.fields)):
            for i in range(len(self.fields[k])):
                if self.fields[k][i] == '-':
                    empty_fields.append([k, i])
        if len(empty_fields) == 0:
            return
        import random
        selected = empty_fields[random.randint(0, len(empty_fields)-1)]
        self.fields[selected[0]][selected[1]] = 'o' if self.player_1.symbol == 'x' else 'x'
        self.next_symbol = 'x' if self.player_1.symbol == 'x' else 'o'

    def __repr__(self):
        return self.to_json_object()


class GameSession:
    """
    Class representing current game session
    :param player_1: first player
    :param player_2: second player
    :param play_against_machine: true if playing against bot
    :param sid: session id
    :param games: list of previous games
    :param current_game: game currently being played
    :param draw: number of draws
    """

    def __init__(self, player_1, player_2=None, play_against_machine=True, sid=None,
                 games=None, current_game=None, draw=0):
        self.play_against_machine = play_against_machine
        self.player_1 = player_1
        if not player_2:
            self.player_2 = "bot" if play_against_machine else None
        else:
            self.player_2 = player_2
        if not sid:
            self.id = hashlib.sha512("session-{}".format(datetime.utcnow()).encode()).hexdigest()[0:8]
        else:
            self.id = sid
        if not games:
            self.games = []
        else:
            self.games = games
        if not current_game:
            self.current_game = Game(player_1=self.player_1, player_2=self.player_2)
        else:
            self.current_game = current_game
        self.draw = draw

    @classmethod
    def start_new_session(cls, player, play_against_machine=True):
        """
        called to start new session
        :param player: player who is starting session and becoming first player in current session
        :param play_against_machine: True if playing against machine
        :return: game session object that is created
        """
        sess = cls(player, None, play_against_machine)
        f = open(os.path.join(basedir, "games/g_sess_{}.json".format(sess.id)), 'w')
        f.write(sess.to_json_object())
        f.close()
        return sess

    @classmethod
    def get_by_id(cls, sess_id):
        """
        Returns session from id if there is session with that id
        :param sess_id: session id to be checked
        :return: game session object
        """
        try:
            f = open(os.path.join(basedir, "games/g_sess_{}.json".format(sess_id)))
            return cls.read_from_file(f.read())
        except Exception as e:
            print(e)
            import traceback
            traceback.print_exc()
            return None

    def join_session(self, player):
        """
        used when second player want to join session
        :param player: second player
        """
        self.player_2 = player
        self.current_game.player_2 = player
        self.save()

    def get_current_game(self):
        """
        returns currently active game

        :return: current game
        """
        return self.current_game

    def to_json_object(self):
        """
        transforms game session to json

        :return: returns json of game session
        """
        self.current_game = json.loads(self.current_game.__repr__().replace('\'', "\""))
        self.player_1 = json.loads(self.player_1.__repr__().replace('\'', "\""))
        if self.player_2 and type(self.player_2) != str:
            self.player_2 = json.loads(self.player_2.__repr__().replace('\'', "\""))
        for i in range(len(self.games)):
            self.games[i] = json.loads(self.games[i].__repr__().replace('\'', '\"'))
        return json.dumps(self.__dict__)

    @classmethod
    def read_from_file(cls, data):
        """
        loading game session from file
        :param data: data red from file
        :return: game session object
        """
        jsn_rep = json.loads(data)
        current_game = Game.from_json(jsn_rep['current_game'])
        return cls(player_1=Player.from_json(jsn_rep['player_1']),
                   player_2=Player.from_json(jsn_rep['player_2']),
                   play_against_machine=jsn_rep['play_against_machine'],
                   sid=jsn_rep['id'], games=jsn_rep['games'], current_game=current_game, draw=jsn_rep['draw'])

    def __repr__(self):
        return self.to_json_object()

    def save(self):
        """
        save game session state into file
        """
        f = open(os.path.join(basedir, "games/g_sess_{}.json".format(self.id)), 'w')
        f.write(self.to_json_object())
        f.close()

    def next_game(self):
        """
        starts next game and do necessary switch of symbols. Also increasing number of draw games if game was draw
        """
        self.games.append(self.current_game)
        self.player_1 = self.current_game.player_1
        self.player_2 = self.current_game.player_2
        if self.player_1.symbol == 'x':
            self.player_1.symbol = 'o'
            if self.player_2 != 'bot':
                self.player_2.symbol = 'x'
        else:
            self.player_1.symbol = 'x'
            if self.player_2 != 'bot':
                self.player_2.symbol = 'o'
        if self.current_game.winner == '-':
            self.draw += 1
        self.current_game = Game(player_1=self.player_1, player_2=self.player_2)
        if self.play_against_machine and self.player_1.symbol == 'o':
            self.current_game.bot_play()
        self.save()

    def check_player(self, player_id):
        """
        Checks if player with provided id is in this game session
        :param player_id: id to be checked
        :return: player if found, None otherwise
        """
        if self.player_1.id == player_id:
            return self.player_1
        if type(self.player_2) != str and self.player_2.id == player_id:
            return self.player_2
        return None

# END OF MODEL


# HELPER METHODS
def _get_game_session(session_id):
    if not session_id:
        return Response(response=json.dumps({"error": "invalid session_id"}), status=400, mimetype="application/json")
    game_session = GameSession.get_by_id(session_id)
    if not game_session:
        return Response(response=json.dumps({"error": "invalid session_id"}), status=400, mimetype="application/json")
    return game_session
# END OF HELPER METHODS


@app.route('/')
def index():
    return render_template('index.html')

@app.route('/join-game-mode/<mode>')
@app.route('/join-game-mode/<mode>/<name>')
def join_game(mode="M", name=None):
    """
    Api call that creates new gaming session. Try to use as less sessions as possible. Session will be stored in games
    folder as json file
    :param mode: either M for Machine or P for player
    :param name: name of the player - strongly suggested to be sent
    :return: json with session_id and player_id - save those id-s as they are needed for almost all other calls
    """
    if mode not in ["M", "P"]:
        return Response(response=json.dumps({"error": "invalid mode, choose M to play against Machine "
                                                      "or P to play against Player"}),
                        status=400, mimetype="application/json")
    if not name:
        name = "player-{}".format(app.config['count'])
        app.config['count'] += 1
    player = Player(name, 'x')
    resp = {"session_id": "{}".format(GameSession.start_new_session(player, mode == 'M').id), "player_id": player.id}
    return Response(response=json.dumps(resp),
                    status=200, mimetype="application/json")


@app.route('/join-session/<session_id>')
@app.route('/join-session/<session_id>/<name>')
def join_session(session_id=None, name=None):
    """
    This call is used when you're playing against other player, and it will be used in competition for player that will
    join second. Make sure that you include shortcut in your bot so you can send this call
    :param session_id: session id that exist in a system, ususaly one returned from join-game-mode call
    :param name: name of the player - strongly suggested to be sent
    :return: json with player_id - save that id as it is needed in other calls
    """
    game_session = _get_game_session(session_id)
    if type(game_session) == Response:
        return game_session
    if not name:
        name = "player-{}".format(app.config['count'])
        app.config['count'] += 1
    player = Player(name, 'o')
    if game_session.player_2:
        return Response(response=json.dumps({"error": "game_full"}),
                        status=400, mimetype="application/json")
    game_session.join_session(player)
    resp = {"player_id": player.id}
    return Response(response=json.dumps(resp),
                    status=200, mimetype="application/json")


@app.route('/get-state/<session_id>')
def get_state(session_id=None):
    """
    returns the state of current game
    :param session_id: session_id of desired session
    :return: json representation of state of current game in desired session
    """
    game_session = _get_game_session(session_id)
    if type(game_session) == Response:
        return game_session
    game = game_session.get_current_game()
    return Response(response=game.to_json_object(), status=200, mimetype="application/json")


@app.route('/play-move/<session_id>/<player_id>/<y>/<x>')
def play_move(session_id=None, player_id=None, y=None, x=None):
    """
    call used to play move
    :param session_id: session
    :param player_id: id of player that need to play move
    :param y: row
    :param x: column
    :return: either state of board, or info message if game is done, or error message if something is wrong
    """
    if not x or not y:
        return Response(response=json.dumps({"error": "you need to send X and Y"}),
                        status=400, mimetype="application/json")
    if int(x) > 2 or int(y) > 2:
        return Response(response=json.dumps({"error": "you need to send X<=2 and Y<=2"}),
                        status=400, mimetype="application/json")
    game_session = _get_game_session(session_id)
    if type(game_session) == Response:
        return game_session
    player = game_session.check_player(player_id)
    if type(player) == str:
        return Response(response=json.dumps({"error": "invalid player id for session: {}".format(session_id)}),
                        status=400, mimetype="application/json")
    game = game_session.get_current_game()
    game = game.play_move(int(x), int(y), player.symbol)
    if type(game) == str:
        return Response(response=json.dumps({"error": game}), status=400, mimetype="application/json")
    player_win = game.check_win(player.symbol)
    bot_win = False
    if not player_win and game_session.play_against_machine:
        game.bot_play()
        bot_win = game.check_win('o' if player.symbol == 'x' else 'x')
    game_session.current_game = game
    if not player_win and not bot_win:
        draw = game.check_draw()
        if not draw:
            game_session.save()
            return Response(response=game.to_json_object(), status=200, mimetype="application/json")
        else:
            game_session.next_game()
            game_session.save()
            return Response(response=json.dumps({"message": "game draw"}), status=200, mimetype="application/json")
    if player_win:
        game_session.next_game()
        game_session.save()
        return Response(response=json.dumps({"message": "you win"}), status=200, mimetype="application/json")
    if bot_win:
        game_session.next_game()
        game_session.save()
        return Response(response=json.dumps({"message": "you lost"}), status=200, mimetype="application/json")


@app.route('/get-session-state/<session_id>')
def get_session_state(session_id=None):
    """
    returns complete session state
    :param session_id: session_id of desired session
    :return: json containing data about whole session
    """
    game_session = _get_game_session(session_id)
    if type(game_session) == Response:
        return game_session
    return Response(response=game_session.to_json_object(), status=200, mimetype="application/json")


if __name__ == '__main__':
    app.run(port=9999, host="127.0.0.1")
