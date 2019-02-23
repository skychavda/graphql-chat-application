import React from 'react';
import { Mutation, compose, withApollo } from "react-apollo";
import gql from "graphql-tag";
import ProfileUser from '../profile_user/profileuser';
import SearchUser from '../search_user/searchuser';
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
            messages: [],
            userList: props.list,
            filterUserList: props.list
        }
        this.filterUser = this.filterUser.bind(this);
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
            this.setState({ showUserList: false })
            this.props.handleShowChatDialog(e);
        } else {
            e.preventDefault();
            const creatorID = this.props.loginUserDetalis.id;
            const result = await newChatRoom({ variables: { creatorID: creatorID, chatRoomType: chatRoomType, receiverID: userId } })
            this.setState({ chatRoomID: result.data.newChatRoom.chatRoomID, showUserList: false })
            this.props.onInitializeChat(this.state.chatRoomID, result.data.newChatRoom.members[1].member.userName);
            this.props.handleShowChatDialog(e);
        }
    }

    handleNewChatDialog(e) {
        this.setState({ showUserList: true, showGroupChat: false });
        this.props.handleHideChatDialog(e);
    }

    handleGroupChatDialog(e) {
        this.setState({ showUserList: true, showGroupChat: true });
        this.props.handleHideChatDialog(e);
    }

    addUserToGroupList(e, id) {
        e.preventDefault();
        // const userId = { "id": id }
        const index = groupMemberList.findIndex(list => list === id);
        if (index > -1) {
            groupMemberList.splice(index, 1);
        } else {
            groupMemberList.push(id);
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

    filterUser(name){
        let filteredUserList = this.state.userList.filter((user) => {
            return user.userName.toLowerCase().includes(name)
        })
        this.setState({ filterUserList: filteredUserList })
    }

    render() {
        const list = this.state.filterUserList;
        return (
            <div>
                <div className="btn-container">
                    <button className="btn btn-outline-secondary btn-md" onClick={(e) => this.handleNewChatDialog(e)}>New Chat</button>
                    <button style={{ marginLeft: '15px' }} className="btn btn-outline-secondary btn-md" onClick={(e) => this.handleGroupChatDialog(e)}>Create Group</button>
                </div>
                {this.state.showUserList  && <div className="user-list-box ">
                    <SearchUser onFilterUser={this.filterUser} />
                    {list.map((user, i) => (
                        <ul className="list ripple" key={i} >
                            {/* + (user.name === this.state.receiverName ? "user-name-active" : "") */}
                            <li className={"clearfix "}>
                                <div className="about">
                                    <div>
                                        <ProfileUser userName={user.userName} />
                                        {this.state.showSingleChat && <Mutation mutation={NEW_PRIVATE_CHAT_ROOM}>
                                            {newChatRoom => (
                                                <div className={"name "} key={user.id} onClick={this.state.showGroupChat === false ? (e) => this.handlePrivateChat(e, user.id, 'PRIVATE', newChatRoom) : (e) => this.addUserToGroupList(e, user.id)}>
                                                    {user.userName}
                                                    {this.state.showGroupChat && <div className={user.isChecked === true ? "arrow" : "check-box"}></div>}
                                                </div>
                                            )}
                                        </Mutation>}
                                    </div>
                                </div>
                            </li>
                        </ul>
                    ))}

                    {
                        this.state.showGroupChat && <div style={{ textAlign: 'center', margin: '10px auto' }}><Mutation mutation={NEW_PRIVATE_CHAT_ROOM}>
                            {newChatRoom => (
                                <button style={{ textTransform: 'uppercase' }} className="btn btn-outline-primary btn-md" onClick={(e) => this.handlePrivateChat(e, groupMemberList, 'GROUP', newChatRoom)}>create group</button>
                            )}
                        </Mutation></div>
                    }
                </div>}
            </div>
        );
    }
}

export default compose(withApollo)(UserList);