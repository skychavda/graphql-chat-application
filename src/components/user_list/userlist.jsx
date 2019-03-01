import React from 'react';
import { Mutation, compose, withApollo } from "react-apollo";
import gql from "graphql-tag";
import ProfileUser from '../profile_user/profileuser';
import SearchUser from '../search_user/searchuser';
import './userlist.css';

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
            filterUserList: props.list,
            groupName: '',
            receiverID: [],
            groupNameText: false,
            inputError: false
        }
        this.filterUser = this.filterUser.bind(this);
        this.handleGroupName = this.handleGroupName.bind(this);
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

    handleGroupChat = async (e, chatRoomType, newGroupChatRoom) => {
        const groupName = this.state.groupName;
        if (groupName === "") {
            this.setState({ inputError: true })
        } else {
            const creatorID = this.props.loginUserDetalis.id;
            const result = await newGroupChatRoom({ variables: { creatorID: creatorID, chatRoomName: groupName, chatRoomType: chatRoomType, receiverID: groupMemberList } })
            this.setState({ chatRoomID: result.data.newGroupchatRoom.chatRoomID, showUserList: false, inputError: false })
            this.props.onInitializeChat(this.state.chatRoomID, groupName, result.data.newGroupchatRoom.chatRoomType);
            this.props.handleShowChatDialog(e);
        }
    }

    handlePrivateChat = async (e, userId, chatRoomType, newPrivateChatRoom) => {
        const creatorID = this.props.loginUserDetalis.id;
        const result = await newPrivateChatRoom({ variables: { creatorID: creatorID, chatRoomType: chatRoomType, receiverID: userId } });
        this.setState({ chatRoomID: result.data.newPrivateChatRoom.chatRoomID, showUserList: false });
        this.props.onInitializeChat(this.state.chatRoomID, result.data.newPrivateChatRoom.members[1].member.userName, result.data.newPrivateChatRoom.chatRoomType);
        this.props.handleShowChatDialog(e);
    }

    closeDialogList(e) {
        this.setState({ showUserList: false, groupNameText: false })
        this.props.handleShowChatDialog(e);
    }

    handleNewChatDialog(e) {
        this.setState({ showUserList: true, showGroupChat: false, groupNameText: false });
        this.props.handleHideChatDialog(e);
    }

    handleGroupChatDialog(e) {
        this.setState({ showUserList: true, showGroupChat: true, groupNameText: !this.state.groupNameText });
        this.props.handleHideChatDialog(e);
    }

    addUserToGroupList(e, id) {
        e.preventDefault();
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

    filterUser(name) {
        let filteredUserList = this.state.userList.filter((user) => {
            return user.userName.toLowerCase().includes(name)
        })
        this.setState({ filterUserList: filteredUserList })
    }

    handleGroupName(e) {
        this.setState({ groupName: e.target.value })
    }

    render() {
        const list = this.state.filterUserList;
        return (
            <div>
                <div className="btn-container">
                    <button className="btn btn-outline-secondary btn-md" onClick={(e) => this.handleNewChatDialog(e)}>New Chat</button>
                    <button style={{ marginLeft: '15px' }} className="btn btn-outline-secondary btn-md" onClick={(e) => this.handleGroupChatDialog(e)}>Create Group</button>
                    {this.state.groupNameText && <input className={"group-text-box " + (this.state.inputError === false ? "" : "input-error")} placeholder="Enter group name" onChange={(e) => this.handleGroupName(e)} />}
                    {this.state.showUserList && <div className="close" onClick={() => this.closeDialogList()}>&times;</div>}
                </div>
                {this.state.showUserList && <div className="user-list-box ">
                    <SearchUser onFilterUser={this.filterUser} />
                    {list.map((user, i) => (
                        <ul className="list ripple" key={i} >
                            <li className={"clearfix "}>
                                <div className="about">
                                    <div>
                                        <ProfileUser userName={user.userName} />
                                        {this.state.showSingleChat && <Mutation mutation={NEW_PRIVATE_CHAT_ROOM}>
                                            {newPrivateChatRoom => (
                                                <div className={"name "} key={user.id} onClick={this.state.showGroupChat === false ? (e) => this.handlePrivateChat(e, user.id, 'PRIVATE', newPrivateChatRoom) : (e) => this.addUserToGroupList(e, user.id)}>
                                                    {user.userName}
                                                    {this.state.showGroupChat && <div className={user.isChecked === true ? "arraw" : "check-box"}></div>}
                                                </div>
                                            )}
                                        </Mutation>}
                                    </div>
                                </div>
                            </li>
                        </ul>
                    ))}

                    {
                        this.state.showGroupChat && <div style={{ textAlign: 'center', margin: '10px auto' }}>
                            <Mutation mutation={NEW_GROUP_CHAT_ROOM}>
                                {newGroupChatRoom => (
                                    <button style={{ textTransform: 'uppercase' }} className="btn btn-outline-primary btn-md" onClick={(e) => this.handleGroupChat(e, 'GROUP', newGroupChatRoom)}>create group</button>
                                )}
                            </Mutation>
                        </div>
                    }
                </div>}
            </div>
        );
    }
}

export default compose(withApollo)(UserList);