import React, { Component } from "react";
import { Mutation } from "react-apollo";
import gql from "graphql-tag";

import ShowUser from './showUser';

const JOIN_USER = gql`
  mutation JoinUser($newUser:String!){
    joinUser(name:$newUser){
      name
    }
  }
`;

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      user: '',
      display: 'hidden',
      error: 'none'
    }
  }

  async enterUser(e,joinUser) {
    if (e.key === 'Enter') {
      if (e.target.value === "") {
        this.setState({ error: 'error' });
      } else {
        joinUser({ variables: { newUser: e.target.value } });
        this.setState({ error: 'none' });
        this.setState({ user: e.target.value, display: 'show' });
        e.preventDefault();
      }
    }
  }

  render() {
    const user = this.state.user;
    return (
      <div className="main-div-chat">
        <div className={"enter-user " + (this.state.display === "hidden" ? "" : "hidden")}>
          <h3 style={{ margin: "20px 0 0 20px", textAlign: "center" }}>{"Welcome " + (user === "" ? "to chat application" : user)}</h3>
          <div className="add-user">
            <p className="title">Enter name</p>
            <Mutation mutation={JOIN_USER}>
              {joinUser => (
                <input type="text" placeholder="Enter name" onKeyPress={(e) => this.enterUser(e,joinUser)} className={"user-enter-text " + (this.state.error === "none" ? "" : "input-error")} />
              )}
            </Mutation>
          </div>
        </div>
        <ShowUser user={user} hidden={this.state.display} />
      </div >
    );
  }
}

export default App;



// e => {
//   if (e.key === 'Enter') {
//     if (e.target.value === "") {
//       this.setState({ error: 'error' });
//     } else {
//       e.preventDefault();
//       joinUser({ variables: { newUser: e.target.value } });
//       this.setState({ error: 'none', user: e.target.value, display: 'show' });
//     }
//   }
// }
