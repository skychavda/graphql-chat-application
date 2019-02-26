import React from 'react';
import gql from "graphql-tag";
import { Mutation, compose, withApollo, graphql } from "react-apollo";
import { Scrollbars } from 'react-custom-scrollbars';
import ProfileUser from '../profile_user/profileuser';
import SearchUser from '../search_user/searchuser';
import './groupinfo.css';

const MEMBER_LIST_BY_CHATROOM = gql`
    query memberListByChatRoomId($chatRoomID:ID!, $memberID:ID!){
    memberListByChatRoomId(chatRoomID:$chatRoomID,memberID:$memberID){
        id
        member{
            id
            userName
        }
        chatRoomID
        joinAt
    }
}
`;

const UPDATE_CHAT_ROOM_DETAILS = gql`
    mutation updateChatRoomDetail($chatRoomID:ID!,$chatRoomName:String!,$updateByID:ID!){
        updateChatRoomDetail(input:{
            chatRoomID: $chatRoomID,
            chatRoomName: $chatRoomName,
            updateByID: $updateByID
        }){
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
            }
            createdAt
        }
    }
`;

const NEW_CHAT_ROOM_MEMBER = gql`
    mutation newChatRoomMembers($chatRoomID:ID!,$memberIDs:[ID!]){
        newChatRoomMembers(input:{
            chatRoomID: $chatRoomID,
            memberIDs: $memberIDs
        })
    }
`;

const groupMemberList = [];

class GroupInfo extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            memberList: [],
            inputBox: false,
            receiverName: props.receiverName,
            messages: [],
            userList: props.list,
            filterUserList: props.list,
            participentList: false
        }
        this.fetchMemberFromQuery = this.fetchMemberFromQuery.bind(this);
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
        this.fetchMemberFromQuery();
    }

    fetchMemberFromQuery = async () => {
        const { client } = this.props;
        const result = await client.query({
            query: MEMBER_LIST_BY_CHATROOM,
            variables: {
                chatRoomID: this.props.chatRoomID, memberID: this.props.memberID
            }
        })
        this.setState({ memberList: result.data.memberListByChatRoomId })
    }

    updateChatRoomName = async (e, updateChatRoomDetail) => {
        if (e.key === 'Enter') {
            const result = await updateChatRoomDetail({ variables: { chatRoomID: this.props.chatRoomID, chatRoomName: e.target.value, updateByID: this.props.memberID } })
            this.setState({ inputBox: false, receiverName: result.data.updateChatRoomDetail.chatRoomName })
            console.log('Line ---- 74', result);
        }
    }

    toggleInputBox() {
        this.setState({ inputBox: !this.state.inputBox })
    }

    addParticipent() {
        this.setState({ participentList: !this.state.participentList })
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

    handleAddMember = async (e, newChatRoomMembers) => {
        const result = await newChatRoomMembers({ variables: { chatRoomID: this.props.chatRoomID, memberIDs: groupMemberList } })
        e.preventDefault();
    }

    render() {
        const memberList = this.state.memberList;
        const receiverName = this.state.receiverName;
        const list = this.state.filterUserList;
        return (
            <div className="group-info row">
                <div className="col-md-6">
                    <div style={{ textAlign: 'center', margin: '10px auto' }}>
                        <ul className="ul">
                            <li>
                                <Mutation mutation={UPDATE_CHAT_ROOM_DETAILS}>
                                    {updateChatRoomDetail => (
                                        this.state.inputBox === true ? <input type="text" onKeyPress={(e) => this.updateChatRoomName(e, updateChatRoomDetail)} /> : <h4>{receiverName}</h4>
                                    )}
                                </Mutation>
                            </li>
                            <li><i className="fas fa-edit" onClick={() => this.toggleInputBox()}></i></li>
                        </ul>
                    </div>
                    <div className="participent-list">
                        <div className="participent-title">Participents</div>
                        <div className="participent-name">
                            <ul>
                                <li>
                                    {memberList.map((list, i) => (
                                        <div>
                                            <ProfileUser userName={list.member.userName} />
                                            <div key={i} className="name">{list.member.userName}</div>
                                        </div>
                                    ))}
                                </li>
                            </ul>
                        </div>
                    </div>
                    <div>
                        <div style={{ textAlign: 'center', margin: '10px auto' }}><button className="btn btn-md btn-outline-primary" onClick={() => this.addParticipent()}>Add participent</button></div>
                    </div>
                </div>
                {
                    this.state.participentList &&
                    <div className="add-member-list-box col-md-6">
                        <SearchUser onFilterUser={this.filterUser} />
                        <Scrollbars>
                            {list.map((user, i) => (
                                <ul className="list ripple" key={i} >
                                    <li className={"clearfix "}>
                                        <div className="about">
                                            <div>
                                                <ProfileUser userName={user.userName} />
                                                <div className={"name "} key={user.id} onClick={(e) => this.addUserToGroupList(e, user.id)}>
                                                    {user.userName}
                                                    <div className={user.isChecked === true ? "arraw" : "check-box"}></div>
                                                </div>
                                            </div>
                                        </div>
                                    </li>
                                </ul>
                            ))}

                            <div style={{ textAlign: 'center', margin: '10px auto' }}>
                                <Mutation mutation={NEW_CHAT_ROOM_MEMBER}>
                                    {newChatRoomMembers => (
                                        <button style={{ textTransform: 'uppercase' }} className="btn btn-outline-primary btn-md" onClick={(e) => this.handleAddMember(e, newChatRoomMembers)}>add member</button>
                                    )}
                                </Mutation>
                            </div>
                        </Scrollbars>
                    </div>
                }
            </div>
        );
    }
}

export default compose(
    graphql(UPDATE_CHAT_ROOM_DETAILS, { name: 'updateChatRoomDetails' }),
    graphql(NEW_CHAT_ROOM_MEMBER, { name: 'newChatRoomMember' }),
    graphql(MEMBER_LIST_BY_CHATROOM),
    withApollo)(GroupInfo);