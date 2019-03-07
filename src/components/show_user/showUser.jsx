import React from 'react';
import {
  Mutation, compose, graphql, withApollo,
} from 'react-apollo';
import gql from 'graphql-tag';
import PropTypes from 'prop-types';
import { Scrollbars } from 'react-custom-scrollbars';
import isEqual from 'lodash.isequal';

import CreateChat from '../create_chat/createChat';
import SearchUser from '../search_user/searchuser';
import ProfileUser from '../profile_user/profileuser';
import UserList from '../user_list/userlist';

const SHOW_USER = gql`
  query users($name:String!){
    users(name:$name){
      id
      userName
      firstName
      lastName
    }
  }
`;

const USER_LOGIN = gql`
    query memberLogin($name:String!){
        MemberLogIn(name:$name){
            id
            userName
            firstName
            lastName
            email
            contact
            bio
            profilePicture
            createdAt
            updatedAt
        }
    }
`;

const CHAT_ROOM_LIST = gql`
    query chatRoomList($memberID:ID!){
        chatRoomListByMemberId(memberID:$memberID){
            chatRoomID
            name
            chatRoomType 
            createdAt
            totalMember
        }
    }
`;

const CHAT_ROOM_LIST_SUBSCRIPTION = gql`
    subscription chatRoomListByMember($memberID:ID!){
        chatRoomListByMember(memberID:$memberID){
            chatRoomID
            name
            chatRoomType
            createdAt
            totalMember
        }
    }
`;

const DELETE_CHAT_ROOM = gql`
    mutation deleteChatRoom($chatRoomID:ID!,$memberID:ID!){
        deleteChatRoom(input:{
            chatRoomID:$chatRoomID,
            memberID:$memberID
        })
    }
`;

class ShowUser extends React.Component {
  constructor(props) {
    super(props);
    this.messagesList = React.createRef();
    this.state = {
      receiverName: '',
      triggerCreateChat: false,
      userList: [],
      filterUserList: [],
      loginUser: [],
      chatRoomUserList: [],
      chatRoomID: '',
      memberID: '',
      showChat: true,
      chatRoomType: '',
      loginError: '',
      newUserMessage: [],
      first: false,
      colors: ['#bccad6', '#8d9db6', '#667292', '#054158', '#054f7c', '#1f6aa3', '#6494b1', '#c2d5e3'],
    };
    this.initializeChat = this.initializeChat.bind(this);
    this.filterUser = this.filterUser.bind(this);
    this.handleHideChatDialog = this.handleHideChatDialog.bind(this);
    this.handleShowChatDialog = this.handleShowChatDialog.bind(this);
    this.enableNewMemberSubscription = this.enableNewMemberSubscription.bind(this);
    this.leaveGroup = this.leaveGroup.bind(this);
  }

  componentDidMount() {
    this.fetchUserFromQuery();
    this.fetchLooginUserDetail();
  }

  // componentDidUpdate(prevProps, prevState) {
  //   const { receiverName } = this.state;
  //   if (receiverName !== prevState.receiverName && receiverName !== '') {
  //     // this.enableNewMemberSubscription();
  //   }
  // }

  onNewMessageArrive(chatRoomID) {
    const { newUserMessage } = this.state;
    const m = this.getCount(newUserMessage);
    const userIdArray = m[0];
    const userCountArray = m[1];
    let mainIndex;
    for (let i = 0; i < userIdArray.length; i++) {
      if (userIdArray[i] === chatRoomID) {
        mainIndex = i;
        break;
      }
    }
    const mainCounter = userCountArray[mainIndex];
    for (let i = 0; i < newUserMessage.length; i++) {
      if (newUserMessage[i] === chatRoomID) {
        return (<span className={newUserMessage[i] === chatRoomID ? 'newMessage' : ''}>{mainCounter}</span>);
      }
    }
  }

  // get count for repetated id
  getCount = (arr) => {
    const a = []; const b = [];
    let prev;
    arr.sort();
    for (let i = 0; i < arr.length; i++) {
      if (arr[i] !== prev) {
        a.push(arr[i]);
        b.push(1);
      }
      else {
        b[b.length - 1] += 1;
      }
      prev = arr[i];
    }
    return [a, b];
  }

    fetchUserFromQuery = async () => {
      const { client, user } = this.props;
      const result = await client.query({
        query: SHOW_USER,
        variables: {
          name: user,
        },
      });
      this.setState({ userList: result.data.users });
    }

    deleteRoom = async (e, chatRoomID, memberID, deleteChatRoom) => {
      deleteChatRoom({ variables: { chatRoomID, memberID } });
      e.preventDefault();
    }

    fetchLooginUserDetail = async () => {
      const { client, user, onLoginFail } = this.props;
      const { loginError } = this.state;
      const result = await client.query({
        query: USER_LOGIN,
        variables: {
          name: user,
        },
      });
      if (result.data.MemberLogIn === null) {
        this.setState({ loginError: result.errors });
        onLoginFail(loginError);
      }
      else {
        this.setState({ loginUser: result.data.MemberLogIn });
      }
      this.fetchRoomList();
    }

    fetchRoomList = async () => {
      const { client } = this.props;
      const { loginUser } = this.state;
      const result = await client.query({
        query: CHAT_ROOM_LIST,
        variables: {
          memberID: loginUser.id,
        },
      });
      this.setState({ chatRoomUserList: result.data.chatRoomListByMemberId, filterUserList: result.data.chatRoomListByMemberId }, function () {
        this.enableNewMemberSubscription();
      });
    }

    async initializeChat(chatRoomID, name, chatRoomType) {
      const { loginUser } = this.state;
      const { newUserMessage } = this.state;
      const tempArray = [];
      for (let i = 0; i < newUserMessage.length; i++) {
        if (newUserMessage[i] !== chatRoomID) {
          tempArray.push(newUserMessage[i]);
        }
      }
      this.setState({
        newUserMessage: tempArray, chatRoomID, memberID: loginUser.id, receiverName: name, triggerCreateChat: true, chatRoomType, first: false,
      });
      this.disable = true;
    }

    filterUser(userName) {
      const { chatRoomUserList } = this.state;
      const filteredUserList = chatRoomUserList.filter(user => user.name.toLowerCase().includes(userName));
      this.setState({ filterUserList: filteredUserList });
    }

    enableNewMemberSubscription() {
      const { data } = this.props;
      const { loginUser } = this.state;
      data.subscribeToMore({
        document: CHAT_ROOM_LIST_SUBSCRIPTION,
        variables: { memberID: loginUser.id },
        updateQuery: (prev, { subscriptionData }) => {
          if (!subscriptionData.data) return prev;
          const {
            filterUserList, newUserMessage, chatRoomID, first,
          } = this.state;
          const newMember = subscriptionData.data.chatRoomListByMember;
          if (!isEqual(filterUserList, newMember) || first) {
            if (newMember[0].chatRoomID !== chatRoomID) {
              newUserMessage.push(newMember[0].chatRoomID);
              this.setState({ first: true });
            }
          }
          this.setState({ chatRoomUserList: newMember, filterUserList: newMember, newUserMessage });
          return false;
        },
      });
    }

    removeUser(e) {
      const { onRemoveUser } = this.props;
      e.preventDefault();
      onRemoveUser(e);
    }

    handleHideChatDialog() {
      this.setState({ showChat: false });
    }

    handleShowChatDialog() {
      this.setState({ showChat: true });
    }

    leaveGroup() {
      this.setState({ triggerCreateChat: false });
    }

    render() {
      const {
        data, onLoginFail, hidden, user,
      } = this.props;
      if (data.loading) { return <div className="loader" />; }
      if (data.error) {
        onLoginFail(data.error.graphQLErrors[0].message);
      }
      const {
        userList, filterUserList, loginUser, showChat, triggerCreateChat, chatRoomID, memberID, receiverName, chatRoomType, colors,
      } = this.state;
      const list = filterUserList;
      const loginUserDetails = loginUser;
      return (
        <React.Fragment>
          {hidden && (
            <div>
              <UserList list={userList} loginUserDetalis={loginUserDetails} onInitializeChat={this.initializeChat} handleHideChatDialog={this.handleHideChatDialog} handleShowChatDialog={this.handleShowChatDialog} />

              {showChat && (
              <div className="row raw">
                <div className="display-user col-md-4 col-lg-3">
                  <div className="user-title">
                    <p className="float-left" style={{ marginBottom: 0 }}>
                    Welcome
                      {' '}
                      {user}
                    </p>
                    <button type="button" style={{ position: 'relative', bottom: '3px' }} className="btn btn-outline-primary float-right btn-sm" onClick={e => this.removeUser(e)}>Log out</button>
                  </div>

                  <SearchUser onFilterUser={this.filterUser} />

                  <div className="user-list">
                    <Scrollbars>
                      {list.map((users, i) => (
                        <ul className="list ripple" key={users.chatRoomID}>
                          <li className={`clearfix ${users.name === receiverName ? 'user-name-active' : ''}`}>
                            <div className="about">
                              <div>
                                <ProfileUser userName={users.name} changeColor={colors[i % colors.length]} />
                                <div className="name " key={user.id} onClick={() => this.initializeChat(users.chatRoomID, users.name, users.chatRoomType)} aria-hidden="true">
                                  <p style={{ marginBottom: 0 }}>
                                    {users.name}
                                    {this.onNewMessageArrive(users.chatRoomID)}
                                  </p>
                                  {users.chatRoomType === 'GROUP' ? (
                                    <p style={{ marginBottom: '0', fontSize: '13px', color: '#bfbfbf' }}>
                                      {users.totalMember}
                                      {' '}
Members
                                    </p>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                          </li>
                          <Mutation mutation={DELETE_CHAT_ROOM}>
                            {deleteChatRoom => (
                              <button type="button" className="del-icon btn btn-outline-danger btn-sm" onClick={e => this.deleteRoom(e, users.chatRoomID, loginUser.id, deleteChatRoom)}><i className="fas fa-trash-alt" /></button>
                            )}
                          </Mutation>
                        </ul>
                      ))}
                    </Scrollbars>
                  </div>
                </div>
                {triggerCreateChat && <CreateChat list={userList} chatRoomId={chatRoomID} memberId={memberID} receiverName={receiverName} chatRoomType={chatRoomType} leaveGroup={this.leaveGroup} />}
              </div>
              )}
            </div>
          )}
        </React.Fragment>
      );
    }
}

export default compose(
  graphql(DELETE_CHAT_ROOM, { name: 'deleteChat' }),
  graphql(USER_LOGIN, { options: props => ({ variables: { name: props.user } }) }), withApollo,
)(ShowUser);

ShowUser.propTypes = {
  data: PropTypes.oneOfType([PropTypes.string, PropTypes.bool, PropTypes.object, PropTypes.array]),
  client: PropTypes.oneOfType([PropTypes.string, PropTypes.bool, PropTypes.object, PropTypes.array]),
  onRemoveUser: PropTypes.func,
  user: PropTypes.string,
  onLoginFail: PropTypes.func,
  hidden: PropTypes.bool,
};

ShowUser.defaultProps = {
  data: PropTypes.object,
  client: PropTypes.object,
  onRemoveUser: PropTypes.func,
  user: PropTypes.string,
  onLoginFail: PropTypes.func,
  hidden: PropTypes.bool,
};
