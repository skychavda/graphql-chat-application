import React from 'react';
import gql from 'graphql-tag';
import { Mutation, compose, withApollo } from "react-apollo";
import graphql from 'graphql-anywhere';
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

class GroupInfo extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            memberList: [],
            inputBox: false,
            receiverName : props.receiverName
        }
        this.fetchMemberFromQuery = this.fetchMemberFromQuery.bind(this);
    }

    componentDidMount() {
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
        // console.log('Line ---- 41',result.data.memberListByChatRoomId);
        this.setState({ memberList: result.data.memberListByChatRoomId })
    }

    updateChatRoomName = async (e,updateChatRoomDetail) =>{
        if(e.key==='Enter'){
            const result = await updateChatRoomDetail({variables:{chatRoomID: this.props.chatRoomID, chatRoomName: e.target.value, updateByID: this.props.memberID}})
            this.setState({inputBox: false, receiverName: result.data.updateChatRoomDetail.chatRoomName})
            console.log('Line ---- 74',result);
        }
    }

    toggleInputBox() {
        this.setState({ inputBox: !this.state.inputBox })
    }

    render() {
        const memberList = this.state.memberList;
        const receiverName = this.state.receiverName;
        return (
            <div className="group-info">
                <ul>
                    <li>
                        <Mutation mutation={UPDATE_CHAT_ROOM_DETAILS}>
                            {updateChatRoomDetail => (
                                this.state.inputBox === true ? <input type="text" onKeyPress={(e)=>this.updateChatRoomName(e,updateChatRoomDetail)}/> : <h4>{receiverName}</h4>
                            )}
                        </Mutation>
                    </li>
                    <li><i className="fas fa-edit" onClick={() => this.toggleInputBox()}></i></li>
                </ul>
                {memberList.map((list, i) => (
                    <p key={i}>{list.member.userName}</p>
                ))}
                <div>
                    <button>Add participent</button>
                </div>
            </div>
        );
    }
}

export default compose(withApollo)(GroupInfo);