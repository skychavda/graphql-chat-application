import React from 'react';
import { Scrollbars } from 'react-custom-scrollbars';
import { Mutation, compose, graphql, withApollo } from "react-apollo";
import gql from "graphql-tag";
import ProfileUser from '../profile_user/profileuser';
import './userlist.css';

const NEW_PRIVATE_CHAT_ROOM = gql`
    mutation newChatRoom($creatorID:ID!, $chatRoomType:ChatRoomType!, $receiverID:ID!){
  newChatRoom(input:{
    creatorID:$creatorID,
    chatRoomType:$chatRoomType
  },receiverID:$receiverID){
    chatRoomID
    creatorID
    creator{
      id
      userName
      firstName
      lastName
    }
    chatRoomName
    members{
      id
      member{
        userName
      }
    }
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
            groupMemberList: [],
            messages: []
        }
    }

    componentDidMount() {
        let messages = [];
        let mainChat = this.props.list;
        mainChat.map(function (x) {
            x.isChecked = false;
            return x
        });
        messages = mainChat;
        this.setState({ messages: messages })
    }

    handlePrivateChat = async (e, userId, chatRoomType, newChatRoom) => {
        if (chatRoomType === 'GROUP') {
            // this.setState({ groupMemberList: groupMemberList });
            console.log('Line ---- 50', groupMemberList);
        } else {
            e.preventDefault();
            const creatorID = this.props.loginUserDetalis.id;
            const result = await newChatRoom({ variables: { creatorID: creatorID, chatRoomType: chatRoomType, receiverID: userId } })
            this.setState({ chatRoomID: result.data.newChatRoom.chatRoomID, showUserList: false })
            this.props.onInitializeChat(this.state.chatRoomID);
            this.props.handleNewChatDialog(e);
        }
    }

    handleNewChatDialog(e) {
        this.setState({ showUserList: true, showGroupChat: false });
        this.props.handleNewChatDialog(e);
    }

    handleGroupChatDialog(e) {
        this.setState({ showUserList: true, showSingleChat: false });
        this.props.handleNewChatDialog(e);
    }

    addUserToGroupList(e, id) {
        e.preventDefault();
        const userId = { "id": id }
        for (let i = 0; i < groupMemberList.length; i++) {
            if(groupMemberList[i] === id){
                groupMemberList.pop(id);
            }else{
                groupMemberList.push(id);
            }    
        }
        

        const messages = this.state.messages.slice(0);
        const foundIndex = messages.findIndex(message => message.id === id)
        if (foundIndex > -1) {
            if (messages[foundIndex].isChecked === true) {
                messages[foundIndex].isChecked = false;
                this.setState({ messages });
            } else {
                messages[foundIndex].isChecked = true;
                this.setState({ messages });
            }

        }
    }

    render() {
        const list = this.props.list;
        console.log('Line ---- 91', this.state.messages);
        // console.log('Line ---- 71', this.state.groupMemberList);
        return (
            <div>
                <div>
                    <button className="btn btn-outline-secondary btn-lg" onClick={(e) => this.handleNewChatDialog(e)}>New Chat</button>
                    <button className="btn btn-outline-secondary btn-lg" onClick={(e) => this.handleGroupChatDialog(e)}>New Group Chat</button>
                </div>
                <div className={"user-list " + (this.state.showUserList === false ? "hidden" : "")}>
                    <Scrollbars>
                        {list.map((user, i) => (
                            <ul className="list" key={i} >
                                {/* + (user.name === this.state.receiverName ? "user-name-active" : "") */}
                                <li className={"clearfix "}>
                                    <div className="about">
                                        <div>
                                            <ProfileUser userName={user.userName} />
                                            {this.state.showSingleChat && <Mutation mutation={NEW_PRIVATE_CHAT_ROOM}>
                                                {newChatRoom => (
                                                    <div className={"name "} key={user.id} onClick={(e) => this.handlePrivateChat(e, user.id, 'PRIVATE', newChatRoom)}>{user.userName}</div>
                                                )}
                                            </Mutation>}
                                            {this.state.showGroupChat &&
                                                <div className={"name "} key={user.id} onClick={(e) => this.addUserToGroupList(e, user.id)}>
                                                    {user.userName}
                                                    <div className={user.isChecked === true ? "arrow" : "check-box"}></div>
                                                </div>
                                            }
                                        </div>
                                    </div>
                                </li>
                            </ul>
                        ))}
                    </Scrollbars>
                    {
                        this.state.showGroupChat && <Mutation mutation={NEW_PRIVATE_CHAT_ROOM}>
                            {newChatRoom => (
                                <button onClick={(e) => this.handlePrivateChat(e, groupMemberList, 'GROUP', newChatRoom)}>start</button>
                            )}
                        </Mutation>
                    }}
                </div>
            </div>
        );
    }
}

export default compose(withApollo)(UserList);