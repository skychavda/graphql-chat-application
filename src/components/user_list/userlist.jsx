import React from 'react';
import { Mutation, compose, withApollo } from 'react-apollo';
import gql from 'graphql-tag';
import PropTypes from 'prop-types';
import ProfileUser from '../profile_user/profileuser';
import SearchUser from '../search_user/searchuser';

const NEW_PRIVATE_CHAT_ROOM = gql`
    mutation newPrivateChatRoom($creatorID:ID!, $chatRoomType:ChatRoomType!, $receiverID:ID!){
    newPrivateChatRoom(input:{
        creatorID:$creatorID,
        chatRoomType:$chatRoomType,
        receiverID:$receiverID
    }){
        chatRoomID
        creatorID
        creator{
        id
        userName
        firstName
        lastName
        }
        chatRoomName
        chatRoomType
        members{
        id
        member{
            userName
        }
        }
    }
}
`;

const NEW_GROUP_CHAT_ROOM = gql`
    mutation newGroupchatRoom($creatorID:ID!, $chatRoomName:String!, $chatRoomType:ChatRoomType!, $receiverID:[ID!]){
    newGroupchatRoom(input:{
        creatorID:$creatorID,
        chatRoomName: $chatRoomName,
        chatRoomType:$chatRoomType,
        receiverID:$receiverID
    }){
        chatRoomID
        creatorID
        creator{
        id
        userName
        firstName
        lastName
        }
        chatRoomName
        chatRoomType
        members{
        id
        member{
            userName
        }
        }
    }
}
`;

const USER_JOIN_SUBSCRIPTION = gql`
    subscription{
        userJoined{
            id
            userName
            firstName
            lastName
            email
            contact
        }
    }
`;

const groupMemberList = [];

class UserList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      chatRoomID: '',
      showUserList: false,
      showSingleChat: true,
      showGroupChat: true,
      messages: [],
      userList: props.list,
      filterUserList: props.list,
      groupName: '',
      groupNameText: false,
      inputError: false,
      colors: ['#bccad6', '#8d9db6', '#667292', '#054158', '#054f7c', '#1f6aa3', '#6494b1', '#c2d5e3'],
    };
    this.filterUser = this.filterUser.bind(this);
    this.handleGroupName = this.handleGroupName.bind(this);
    this.handleCheckedFlag = this.handleCheckedFlag.bind(this);
  }

  componentDidMount() {
    const { client } = this.props;
    const { userList } = this.state;
    const _this = this;
    client.subscribe({
      query: USER_JOIN_SUBSCRIPTION,
    }).subscribe({
      next(data) {
        const newUserList = userList.slice();
        newUserList.push(data.data.userJoined);
        _this.setState({ userList: newUserList, filterUserList: newUserList });
        _this.handleCheckedFlag();
      },
    });
  }

    handleGroupChat = async (e, chatRoomType, newGroupChatRoom) => {
      const { groupName, chatRoomID } = this.state;
      const { loginUserDetalis, onInitializeChat, handleShowChatDialog } = this.props;
      if (groupName === '') {
        this.setState({ inputError: true });
      }
      else {
        const creatorID = loginUserDetalis.id;
        const result = await newGroupChatRoom({
          variables: {
            creatorID, chatRoomName: groupName, chatRoomType, receiverID: groupMemberList,
          },
        });
        this.setState({ chatRoomID: result.data.newGroupchatRoom.chatRoomID, showUserList: false, inputError: false });
        onInitializeChat(chatRoomID, groupName, result.data.newGroupchatRoom.chatRoomType);
        handleShowChatDialog(e);
      }
    }

    handlePrivateChat = async (e, userId, chatRoomType, newPrivateChatRoom) => {
      const { loginUserDetalis, onInitializeChat, handleShowChatDialog } = this.props;
      const creatorID = loginUserDetalis.id;
      const result = await newPrivateChatRoom({ variables: { creatorID, chatRoomType, receiverID: userId } });
      this.setState({ chatRoomID: result.data.newPrivateChatRoom.chatRoomID, showUserList: false });
      onInitializeChat(result.data.newPrivateChatRoom.chatRoomID, result.data.newPrivateChatRoom.members[1].member.userName, result.data.newPrivateChatRoom.chatRoomType);
      handleShowChatDialog(e);
    }

    handleCheckedFlag() {
      const { userList } = this.state;
      let messages = [];
      const mainChat = userList;
      mainChat.map((x) => {
        x.isChecked = false;
        return x;
      });
      messages = mainChat;
      this.setState({ messages });
    }

    closeDialogList(e) {
      const { handleShowChatDialog } = this.props;
      this.setState({ showUserList: false, groupNameText: false });
      handleShowChatDialog(e);
    }

    handleNewChatDialog(e) {
      const { handleHideChatDialog } = this.props;
      this.setState({ showUserList: true, showGroupChat: false, groupNameText: false });
      handleHideChatDialog(e);
    }

    handleGroupChatDialog(e) {
      const { handleHideChatDialog } = this.props;
      const { groupNameText } = this.state;
      this.setState({ showUserList: true, showGroupChat: true, groupNameText: !groupNameText });
      handleHideChatDialog(e);
    }

    addUserToGroupList(e, id) {
      const { messages } = this.state;
      e.preventDefault();
      const index = groupMemberList.findIndex(list => list === id);
      if (index > -1) {
        groupMemberList.splice(index, 1);
      }
      else {
        groupMemberList.push(id);
      }
      // const messages = this.state.messages.slice(0);
      const foundIndex = messages.findIndex(message => message.id === id);
      if (foundIndex > -1) {
        if (messages[foundIndex].isChecked === true) {
          messages[foundIndex].isChecked = false;
          this.setState({ messages });
        }
        else {
          messages[foundIndex].isChecked = true;
          this.setState({ messages });
        }
      }
    }

    filterUser(name) {
      const { userList } = this.state;
      const filteredUserList = userList.filter(user => user.userName.toLowerCase().includes(name));
      this.setState({ filterUserList: filteredUserList });
    }

    handleGroupName(e) {
      this.setState({ groupName: e.target.value });
    }

    render() {
      const {
        filterUserList, groupNameText, showUserList, inputError, showSingleChat, showGroupChat, colors,
      } = this.state;
      const list = filterUserList;
      return (
        <div>
          <div className="btn-container">
            <button type="button" className="btn btn-outline-secondary btn-md" onClick={e => this.handleNewChatDialog(e)}>New Chat</button>
            <button type="button" style={{ marginLeft: '15px' }} className="btn btn-outline-secondary btn-md" onClick={e => this.handleGroupChatDialog(e)}>Create Group</button>
            {groupNameText && <input className={`group-text-box ${inputError === false ? '' : 'input-error'}`} placeholder="Enter group name" onChange={e => this.handleGroupName(e)} />}
            {showUserList && <div className="close" role="button" onClick={() => this.closeDialogList()} aria-hidden="true">&times;</div>}
          </div>
          {showUserList && (
            <div className="user-list-box ">
              <SearchUser onFilterUser={this.filterUser} />
              {list.map((user, i) => (
                <ul className="list ripple" key={user.id}>
                  <li className="clearfix ">
                    <div className="about">
                      <div>
                        <ProfileUser userName={user.userName} changeColor={colors[i % colors.length]} />
                        {showSingleChat && (
                          <Mutation mutation={NEW_PRIVATE_CHAT_ROOM}>
                            {newPrivateChatRoom => (
                              <div className="name " tabIndex={0} role="button" key={user.id} onClick={showGroupChat === false ? e => this.handlePrivateChat(e, user.id, 'PRIVATE', newPrivateChatRoom) : e => this.addUserToGroupList(e, user.id)} aria-hidden="true">
                                {user.userName}
                                {showGroupChat && <div className={user.isChecked === true ? 'arraw' : 'check-box'} />}
                              </div>
                            )}
                          </Mutation>
                        )}
                      </div>
                    </div>
                  </li>
                </ul>
              ))}
              {
                showGroupChat && (
                  <div style={{ textAlign: 'center', margin: '10px auto' }}>
                    <Mutation mutation={NEW_GROUP_CHAT_ROOM}>
                      {newGroupChatRoom => (
                        <button type="button" style={{ textTransform: 'uppercase' }} className="btn btn-outline-primary btn-md" onClick={e => this.handleGroupChat(e, 'GROUP', newGroupChatRoom)}>create group</button>
                      )}
                    </Mutation>
                  </div>
                )
              }
            </div>
          )}
        </div>
      );
    }
}

export default compose(withApollo)(UserList);

UserList.propTypes = {
  list: PropTypes.oneOfType([PropTypes.string, PropTypes.bool, PropTypes.object, PropTypes.array]),
  loginUserDetalis: PropTypes.oneOfType([PropTypes.string, PropTypes.bool, PropTypes.object, PropTypes.array]),
  onInitializeChat: PropTypes.func,
  handleShowChatDialog: PropTypes.func,
  handleHideChatDialog: PropTypes.func,
  client: PropTypes.oneOfType([PropTypes.string, PropTypes.bool, PropTypes.object, PropTypes.array]),
};

UserList.defaultProps = {
  list: PropTypes.array,
  loginUserDetalis: PropTypes.object,
  onInitializeChat: PropTypes.func,
  handleShowChatDialog: PropTypes.func,
  handleHideChatDialog: PropTypes.func,
  client: PropTypes.object,
};
