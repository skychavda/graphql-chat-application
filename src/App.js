import React, { Component } from "react";
import { Mutation, graphql, compose } from "react-apollo";
import gql from "graphql-tag";
import Cookies from 'universal-cookie';
import 'mr-emoji/css/emoji-mart.css'

import ShowUser from './components/show_user/showUser';

const cookies = new Cookies();

const JOIN_USER = gql`
  mutation JoinUser($newUser:String!){
    joinUser(name:$newUser){
      name
    }
  }
`;

const USER_JOIN_SUBSCRIPTION = gql`
    subscription {
        userJoined{
            name
            id
        }
    }
`;

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      user: '',
      display: 'hidden',
      error: 'none',
      triggerShowUser: false
    }
    this.removeUser = this.removeUser.bind(this);
  }

  componentDidMount(){
    var user = cookies.get('loginUser');
    console.log('Line ---- 33',cookies.get('loginUser'));
    if(user!==undefined){
      this.setState({ user: user, display: 'show', triggerShowUser: true });
    }
  }

  removeUser(){
    cookies.remove('loginUser');
    this.setState({ user: '', display: 'hidden', triggerShowUser: false });
  }

  async enterUser(e, joinUser) {
    if (e.key === 'Enter') {
      if (e.target.value === "") {
        this.setState({ error: 'error' });
      } else {
        joinUser({ variables: { newUser: e.target.value } });
        this.setState({ error: 'none' });
        this.setState({ user: e.target.value, display: 'show', triggerShowUser: true });
        cookies.set('loginUser', e.target.value);
        console.log('Line ---- 39',cookies.get('loginUser'));
        e.preventDefault();
      }
    }
  }

  render() {
    const user = this.state.user;
    return (
      <div className="main-div-chat">
        <div className={"enter-user " + (this.state.display === "hidden" ? "" : "hidden")}>
          <h3 style={{ margin: "20px 0 0 20px", textAlign: "center" }}>{"Welcome to chat application"}</h3>
          <div className="add-user">
            <p className="title">Enter name</p>
            <Mutation mutation={JOIN_USER}>
              {joinUser => (
                <input type="text"  placeholder="Enter name" onKeyPress={(e) => this.enterUser(e, joinUser)} className={"user-enter-text " + (this.state.error === "none" ? "" : "input-error")} />
              )}
            </Mutation>
          </div>
        </div>
        {this.state.triggerShowUser && <ShowUser user={user} hidden={this.state.display} onRemoveUser={this.removeUser}/>}
      </div >
    );
  }
}

export default compose(graphql(JOIN_USER, { name: 'joinUser' }))(App);
