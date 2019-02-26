import React from "react";
import { Mutation, compose, graphql, withApollo, Query } from "react-apollo";
import gql from "graphql-tag";
import './showuser.css';
import { Scrollbars } from 'react-custom-scrollbars';

import CreateChat from '../create_chat/createChat';
import SearchUser from '../search_user/searchuser';
import ProfileUser from '../profile_user/profileuser';
import UserList from '../user_list/userlist';

const SHOW_USER = gql`
  query users($user:String!){
    users(name:$user){
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
        }
    }
`;

const MEMBER_LIST_BY_CHATROOM = gql`
    query memberListByChatRoomId($chatRoomID:ID!,$memberID:ID!){
    memberListByChatRoomId(chatRoomID:$chatRoomID,memberID:$memberID){
        id
        chatRoomID
        member{
            id
            userName
        }
        joinAt  
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
        }
    }
`;

const DELETE_CHAT = gql`
    mutation deleteChat($chatRoomID:ID!,$memberID:ID!){
        deleteChat(input:{
            chatRoomID:$chatRoomID,
            memberID:$memberID
        }){
            id
            chatRoomID
            member{
                id
                userName
                firstName
                lastName
            }
            joinAt
            deleteAt
        }
    }
`;

const DELETE_CHAT_SUBSCRIPTION = gql`
    subscription chatDelete($chatRoomID:ID!){
        chatDelete(chatRoomID:$chatRoomID){
            chatRoomID
            creatorID
            creator{
               id
               userName
            }
            chatRoomName
            chatRoomType
            members{
            id
                chatRoomID
                member{
                 id
                 userName
                }
            }
            createdAt
        }
    }
`;

class ShowUser extends React.Component {
    constructor(props) {
        super(props);
        this.messagesList = React.createRef();
        this.state = {
            receiverName: '',
            display: 'hidden',
            triggerCreateChat: false,
            subscribedNewUser: false,
            userList: [],
            filterUserList: [],
            loginUser: [],
            chatRoomUserList: [],
            chatRoomID: '',
            memberID: '',
            showChat: true,
            chatRoomType: '',
            memberListShow: true
        }
        this.initializeChat = this.initializeChat.bind(this);
        this.filterUser = this.filterUser.bind(this);
        this.handleHideChatDialog = this.handleHideChatDialog.bind(this);
        this.handleShowChatDialog = this.handleShowChatDialog.bind(this);
        this.enableNewMemberSubscription = this.enableNewMemberSubscription.bind(this);
    }

    async initializeChat(chatRoomID, name, chatRoomType) {
        this.setState({ chatRoomID: chatRoomID, memberID: this.state.loginUser.id, receiverName: name, display: 'show', triggerCreateChat: true, chatRoomType: chatRoomType, memberListShow: false });
        this.disable = true;
    }

    componentDidMount() {
        // this.props.data.subscribeToMore({
        //     document: USER_JOIN_SUBSCRIPTION,
        //     updateQuery: (prev, { subscriptionData }) => {
        //         if (!subscriptionData.data) return prev;
        //         const userList = this.state.filterUserList;
        //         const newName = subscriptionData.data.userJoined;
        //         console.log('Line ---- 68',newName);
        //         const userIndex = userList.findIndex(userList => userList.id === newName.id)
        //         if(userIndex > -1){
        //             userList.push(newName)
        //             this.setState({userList})
        //         }
        //         console.log('Line ---- 90',userIndex);
        //         // return prev.users.push(newName);
        //     }
        // })
        // this.setState({ subscribedNewUser: true });

        this.fetchUserFromQuery();
        this.fetchLooginUserDetail();
    }

    componentDidUpdate(prev) {
        // this.addNewMessageSubscription.unsubscribe();
        if (this.state.receiverName !== prev.receiverName) {
            this.enableNewMemberSubscription();
        }
    }

    enableNewMemberSubscription() {
        this.props.data.subscribeToMore({
            document: CHAT_ROOM_LIST_SUBSCRIPTION,
            variables: { memberID: this.state.loginUser.id },
            updateQuery: (prev, { subscriptionData }) => {
                if (!subscriptionData.data) return prev;
                const newMember = subscriptionData.data.chatRoomListByMember;
                console.log('Line ---- 189', newMember);
                this.setState({chatRoomUserList: newMember, filterUserList: newMember})
            }
        })

        // this.props.data.subscribeToMore({
        //     document: DELETE_CHAT_SUBSCRIPTION,
        //     variables: { chatRoomID: this.state.chatRoomID },
        //     updateQuery: (prev, { subscriptionData }) => {
        //         if (!subscriptionData.data) return prev;
        //         const deletedChat = subscriptionData.data.chatDelete;
        //         console.log('Line ---- 149', deletedChat);
        //         // const userIndex = userList.findIndex(userList => userList.id === newName.id)
        //         // if (userIndex > -1) {
        //         //     userList.push(newName)
        //         //     this.setState({ userList })
        //         // }
        //     }
        // })
    }


    fetchUserFromQuery = async () => {
        const { client } = this.props;
        const result = await client.query({
            query: SHOW_USER,
            variables: {
                user: this.props.user
            }
        });
        this.setState({ userList: result.data.users })
    }

    fetchLooginUserDetail = async () => {
        const { client } = this.props;
        const result = await client.query({
            query: USER_LOGIN,
            variables: {
                name: this.props.user
            }
        });
        this.setState({ loginUser: result.data.MemberLogIn })
        this.fetchRoomList();
    }

    fetchRoomList = async () => {
        const { client } = this.props;
        const result = await client.query({
            query: CHAT_ROOM_LIST,
            variables: {
                memberID: this.state.loginUser.id
            }
        });
        // this.setState({ chatRoomUserList: result.data.chatRoomListByMemberId, filterUserList: result.data.chatRoomListByMemberId })
    }

    filterUser(userName) {
        let filteredUserList = this.state.chatRoomUserList.filter((user) => {
            return user.name.toLowerCase().includes(userName)
        })
        this.setState({ filterUserList: filteredUserList })
    }

    deleteRoom = async (e, chatRoomID, memberID, deleteChat) => {
        deleteChat({ variables: { chatRoomID: chatRoomID, memberID: memberID } });
        this.setState({ chatRoomID: chatRoomID })
        e.preventDefault();
    }

    removeUser(e) {
        e.preventDefault();
        this.props.onRemoveUser(e);
    }

    handleHideChatDialog(e) {
        this.setState({ showChat: false })
    }

    handleShowChatDialog(e) {
        this.setState({ showChat: true })
    }

    render() {
        const data = this.props.data;
        if (data.loading) { return <div className="loader"></div>; }
        if (data.error) { return `${data.error}` }
        let userList = this.state.userList;
        let list = this.state.filterUserList;
        const loginUserDetails = this.state.loginUser;
        if (this.props.hidden) {
            return (
                <div>
                    <UserList list={userList} loginUserDetalis={loginUserDetails} onInitializeChat={this.initializeChat} handleHideChatDialog={this.handleHideChatDialog} handleShowChatDialog={this.handleShowChatDialog} />

                    {this.state.showChat && <div className="row">
                        <div className="display-user col-md-4 col-lg-3">
                            <div className="user-title">
                                <p className="float-left" style={{ marginBottom: 0 }}>Welcome {this.props.user}</p>
                                <button style={{ position: 'relative', bottom: '3px' }} className="btn btn-outline-primary float-right btn-sm" onClick={(e) => this.removeUser(e)}>Log out</button>
                            </div>

                            <SearchUser onFilterUser={this.filterUser} />

                            <div className="user-list">
                                <Scrollbars>
                                    {list.map((user, i) => (
                                        <ul className="list ripple" key={i} >
                                            {/*  */}
                                            <li className={"clearfix " + (user.name === this.state.receiverName ? "user-name-active" : "")}>
                                                <div className="about">
                                                    <div>
                                                        <ProfileUser userName={user.name} />
                                                        <div className={"name "} key={user.id} onClick={() => this.initializeChat(user.chatRoomID, user.name, user.chatRoomType)}>
                                                            {user.name}
                                                            {/* <Mutation mutation={DELETE_CHAT}>
                                                                {deleteChat => (
                                                                    <button className="del-icon btn btn-outline-danger btn-sm" onClick={(e) => this.deleteRoom(e, user.chatRoomID, this.state.loginUser.id, deleteChat)}><i className="fas fa-trash-alt"></i></button>
                                                                )}
                                                            </Mutation> */}
                                                        </div>
                                                    </div>
                                                </div>
                                            </li>
                                        </ul>
                                    ))}
                                </Scrollbars>
                            </div>

                        </div>
                        {this.state.triggerCreateChat && <CreateChat chatRoomID={this.state.chatRoomID} memberID={this.state.memberID} receiverName={this.state.receiverName} chatRoomType={this.state.chatRoomType} />}
                    </div>}

                </div>
            );
        }
    }
}

export default compose(
    graphql(DELETE_CHAT, { name: "deleteChat" }),
    graphql(USER_LOGIN, { options: (props) => ({ variables: { name: props.user } }) }), withApollo)(ShowUser);