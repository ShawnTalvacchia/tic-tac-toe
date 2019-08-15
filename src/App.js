import React from "react";
import ReactDOM from "react-dom";
import "./App.css";

import { Container,Navbar, Nav, Form, FormControl, Button } from "react-bootstrap";
import FacebookLogin from "react-facebook-login";


const Square = ({ onClick, value }) => (
  <button className="square" onClick={onClick}>
    {value}
  </button>
);

class Board extends React.Component {
  renderSquare(i) {
    return (
      <Square
        value={this.props.squares[i]}
        onClick={() => this.props.onClick(i)}
      />
    );
  }

  render() {
    return (
      <div>
        <div className="board-row">
          {this.renderSquare(0)}
          {this.renderSquare(1)}
          {this.renderSquare(2)}
        </div>
        <div className="board-row">
          {this.renderSquare(3)}
          {this.renderSquare(4)}
          {this.renderSquare(5)}
        </div>
        <div className="board-row">
          {this.renderSquare(6)}
          {this.renderSquare(7)}
          {this.renderSquare(8)}
        </div>
      </div>
    );
  }
}

class Game extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      history: [
        {
          squares: Array(9).fill(null)
        }
      ],
      stepNumber: 0,
      xIsNext: true,
      currentUser: null,
      highScores: [],
      gameOver: false
    };
  }

  

  calculateWinner(squares) {
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6]
    ];
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      const someoneWon =
        squares[a] && squares[a] === squares[b] && squares[a] === squares[c];
      if (someoneWon) {
        if (!this.state.gameOver) {
          this.pushHighScore();

          return squares[a];
        }
      }
    }
    return null;
  }

  pushHighScore = async () => {
    let data = new URLSearchParams();
    data.append("player", this.state.currentUser.name);
    data.append("score", "-1559744895");
    const url = `http://ftw-highscores.herokuapp.com/tictactoe-dev`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: data.toString(),
      json: true
    });
    this.setState({ gameOver: true });

    if (response.status == 200) {
      this.getHighScores();
    }
  };

  getHighScores = async () => {
    try {
      const response = await fetch(
        "http://ftw-highscores.herokuapp.com/tictactoe-dev?reverse=true"
      );
      let jsonData = await response.json();
      this.setState({ highScores: jsonData.items });
    } catch (error) {
      console.log("error");
    }
  };

  componentDidMount() {
    const currentUser = localStorage.getItem("FbLogin");
    if (currentUser !== null) {
      this.setState({ currentUser: JSON.parse(currentUser) });
    }
    this.getHighScores();
  }

  responseFacebook = response => {
    try {
      if (response && response.status !== "unknown") {
        localStorage.setItem("FbLogin", JSON.stringify(response));
        this.setState({ currentUser: response });
      }
    } catch (error) {
      console.log("error");
    }
  };

  onSignout = () => {
    localStorage.removeItem("FbLogin");
    this.setState({ currentUser: null });
  };

  handleClick(i) {
    const history = this.state.history.slice(0, this.state.stepNumber + 1);
    const current = history[history.length - 1];
    const squares = current.squares.slice();
    if (this.calculateWinner(squares) || squares[i]) {
      return;
    }
    squares[i] = this.state.xIsNext ? <div className="yellow">X</div> : <div className="blue">O</div>;
    this.setState({
      history: history.concat([
        {
          squares: squares
        }
      ]),
      stepNumber: history.length,
      xIsNext: !this.state.xIsNext
    });
  }

  jumpTo(step) {
    this.setState({
      stepNumber: step,
      xIsNext: step % 2 === 0
    });
  }

  renderGameContent() {
    if (this.state.currentUser === null) return <div />;

    return (
      <div className="game-content">
        <h6 className="current-user">{this.state.currentUser.name}</h6>
        
        <Button variant="primary" 
          onClick={this.onSignout}
          size="sm"
          className="login-button">Signout</Button>
      </div>
    );
  }

  render() {
    const history = this.state.history;
    const current = history[this.state.stepNumber];
    const winner = this.calculateWinner(current.squares);

    const moves = history.map((step, move) => {
      const desc = move ? "Go to move #" + move : "Go to game start";
      return (
        <li 
          className="history-buttons"
          key={move}>
          <Button 
            block 
            size="sm" 
            variant="outline-primary"
            onClick={() => this.jumpTo(move)}>{desc}</Button>
        </li>
      );
    });

    let status;
    if (winner) {
      status = "Winner: " + winner;
    } else {
      status = "Next player: " + (this.state.xIsNext ? "X" : "O");
    }

    return (
      <div className="page-container">
        <Navbar bg="warning" variant="outline-warning" className="nav-bar">
          
          <Navbar.Brand href="#home">TIC TAC TOE</Navbar.Brand>
          <Nav>
            <h6 className="status">{status}</h6>

          </Nav>
          <Nav>
            {this.state.currentUser === null && (
              <FacebookLogin
                appId="436742783590164"
                fields="name,email,picture"
                callback={resp => this.responseFacebook(resp)}
              />
            )}
            {this.renderGameContent()}
          
        </Nav>

        </Navbar>

        <Container style={{marginTop:"3rem"}}>
          
          <div className="game">
            {this.state.currentUser !== null && (
            <>
            <div className="game-info">
              <ol>{moves}</ol>
            </div>
            <div className="game-board">
              <Board
                squares={current.squares}
                onClick={i => this.handleClick(i)}
              />
            </div>
            </>
            )}
            <div>
              <h3 className="scores">High Scores</h3>
              <ol>
                {this.state.highScores.map(score => {
                  return (
                    <li className="scores">
                      {score.player}: {score.score}
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>
        </Container>
    </div>
    );
  }
}

export default Game;
