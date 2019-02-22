import React from "react";
import { Mutation, compose, graphql, withApollo } from "react-apollo";
import gql from "graphql-tag";
import './showuser.css';
import { Scrollbars } from 'react-custom-scrollbars';

import CreateChat from '../create_chat/createChat';
import SearchUser from '../search_user/searchuser';
import ProfileUser from '../profile_user/profileuser';
import UserList from '../user_list/userlist';
// import NewMessage from '../newmessage';

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
            showChat: true
        }
        this.initializeChat = this.initializeChat.bind(this);
        this.filterUser = this.filterUser.bind(this);
        this.handleNewChatDialog = this.handleNewChatDialog.bind(this);
    }

    async initializeChat(chatRoomID, name) {
        this.setState({ chatRoomID: chatRoomID, memberID: this.state.loginUser.id, receiverName: name, display: 'show', triggerCreateChat: true });
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

    fetchUserFromQuery = async () => {
        const { client } = this.props;
        const result = await client.query({
            query: SHOW_USER,
            variables: {
                user: this.props.user
            }
        });
        this.setState({ userList: result.data.users, filterUserList: result.data.users })
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
        this.fetchMemberList();
    }

    fetchMemberList = async () => {
        const { client } = this.props;
        const result = await client.query({
            query: CHAT_ROOM_LIST,
            variables: {
                memberID: this.state.loginUser.id
            }
        });
        this.setState({ chatRoomUserList: result.data.chatRoomListByMemberId })
    }

    filterUser(userName) {
        let filterUserList = this.state.userList.filter((user) => {
            return user.userName.toLowerCase().includes(userName)
        })
        this.setState({ filterUserList: filterUserList })
    }

    removeUser(e) {
        e.preventDefault();
        this.props.onRemoveUser(e);
    }

    handleNewChatDialog(e){
        this.setState({showChat: !this.state.showChat})
    }

    render() {
        const data = this.props.data;
        if (data.loading) { return 'Loading'; }
        if (data.error) { return `${data.error}` }
        let list = this.state.filterUserList;
        const loginUserDetails = this.state.loginUser;
        const chatRoomuserList = this.state.chatRoomUserList;
        return (
            <div className={this.props.hidden === "show" ? "" : "hidden"}>

                <UserList list={list} loginUserDetalis={loginUserDetails} onInitializeChat={this.initializeChat} handleNewChatDialog={this.handleNewChatDialog}/>
                
                <div className={"row "+(this.state.showChat === true ? "" : "hidden" )}>
                    <div className="display-user col-md-4 col-lg-3">
                        <div className="user-title">
                            <p className="float-left">Welcome {this.props.user}</p>
                            <button className="btn btn-outline-primary float-right btn-sm" onClick={(e) => this.removeUser(e)}>Log out</button>
                        </div>

                        <SearchUser userListSearch={list} onFilterUser={this.filterUser} />

                        <div className="user-list">
                            <Scrollbars>
                                {chatRoomuserList.map((user, i) => (
                                    <ul className="list" key={i} >
                                        {/*  */}
                                        <li className={"clearfix " + (user.name === this.state.receiverName ? "user-name-active" : "")}>
                                            <div className="about">
                                                <div>
                                                    <ProfileUser userName={user.name} />
                                                    <div className={"name "} key={user.id} onClick={() => this.initializeChat(user.chatRoomID, user.name)}>{user.name}</div>
                                                </div>
                                            </div>
                                        </li>
                                    </ul>
                                ))}
                            </Scrollbars>
                        </div>

                    </div>
                    {this.state.triggerCreateChat && <CreateChat chatRoomID={this.state.chatRoomID} memberID={this.state.memberID} receiverName={this.state.receiverName}/>}
                </div>
                
            </div>
        );
    }
}

export default compose(
    graphql(USER_LOGIN, { options: (props) => ({ variables: { name: props.user } }) }), withApollo)(ShowUser);