import React from "react";
import { Mutation, compose, graphql, withApollo, Query } from "react-apollo";
import gql from "graphql-tag";
import './showuser.css';
import { Scrollbars } from 'react-custom-scrollbars';
import isEqual from 'lodash.isequal';

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
            memberListShow: true,
            loginError: '',
            newUserMessage: [],
            creatorId: ''
        }
        this.initializeChat = this.initializeChat.bind(this);
        this.filterUser = this.filterUser.bind(this);
        this.handleHideChatDialog = this.handleHideChatDialog.bind(this);
        this.handleShowChatDialog = this.handleShowChatDialog.bind(this);
        this.enableNewMemberSubscription = this.enableNewMemberSubscription.bind(this);
        this.leaveGroup = this.leaveGroup.bind(this);
    }

    async initializeChat(chatRoomID, name, chatRoomType) {
        this.setState({ chatRoomID: chatRoomID, memberID: this.state.loginUser.id, receiverName: name, display: 'show', triggerCreateChat: true, chatRoomType: chatRoomType, memberListShow: false });
        const { newUserMessage } = this.state;
        let tempArray = [];
        for (let i = 0; i < newUserMessage.length; i++) {
            if (newUserMessage[i] !== chatRoomID) {
                tempArray.push(newUserMessage[i]);
            }
        }
        this.setState({ newUserMessage: tempArray })
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

    componentDidUpdate(prevProps, prevState) {
        if (this.state.receiverName !== prevState.receiverName && this.state.receiverName!== '') {
            this.enableNewMemberSubscription();
        }
    }

    enableNewMemberSubscription() {
        this.props.data.subscribeToMore({
            document: CHAT_ROOM_LIST_SUBSCRIPTION,
            variables: { memberID: this.state.loginUser.id },
            updateQuery: (prev, { subscriptionData }) => {
                if (!subscriptionData.data) return prev;
                const { newUserMessage, chatRoomID } = this.state;
                const newMember = subscriptionData.data.chatRoomListByMember;
                if (!isEqual(this.state.filterUserList, newMember)) {
                    if (newMember[0].chatRoomID !== chatRoomID) {
                        newUserMessage.push(newMember[0].chatRoomID);
                    }
                }
                this.setState({ chatRoomUserList: newMember, filterUserList: newMember, newUserMessage });
            }
        })

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
        if (result.data.MemberLogIn === null) {
            this.setState({ loginError: result.errors })
            this.props.onLoginFail(this.state.loginError);
        } else {
            this.setState({ loginUser: result.data.MemberLogIn })
        }
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
        this.setState({ chatRoomUserList: result.data.chatRoomListByMemberId, filterUserList: result.data.chatRoomListByMemberId }, function (){
            this.enableNewMemberSubscription();
        });
    }

    filterUser(userName) {
        let filteredUserList = this.state.chatRoomUserList.filter((user) => {
            return user.name.toLowerCase().includes(userName)
        })
        this.setState({ filterUserList: filteredUserList })
    }

    deleteRoom = async (e, chatRoomID, memberID, deleteChatRoom) => {
        deleteChatRoom({ variables: { chatRoomID: chatRoomID, memberID: memberID } });
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

    // get count for repetated id
    getCount(arr) {
        var a = [], b = [], prev;
        arr.sort();
        for (var i = 0; i < arr.length; i++) {
            if (arr[i] !== prev) {
                a.push(arr[i]);
                b.push(1);
            } else {
                b[b.length - 1]++;
            }
            prev = arr[i];
        }
        return [a, b];
    }

    onNewMessageArrive(chatRoomID) {
        const { newUserMessage } = this.state;
        let m = this.getCount(newUserMessage);
        let userIdArray = m[0];
        let userCountArray = m[1];
        let mainIndex;
        for (let i = 0; i < userIdArray.length; i++) {
            if (userIdArray[i] === chatRoomID) {
                mainIndex = i;
                break;
            }
        }
        let mainCounter = userCountArray[mainIndex];
        console.log('Line ---- 286', mainCounter);

        for (let i = 0; i < newUserMessage.length; i++) {
            if (newUserMessage[i] === chatRoomID) {
                return (<span className={newUserMessage[i] === chatRoomID ? "newMessage" : ""}>{mainCounter}</span>);
            }
        }
    }

    leaveGroup() {
        this.setState({ triggerCreateChat: false });
    }

    render() {
        const data = this.props.data;
        if (data.loading) { return <div className="loader"></div>; }
        if (data.error) {
            this.props.onLoginFail(data.error.graphQLErrors[0].message);
            console.log('user list');
        }
        let { userList, newUserMessage } = this.state;
        let list = this.state.filterUserList;
        const loginUserDetails = this.state.loginUser;
        if (this.props.hidden) {
            return (
                <div>
                    <UserList list={userList} loginUserDetalis={loginUserDetails} onInitializeChat={this.initializeChat} handleHideChatDialog={this.handleHideChatDialog} handleShowChatDialog={this.handleShowChatDialog} />

                    {this.state.showChat && <div className="row raw">
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
                                            <li className={"clearfix " + (user.name === this.state.receiverName ? "user-name-active" : "")}>
                                                <div className="about">
                                                    <div>
                                                        <ProfileUser userName={user.name} />
                                                        <div className={"name "} key={user.id} onClick={() => this.initializeChat(user.chatRoomID, user.name, user.chatRoomType)}>
                                                            <p style={{ marginBottom: 0 }}>{user.name} {this.onNewMessageArrive(user.chatRoomID)}</p>
                                                            {user.chatRoomType === 'GROUP' ? <p style={{ marginBottom: '0', fontSize: '13px', color: '#bfbfbf' }}>{user.totalMember} Members</p> : null}
                                                        </div>

                                                    </div>
                                                </div>
                                            </li>
                                            <Mutation mutation={DELETE_CHAT_ROOM}>
                                                {deleteChatRoom => (
                                                    <button className="del-icon btn btn-outline-danger btn-sm" onClick={(e) => this.deleteRoom(e, user.chatRoomID, this.state.loginUser.id, deleteChatRoom)}><i className="fas fa-trash-alt"></i></button>
                                                )}
                                            </Mutation>
                                        </ul>

                                    ))}
                                </Scrollbars>
                            </div>

                        </div>
                        {this.state.triggerCreateChat && <CreateChat list={userList} chatRoomID={this.state.chatRoomID} memberID={this.state.memberID} receiverName={this.state.receiverName} chatRoomType={this.state.chatRoomType} leaveGroup={this.leaveGroup} />}
                    </div>}

                </div>
            );
        }
    }
}

export default compose(
    graphql(DELETE_CHAT_ROOM, { name: "deleteChat" }),
    graphql(USER_LOGIN, { options: (props) => ({ variables: { name: props.user } }) }), withApollo)(ShowUser);