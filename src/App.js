import React, { Component } from "react";
import { Mutation, graphql, compose } from "react-apollo";
import gql from "graphql-tag";
import Cookies from 'universal-cookie';
import 'mr-emoji/css/emoji-mart.css'

import ShowUser from './components/show_user/showUser';
import Popup from './components/popup/popup';

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

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      user: '',
      displayLogin: 'hidden',
      displaySignup: 'hidden',
      displayShowUser: false,
      displayContainer: true,
      error: 'none',
      triggerShowUser: false,
      userName: '',
      firstName: '',
      lastName: '',
      email: '',
      number: '',
      bio: '',
      popupShow: false,
      errorMessage: ''
    }
    this.removeUser = this.removeUser.bind(this);
    this.handleUserName = this.handleUserName.bind(this);
    this.handleFirstName = this.handleFirstName.bind(this);
    this.handleLastName = this.handleLastName.bind(this);
    this.handleEmail = this.handleEmail.bind(this);
    this.handleContact = this.handleContact.bind(this);
    this.handleBio = this.handleBio.bind(this);
    this.handleNotAMember = this.handleNotAMember.bind(this);
    this.closePopup = this.closePopup.bind(this);
    this.loginFail = this.loginFail.bind(this);
  }

  componentDidMount() {
    var user = cookies.get('loginUser');
    if (user !== undefined) {
      this.setState({ user: user, displayShowUser: true, triggerShowUser: true, displayLogin: 'show', displayContainer: false });
    }
  }

  loginFail(errorMessage){
    cookies.remove('loginUser');
    this.setState({ user: '', displayShowUser: false, triggerShowUser: false, displayLogin: 'hidden', displayContainer: true, popupShow: true, errorMessage: errorMessage });
  }

  removeUser() {
    cookies.remove('loginUser');
    this.setState({ user: '', displayShowUser: false, triggerShowUser: false, displayLogin: 'hidden', displayContainer: true });
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

    const result = await newUser({ variables: { userName: userName, firstName: firstName, lastName: lastName, email: email, contact: number, bio: bio } });
    if (result.data.newUser.id === '0') {
      this.setState({ popupShow: !this.state.popupShow })
    } else {
      cookies.set('loginUser', userName);
      this.setState({ user: userName, displaySignup: 'hidden', triggerShowUser: true, displayShowUser: true, displayContainer: false, popupShow: false });
    }

  }

  async login(e) {
    if (e.key === 'Enter') {
      const userName = this.state.userName;
      cookies.set('loginUser', userName);
      console.log('Line ---- 108', userName);
      this.setState({ user: userName, displayLogin: 'show', triggerShowUser: true, displayShowUser: true, displayContainer: false });
      e.preventDefault();
    }
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

  closePopup(){
    this.setState({popupShow: false})
  }

  render() {
    const {user, errorMessage} = this.state;
    return (
      <div className="main-div-chat">
        {this.state.popupShow && <Popup onClosePopup = {this.closePopup} errorMessage={errorMessage}/>}
        {this.state.displayContainer && <div className={"container-login100 "}>
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
          <div className={"wrap-login100 p-l-55 p-r-55 p-t-65 p-b-54 " + (this.state.displayLogin === "hidden" ? "" : "hidden")}>
            <div className="login100-form validate-form">
              <span className="login100-form-title p-b-49">
                Login
                </span>

              <div className="wrap-input100 validate-input m-b-23">
                <input className="input100" type="text" placeholder="Type your username" onChange={(e) => this.handleUserName(e)} onKeyPress={(e) => this.login(e)} />
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
              <h6 style={{ cursor: 'pointer' }} onClick={this.handleNotAMember}>Not a member?</h6>
            </div>
          </div>
        </div >}
        {this.state.triggerShowUser && <ShowUser user={user} hidden={this.state.displayShowUser} onRemoveUser={this.removeUser} onLoginFail={this.loginFail}/>}
      </div>
    );
  }
}

export default compose(graphql(NEW_USER))(App);
