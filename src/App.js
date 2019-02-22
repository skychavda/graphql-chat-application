import React, { Component } from "react";
import { Mutation, graphql, compose, Query } from "react-apollo";
import gql from "graphql-tag";
import Cookies from 'universal-cookie';
import 'mr-emoji/css/emoji-mart.css'

import ShowUser from './components/show_user/showUser';
import Login from './components/login/login';

const cookies = new Cookies();

const NEW_USER = gql`
  mutation newUser($userName:String!,$firstName:String!,$lastName:String!,$email:String!,$contact:String,$bio:String){
    newUser(input:{
      userName:$userName,
      firstName:$firstName,
      lastName:$lastName,
      email:$email,
      contact:$contact,
      bio:$bio
    }){
      id
      userName
      firstName
      lastName
      email
      contact
      bio
      profilePicture
    }
  }
`;

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
      displayLogin: 'hidden',
      displaySignup: 'hidden',
      displayShowUser: 'hidden',
      error: 'none',
      triggerShowUser: false,
      userName: '',
      firstName: '',
      lastName: '',
      email: '',
      number: '',
      bio: ''
    }
    this.removeUser = this.removeUser.bind(this);
    this.handleUserName = this.handleUserName.bind(this);
    this.handleFirstName = this.handleFirstName.bind(this);
    this.handleLastName = this.handleLastName.bind(this);
    this.handleEmail = this.handleEmail.bind(this);
    this.handleContact = this.handleContact.bind(this);
    this.handleBio = this.handleBio.bind(this);
    this.handleNotAMember = this.handleNotAMember.bind(this);
  }

  componentDidMount() {
    var user = cookies.get('loginUser');
    console.log('Line ---- 33', cookies.get('loginUser'));
    if (user !== undefined) {
      this.setState({ user: user, displayShowUser: 'show', triggerShowUser: true, displayLogin:'show' });
    }
  }

  removeUser() {
    cookies.remove('loginUser');
    this.setState({ user: '', displayShowUser: 'hidden', triggerShowUser: false, displayLogin: 'hidden' });
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
        console.log('Line ---- 39', cookies.get('loginUser'));
        e.preventDefault();
      }
    }
  }

  async newUser(e, newUser) {
    const userName = this.state.userName;
    const firstName = this.state.firstName;
    const lastName = this.state.lastName;
    const number = this.state.number;
    const email = this.state.email;
    const bio = this.state.bio;

    newUser({ variables: { userName: userName, firstName: firstName, lastName: lastName, email: email, contact: number, bio: bio } });
    this.setState({ user: userName, displaySignup: 'hidden', triggerShowUser: true, displayShowUser: 'show' });
    e.preventDefault();
  }

  async login(e) {
    const userName = this.state.userName;
    cookies.set('loginUser', userName);
    this.setState({ user: userName, displayLogin: 'show', triggerShowUser: true, displayShowUser: 'show' });
    console.log('Line ---- 123',cookies.get('loginUser'));
    e.preventDefault();
  }

  handleUserName(e) {
    this.setState({ userName: e.target.value });
  }

  handleFirstName(e) {
    this.setState({ firstName: e.target.value });
  }

  handleLastName(e) {
    this.setState({ lastName: e.target.value });
  }

  handleEmail(e) {
    this.setState({ email: e.target.value });
  }

  handleContact(e) {
    this.setState({ number: e.target.value });
  }

  handleBio(e) {
    this.setState({ bio: e.target.value });
  }

  handleNotAMember() {
    this.setState({ displayLogin: 'show', displaySignup: 'show' });
  }

  render() {
    const user = this.state.user;
    console.log('Line ---- 76', this.state.userName);
    return (
      <div className="main-div-chat">
        <div className={"container-login100 "}>
          <div className={"wrap-login100 p-l-55 p-r-55 p-t-65 p-b-54 " + (this.state.displaySignup === "show" ? "" : "hidden")}>
            <div className="login100-form validate-form">
              <span className="login100-form-title p-b-49">
                Welcome to chat application
              </span>

              <div className="wrap-input100 validate-input m-b-23">
                <input className="input100" type="text" placeholder="Type your username" onChange={(e) => this.handleUserName(e)} />
                <span className="focus-input100"></span>
              </div>

              <div className="wrap-input100 validate-input m-b-23">
                <input className="input100" type="text" placeholder="Type your firstname" onChange={(e) => this.handleFirstName(e)} />
                <span className="focus-input100"></span>
              </div>

              <div className="wrap-input100 validate-input m-b-23">
                <input className="input100" type="text" placeholder="Type your lastname" onChange={(e) => this.handleLastName(e)} />
                <span className="focus-input100"></span>
              </div>

              <div className="wrap-input100 validate-input m-b-23">
                <input className="input100" type="text" placeholder="Type your email" onChange={(e) => this.handleEmail(e)} />
                <span className="focus-input100"></span>
              </div>

              <div className="wrap-input100 validate-input m-b-23">
                <input className="input100" type="text" placeholder="Type your contact" onChange={(e) => this.handleContact(e)} />
                <span className="focus-input100"></span>
              </div>

              <div className="wrap-input100 validate-input m-b-23">
                <input className="input100" type="text" placeholder="Type your bio" onChange={(e) => this.handleBio(e)} />
                <span className="focus-input100"></span>
              </div>

              <div className="container-login100-form-btn">
                <div className="wrap-login100-form-btn">
                  <div className="login100-form-bgbtn"></div>
                  <Mutation mutation={NEW_USER}>
                    {newUser => (
                      // <input type="text" placeholder="Enter name" onKeyPress={(e) => this.enterUser(e, joinUser)} className={"user-enter-text " + (this.state.error === "none" ? "" : "input-error")} />
                      <button className="login100-form-btn" onClick={(e) => this.newUser(e, newUser)}>
                        Join Chat
							        </button>
                    )}
                  </Mutation>
                </div>
              </div>

              {/* <h6 onClick={this.alreadyMember}>Login</h6> */}
            </div>
          </div>
          {/* <div className="add-user">
            <p className="title">Enter name</p>
            <Mutation mutation={JOIN_USER}>
              {joinUser => (
                <input type="text" placeholder="Enter name" onKeyPress={(e) => this.enterUser(e, joinUser)} className={"user-enter-text " + (this.state.error === "none" ? "" : "input-error")} />
              )}
            </Mutation>
          </div> */}
          <div className={"wrap-login100 p-l-55 p-r-55 p-t-65 p-b-54 " + (this.state.displayLogin === "hidden" ? "" : "hidden")}>
            <div className="login100-form validate-form">
              <span className="login100-form-title p-b-49">
                Login
                </span>

              <div className="wrap-input100 validate-input m-b-23">
                <input className="input100" type="text" placeholder="Type your username" onChange={(e) => this.handleUserName(e)} />
                <span className="focus-input100"></span>
              </div>

              <div className="container-login100-form-btn">
                <div className="wrap-login100-form-btn">
                  <div className="login100-form-bgbtn"></div>
                  <button className="login100-form-btn" onClick={(e) => this.login(e)}>
                    Login
							          </button>
                </div>
              </div>
              <h6 onClick={this.handleNotAMember}>Not a member?</h6>
            </div>
          </div>
          {this.state.triggerShowUser && <ShowUser user={user} hidden={this.state.displayShowUser} onRemoveUser={this.removeUser} />}
          {/* className={(this.state.display === "show" ? "" : "hidden")} */}
          {/* {this.state.display === 'show' && <Login/>} */}
        </div >
      </div>
    );
  }
}

export default compose(graphql(JOIN_USER, { name: 'joinUser' }))(App);
